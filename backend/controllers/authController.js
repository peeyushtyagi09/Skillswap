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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const data = JSON.stringify({ username, hashedPassword });
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


// ---- Verify Register OTP ----
exports.verifyRegisterOtp = async (req, res) => {
  let { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    email = normalizeEmail(email);

    const temp = await TempRegistration.findOne({ email });
    if (!temp || !temp.otpHash || !temp.otpExpiry) {
      return res.status(400).json({ message: 'No registration in progress' });
    }

    if (temp.otpLockedUntil && temp.otpLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    if (Date.now() > temp.otpExpiry.getTime()) {
      await TempRegistration.deleteOne({ _id: temp._id });
      return res.status(400).json({ message: 'OTP expired' });
    }

    const ok = await verifyHash(otp, temp.otpHash);
    if (!ok) {
      temp.otpAttempts += 1;
      if (temp.otpAttempts >= MAX_OTP_ATTEMPTS) {
        temp.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
        temp.otpAttempts = 0;
      }
      await temp.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Success: Create user
    const decryptedData = JSON.parse(decrypt(temp.encryptedData));
    const user = new User({
      Username: decryptedData.username,
      email,
      password: decryptedData.hashedPassword, // pre-hashed password
    });
    await user.save();
    await TempRegistration.deleteOne({ _id: temp._id });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.cookie('jwt', refreshToken, cookieOptions);

    return res.status(201).json(buildAuthResponse(user, accessToken));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---- Login (password step) ----
exports.loginUser = async (req, res) => {
  let { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = normalizeEmail(email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.passwordLockedUntil && user.passwordLockedUntil > Date.now()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    const validPassword = await user.matchPassword(password);
    if (!validPassword) {
      user.passwordAttempts = (user.passwordAttempts || 0) + 1;
      if (user.passwordAttempts >= MAX_PASSWORD_ATTEMPTS) {
        user.passwordLockedUntil = new Date(Date.now() + PASSWORD_LOCKOUT_MINUTES * 60 * 1000);
        user.passwordAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset password attempts
    user.passwordAttempts = 0;
    user.passwordLockedUntil = undefined;
    await user.save();

    // Always require email OTP
    return res.json({ id: user._id, email: user.email, need2fa: true, method: 'email' });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: error.message });
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
    res.cookie('jwt', refreshToken, cookieOptions);

    return res.json(buildAuthResponse(user, accessToken));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ---- Refresh access token from refresh cookie ----
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.jwt;
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
  res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });

  return res.json({ message: 'Logged out' });
};

// ---- Delete Account ----
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });

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