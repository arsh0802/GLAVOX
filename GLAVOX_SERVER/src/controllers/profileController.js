const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Log the request body and headers for debugging
    console.log('Request headers:', req.headers);
    console.log('Raw request body:', req.body);
    console.log('User ID:', req.userId);

    // Create update object with only the fields that are provided
    const updateData = {};
    
    // List of allowed fields to update
    const allowedFields = [
      'name',
      'bio',
      'email',
      'contact',
      'linkedin',
      'github',
      
    ];
    
    // Add only the fields that are present in the request
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        updateData[field] = req.body[field];
      }
    });

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: 'Please provide at least one field to update',
        allowedFields: allowedFields
      });
    }

    console.log('Update data:', updateData);

    // Update the user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePicture = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profilePicture } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile picture updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Error in updateProfilePicture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
