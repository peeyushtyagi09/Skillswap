const express = require('express');
const multer = require('multer'); 
const { v2: cloudinary} = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();


/* ------------------- CLOUDINARY CONFIG ------------------- */

//  Configure Cloudinary ( Use you .env Keys)
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
})

// Cloudinary storage for images
const cloudinaryImagesStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		floder: 'profile_pictures', // Floder inside Cloudinary
		allowed_formates: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
		transformation: [{ quality: 'auto', fetch_format: 'auto'}],
	},
});

// For certificates (docs and images)
const cloudinaryDocStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'certificates',
		allowed_formates: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
	},
});

// Multer middleware instances
const uploadImageCloud = multer({ storage: cloudinaryImagesStorage});
const uploadDocCloud = multer({ storage: cloudinaryDocStorage});


/* ------------------- ROUTES ------------------- */

/**
 * POST /api/upload/profile-picture
 * Uploads profile picture to Cloudinary
 */ 
router.post('/profile-picture', uploadImageCloud.single('profilePicture'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	
	res.status(200).json({ 
		imageUrl: req.file.path,
		publicId: req.file.filename,
		message: 'Profile picture uploaded successfully (cloud)'
	});
});

/**
 * POST /api/upload/certificate
 * Uploads certificate (PDF, DOCX, or image) to Cloudinary
 */
router.post('/certificate', uploadDocCloud.single('certificate'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	res.status(200).json({ 
		fileUrl: req.file.path,  
		publicId: req.file.filename,
		originalName: req.file.originalname,
		message: 'Certificate uploaded successfully (cloud)'
	});
});

module.exports = router;