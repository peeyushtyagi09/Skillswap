const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const User = require('../models/User');
const TempRegistration = require('../models/TempRegistration');
const { encrypt, decrypt } = require('../utils/crypto');

// ---- Security and throttle config ----
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 10;
const MAX_PASSWORD_ATTEMPTS = 10;
const PASSWORD_LOCKOUT_MINUTES = 15;
const EMAIL_OTP_RESEND_SECONDS = 90; // throttle email OTP send

// ---- Helpers ----
const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none', // ✅ required for cross-site cookies
  maxAge: 7 * 24 * 60 * 60 * 1000,
};


// Generate token
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// transporter (ensure env vars set)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});




const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

const hashString = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

const verifyHash = async (plain, hash) => bcrypt.compare(plain, hash);

const buildAuthResponse = (user, accessToken, extra = {}) => ({
  id: user._id,
  Username: user.Username,
  email: user.email,
  accessToken,
  ...extra,
});

// ---- Register (disabled; use OTP flow) ----
exports.registerUser = async (req, res) => {
  return res.status(410).json({ message: 'Use /request-register-otp and /verify-register-otp instead' });
};


// helper: send login OTP with throttle + lockout using User fields
const sendLoginOtp = async (user) => {
  const now = Date.now();

  // lockout window
  if (user.otpLockedUntil && user.otpLockedUntil > now) {
    const ms = user.otpLockedUntil - now;
    const mins = Math.ceil(ms / 60000);
    const err = new Error(`Too many attempts. Try again in ~${mins}m`);
    err.status = 429;
    throw err;
  }

  // throttle resend
  if (user.otpLastSentAt && now - user.otpLastSentAt.getTime() < EMAIL_OTP_RESEND_SECONDS * 1000) {
    const wait = Math.ceil((EMAIL_OTP_RESEND_SECONDS * 1000 - (now - user.otpLastSentAt.getTime())) / 1000);
    const err = new Error(`Please wait ${wait}s before requesting another OTP`);
    err.status = 429;
    throw err;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  user.otpHash = await hashString(otp);
  user.otpExpiry = new Date(now + 5 * 60 * 1000); // 5 minutes
  user.otpAttempts = 0;
  user.otpLockedUntil = undefined;
  user.otpLastSentAt = new Date(now);
  await user.save();

  await sendEmail(user.email, `${process.env.APP_NAME} Login OTP`, `Your OTP is ${otp}. It expires in 5 minutes.`);
};
// optional endpoint to explicitly request login OTP (reuses helper)
exports.requestEmailOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await sendLoginOtp(user);
    return res.json({ message: 'OTP sent' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Server error' });
  }
};
// --- VERIFY EMAIL OTP (Step 2: issues tokens on success) ---
exports.verifyEmailOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP requested' });
    }

    // lockout check
    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    // expiry check
    if (Date.now() > user.otpExpiry.getTime()) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired' });
    }

    // verify
    const ok = await verifyHash(otp, user.otpHash);
    if (!ok) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
        user.otpAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // success -> clear otp fields
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save();

    // tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // one cookie name everywhere; reuse your cookieOptions
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json(buildAuthResponse(user, accessToken));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ---- Request Register OTP ---- 
exports.requestRegisterOtp = async (req, res) => {
  let { username, email, password } = req.body;
  try {
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    email = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Clean up any old temp for this email
    let temp = await TempRegistration.findOne({ email });

    const now = Date.now();
    if (temp && temp.otpLastSentAt && now - temp.otpLastSentAt.getTime() < EMAIL_OTP_RESEND_SECONDS * 1000) {
      const wait = Math.ceil((EMAIL_OTP_RESEND_SECONDS * 1000 - (now - temp.otpLastSentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another OTP` });
    }

    if (!temp) temp = new TempRegistration({ email });

    // Hash password and encrypt data
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    const data = JSON.stringify({ username, password });
    temp.encryptedData = encrypt(data);

    // Generate and hash OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    temp.otpHash = await hashString(otp);
    temp.otpExpiry = new Date(now + 5 * 60 * 1000); // 5 min expiry
    temp.otpLastSentAt = new Date(now);
    temp.otpAttempts = 0;
    temp.otpLockedUntil = undefined;

    await temp.save();

    await sendEmail(email, `${process.env.APP_NAME} Registration OTP`, `Your OTP is ${otp}. It expires in 5 minutes.`);

    return res.json({ message: 'OTP sent to your email', email });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// VERIFY EMAIL OTP: (unchanged mostly) issues tokens on success
exports.verifyEmailOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP requested' });
    }

    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired' });
    }

    const ok = await verifyHash(otp, user.otpHash);
    if (!ok) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
        user.otpAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // success -> clear otp fields
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save();

    // tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // use refreshToken cookie name consistently
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json(buildAuthResponse(user, accessToken));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};


// LOGIN: step 1 - validate password then send OTP (do NOT issue tokens here)
exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Always require email OTP on successful password
    await sendLoginOtp(user);

    return res.json({ need2fa: true, method: 'email' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Server error' });
  }
};

// ---- Email OTP for Login ----
exports.requestEmailOtp = async (req, res) => {
  let { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // lockout check
    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    // throttle check
    const now = Date.now();
    if (user.otpLastSentAt && now - user.otpLastSentAt.getTime() < EMAIL_OTP_RESEND_SECONDS * 1000) {
      const wait = Math.ceil((EMAIL_OTP_RESEND_SECONDS * 1000 - (now - user.otpLastSentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another OTP` });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    user.otpHash = await hashString(otp);
    user.otpExpiry = new Date(now + 5 * 60 * 1000); // 5 minutes
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    user.otpLastSentAt = new Date(now);
    await user.save();

    await sendEmail(user.email, `${process.env.APP_NAME} Login OTP`, `Your OTP is ${otp}. It expires in 5 minutes.`);
    return res.json({ message: 'OTP sent' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  let { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP requested' });
    }

    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired' });
    }

    const ok = await verifyHash(otp, user.otpHash);
    if (!ok) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
        user.otpAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // success: clear otp fields
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, cookieOptions);


    return res.json(buildAuthResponse(user, accessToken));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ---- Refresh access token from refresh cookie ----
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = generateAccessToken(user._id);
    return res.json(buildAuthResponse(user, accessToken));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---- Logout ----
exports.logoutUser = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });
  return res.json({ message: 'Logged out' });
};

// ---- Delete Account ----
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });
    return res.json({ message: 'Account deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---- getMe ----
exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    // Get user profile to include profile picture
    const UserProfile = require('../models/UserProfile');
    const profile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });

    return res.json({
      id: req.user._id,
      Username: req.user.Username,
      email: req.user.email,
      profilePic: profile?.profilePic || null,
      name: profile?.username || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---- get all users ----
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }, 'Username email _id');

    const UserProfile = require('../models/UserProfile');
    const userEmails = users.map((u) => u.email.toLowerCase());

    const profiles = await UserProfile.find({
      email: { $in: userEmails },
    });

    const profileMap = {};
    profiles.forEach((profile) => {
      profileMap[profile.email] = profile;
    });

    const usersWithProfiles = users.map((user) => {
      const profile = profileMap[user.email.toLowerCase()];
      return {
        id: user._id,
        Username: user.Username,
        name: profile?.username || null,
        age: profile?.age || null,
        email: user.email,
        profilePic: profile?.profilePic || null,
        skillsHave: profile?.skillsHave || [],
        skillsWant: profile?.skillsWant || [],
      };
    });

    return res.json(usersWithProfiles);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({ message: error.message });
  }
};