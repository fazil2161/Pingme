const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers
const {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers
} = require('../controllers/userController');

// Import middleware
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadSingle } = require('../utils/upload');

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Bio cannot exceed 160 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
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
];

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', searchUsers);

// @route   GET /api/users/suggestions
// @desc    Get suggested users to follow
// @access  Private
router.get('/suggestions', authenticateToken, getSuggestedUsers);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticateToken,
  uploadSingle('profilePicture'),
  updateProfileValidation,
  updateProfile
);

// @route   GET /api/users/:userId
// @desc    Get user profile
// @access  Public
router.get('/:userId', optionalAuth, getUserProfile);

// @route   POST /api/users/:userId/follow
// @desc    Follow a user
// @access  Private
router.post('/:userId/follow', authenticateToken, followUser);

// @route   POST /api/users/:userId/unfollow
// @desc    Unfollow a user
// @access  Private
router.post('/:userId/unfollow', authenticateToken, unfollowUser);

// @route   GET /api/users/:userId/followers
// @desc    Get user followers
// @access  Public
router.get('/:userId/followers', getFollowers);

// @route   GET /api/users/:userId/following
// @desc    Get user following
// @access  Public
router.get('/:userId/following', getFollowing);

module.exports = router; 