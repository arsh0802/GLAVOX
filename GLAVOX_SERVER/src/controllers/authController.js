const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: "User already exists" 
      });
    }
    
    // Create new user with plain password
    const user = new User({ 
      name, 
      email: email.toLowerCase().trim(), 
      password: password  // Store password directly without hashing
    });
    
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.status(201).json({ 
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Email and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
    }

    // Direct password comparison
    if (password !== user.password) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// =================== FORGOT PASSWORD ===================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '15m' }
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset Your Password - GLAVOX',
      html: `
        <h3>Reset Your Password</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 15 minutes only.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Reset password link sent to your email.' });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// =================== RESET PASSWORD ===================
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Store new password directly without hashing
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(400).json({ error: "Invalid or expired token", details: err.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword
};