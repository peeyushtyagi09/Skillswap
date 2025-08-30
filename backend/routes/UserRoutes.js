const express = require("express");
const { 
    registerUser, 
    loginUser, 
    logoutUser, 
    deleteAccount, 
    getMe, 
    getAllUsers,
    requestEmailOtp,
    verifyEmailOtp,
    refreshToken,
    requestRegisterOtp,
    verifyRegisterOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Registration with OTP
router.post("/request-register-otp", protect, requestRegisterOtp);
router.post("/verify-register-otp", protect, verifyRegisterOtp);

// Original register (disabled or kept for legacy)
router.post("/register", protect, registerUser);
router.post("/login", protect, loginUser);

// Email OTP for login
router.post("/request-email-otp", protect, requestEmailOtp);
router.post("/verify-email-otp", protect, verifyEmailOtp);

router.post("/refresh", protect, refreshToken);
router.post("/logout", protect, logoutUser);
router.delete("/delete", protect, deleteAccount);
router.get("/me", protect, getMe);
router.get("/allUser", protect, getAllUsers);

module.exports = router;