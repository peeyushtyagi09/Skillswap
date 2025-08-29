const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const ensureUploadsDir = () => {
	const uploadDir = path.join(__dirname, '../uploads'); // save to backend/uploads
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}
	return uploadDir;
};

// Set up storage engine for multer
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = ensureUploadsDir();
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const basename = path.basename(file.originalname, ext);
		cb(null, basename + '-' + Date.now() + ext);
	}
});

// File filter for images
const imageFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/gif' ||
		file.mimetype === 'image/webp'
	) {
		cb(null, true);
	} else {
		cb(new Error('Only image files are allowed'), false);
	}
};

// File filter for documents (certificates)
const documentFilter = (req, file, cb) => {
	if (
		file.mimetype === 'application/pdf' ||
		file.mimetype === 'application/msword' ||
		file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png'
	) {
		cb(null, true);
	} else {
		cb(new Error('Only PDF, Word documents, and images are allowed for certificates'), false);
	}
};

// Multer instances
const uploadImage = multer({
	storage,
	fileFilter: imageFilter,
	limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadDocument = multer({
	storage,
	fileFilter: documentFilter,
	limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/upload/profile-picture
router.post('/profile-picture', uploadImage.single('profilePicture'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
	console.log('Profile picture uploaded:', {
		filename: req.file.filename,
		imageUrl: imageUrl,
		originalName: req.file.originalname
	});
	res.status(200).json({ 
		imageUrl,
		filename: req.file.filename,
		message: 'Profile picture uploaded successfully'
	});
});

// POST /api/upload/certificate
router.post('/certificate', uploadDocument.single('certificate'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	
	const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
	res.status(200).json({ 
		fileUrl,
		filename: req.file.filename,
		originalName: req.file.originalname,
		message: 'Certificate uploaded successfully'
	});
});

// POST /api/upload/image (keep existing for backward compatibility)
router.post('/image', uploadImage.single('image'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
	res.status(200).json({ imageUrl });
});



module.exports = router;