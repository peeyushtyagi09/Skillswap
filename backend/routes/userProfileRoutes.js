const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    checkProfile,
    createProfile,
    updateProfile,
    updateProfilePicture,
    addCertificate,
    removeCertificate,
    getProfile,
    getProfileByUserId,
    testUpdateProfilePicture,
    testUpdateProfilePictureById
} = require('../controllers/userProfileController');

// All routes require authentication
router.use(protect);

// Check if user has profile
router.get('/check', checkProfile);

// Create profile
router.post('/create', createProfile);

// Update profile
router.put('/update', updateProfile);

// Update profile picture
router.put('/profile-picture', updateProfilePicture);

// Add certificate
router.post('/certificates', addCertificate);

// Remove certificate
router.delete('/certificates/:certificateId', removeCertificate);

// Get profile (self)
router.get('/', getProfile);

// Get profile by another user's id
router.get('/user/:userId', getProfileByUserId);

// Test endpoint for profile picture update
router.put('/test-profile-picture', testUpdateProfilePicture);

// Test endpoint for profile picture update by ID
router.put('/test-profile-picture/:profileId', testUpdateProfilePictureById);

module.exports = router;