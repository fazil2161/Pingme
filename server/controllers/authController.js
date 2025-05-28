const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, getCookieOptions } = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, bio = '', location = '', website = '' } = req.body;

    // Log the received data for debugging
    console.log('Registration attempt:', {
      username,
      email,
      bio,
      location,
      website,
      hasFile: !!req.file
    });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      console.log(`User already exists with ${field}:`, existingUser.email === email ? email : username);
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Handle profile picture upload
    let profilePicture = 'https://via.placeholder.com/150x150.png?text=User';
    if (req.file) {
      const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
      profilePicture = `${baseUrl}/uploads/profile-pics/${req.file.filename}`;
      console.log('Profile picture uploaded:', profilePicture);
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      profilePicture,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim()
    });

    await user.save();
    console.log('User created successfully:', user.username);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.log('Duplicate key error for field:', field);
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      console.log('Mongoose validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Find user by email and include password for comparison
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password +refreshToken');

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log(`User found: ${user.username} (${user.email})`);
    console.log(`Has password: ${!!user.password}`);

    // Check password
    const isValidPassword = await user.comparePassword(password);
    console.log(`Password validation result: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update refresh token in database
    user.refreshToken = refreshToken;
    user.lastActive = new Date();
    await user.save();

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Private (requires refresh token)
const refreshToken = async (req, res) => {
  try {
    // The user is attached to req by authenticateRefreshToken middleware
    const user = req.user;

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.lastActive = new Date();
    await user.save();

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = req.user;

    // Clear refresh token from database
    user.refreshToken = null;
    await user.save();

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username profilePicture isVerified')
      .populate('following', 'username profilePicture isVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // TODO: Implement proper account deletion
    // This should include:
    // 1. Deleting all user's posts
    // 2. Deleting all user's comments
    // 3. Removing user from other users' followers/following lists
    // 4. Deleting all user's notifications
    // 5. Removing user's likes from posts and comments
    // For now, we'll just mark the account as deleted
    
    await User.findByIdAndDelete(userId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
};

// @desc    Verify account (for future email verification)
// @route   POST /api/auth/verify-account
// @access  Public
const verifyAccount = async (req, res) => {
  try {
    const { token } = req.body;

    // TODO: Implement email verification logic
    // This would involve:
    // 1. Verifying the email verification token
    // 2. Marking the user account as verified
    // 3. Updating the isVerified field

    res.status(200).json({
      success: true,
      message: 'Account verification feature coming soon'
    });

  } catch (error) {
    console.error('Account verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account verification'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  deleteAccount,
  verifyAccount
}; 