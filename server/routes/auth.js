const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  deleteAccount,
  verifyAccount
} = require('../controllers/authController');

// Import middleware
const { 
  authenticateToken, 
  authenticateRefreshToken 
} = require('../middleware/auth');
const { uploadSingle } = require('../utils/upload');

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('bio')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Bio cannot exceed 160 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') {
        return true; // Allow empty values
      }
      // Only validate URL format if value is provided
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(value)) {
        throw new Error('Please provide a valid website URL starting with http:// or https://');
      }
      return true;
    })
    .isLength({ max: 200 })
    .withMessage('Website URL cannot exceed 200 characters')
    .trim()
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  uploadSingle('profilePicture'),
  registerValidation,
  register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
  loginValidation, 
  login
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Private (requires refresh token)
router.post('/refresh-token', 
  authenticateRefreshToken, 
  refreshToken
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', 
  authenticateToken, 
  logout
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', 
  authenticateToken, 
  getMe
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', 
  authenticateToken,
  changePasswordValidation,
  changePassword
);

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account
// @access  Private
router.delete('/delete-account', 
  authenticateToken,
  deleteAccountValidation,
  deleteAccount
);

// @route   POST /api/auth/verify-account
// @desc    Verify user account (email verification)
// @access  Public
router.post('/verify-account', 
  body('token').notEmpty().withMessage('Verification token is required'),
  verifyAccount
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', 
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  (req, res) => {
    // TODO: Implement forgot password functionality
    res.status(200).json({
      success: true,
      message: 'Password reset functionality coming soon'
    });
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', 
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  (req, res) => {
    // TODO: Implement reset password functionality
    res.status(200).json({
      success: true,
      message: 'Password reset functionality coming soon'
    });
  }
);

module.exports = router; 