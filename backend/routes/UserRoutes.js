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
router.post("/request-register-otp",  requestRegisterOtp);
router.post("/verify-register-otp",  verifyRegisterOtp);

// Original register (disabled or kept for legacy)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Email OTP for login
router.post("/request-email-otp", requestEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.get("/refresh",  refreshToken);
router.post("/logout", protect, logoutUser);
router.delete("/delete", protect, deleteAccount);
router.get("/me", protect, getMe);
router.get("/allUser", protect, getAllUsers);

module.exports = router;