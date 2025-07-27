const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please fill a valid email address']
  },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: [500, 'Bio cannot exceed 500 characters'] },
  contact: { 
    type: String, 
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
    default: ''
  },
  address: { 
    type: String, 
    default: '' 
  },
  dateOfBirth: { 
    type: Date, 
    default: null 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    default: 'other' 
  },
  linkedin: { 
    type: String, 
    default: '' 
  },
  github: { 
    type: String, 
    default: '' 
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Method to remove sensitive data from user object
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);