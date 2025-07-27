const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const profileController = require('../controllers/profileController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profile-pictures');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get user profile
router.get('/me', auth, profileController.getProfile);

// Update user profile (without picture)
router.put('/update', auth, profileController.updateProfile);

// Update profile picture (separate route)
router.put('/update-picture', auth, upload.single('profilePicture'), profileController.updateProfilePicture);

module.exports = router; 