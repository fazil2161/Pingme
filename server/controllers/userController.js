const { validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/:userId
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user ? req.user._id : null;

    const user = await User.findById(userId)
      .populate('followers', 'username profilePicture isVerified')
      .populate('following', 'username profilePicture isVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({
      author: userId,
      isDeleted: false
    });

    // Add additional metadata
    const userObj = user.toObject();
    userObj.postsCount = postsCount;
    userObj.followersCount = user.followers.length;
    userObj.followingCount = user.following.length;
    
    // Check if current user is following this user
    if (currentUserId) {
      userObj.isFollowing = user.followers.some(follower => 
        follower._id.toString() === currentUserId.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        user: userObj
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { username, bio, location, website } = req.body;

    // Check if username is already taken (if being changed)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Handle profile picture upload
    let profilePicture = req.user.profilePicture;
    if (req.file) {
      const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
      profilePicture = `${baseUrl}/uploads/profile-pics/${req.file.filename}`;
    }

    // Update user profile
    const updateData = {
      username: username ? username.toLowerCase().trim() : req.user.username,
      bio: bio ? bio.trim() : req.user.bio,
      location: location ? location.trim() : req.user.location,
      website: website ? website.trim() : req.user.website,
      profilePicture
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} is already taken`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/:userId/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Can't follow yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.isFollowing(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Follow the user
    await currentUser.follow(targetUserId);

    // Create notification
    await Notification.createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      relatedUser: currentUserId
    });

    // Send real-time notification
    if (req.io) {
      req.io.notifyUser(targetUserId, {
        type: 'follow',
        message: `${currentUser.username} started following you`,
        sender: {
          _id: currentUser._id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture
        },
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'User followed successfully',
      data: {
        isFollowing: true
      }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/:userId/unfollow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Can't unfollow yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if not following
    if (!currentUser.isFollowing(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Unfollow the user
    await currentUser.unfollow(targetUserId);

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false
      }
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:userId/followers
// @access  Public
const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username profilePicture bio isVerified',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          currentPage: page,
          hasNextPage: user.followers.length === limit,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:userId/following
// @access  Public
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username profilePicture bio isVerified',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          currentPage: page,
          hasNextPage: user.following.length === limit,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio isVerified')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        users,
        searchQuery: q,
        pagination: {
          currentPage: parseInt(page),
          hasNextPage: users.length === parseInt(limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    // Get users that current user is not following
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following || [];

    const suggestedUsers = await User.find({
      _id: { $nin: [...followingIds, currentUserId] }
    })
    .select('username profilePicture bio isVerified followersCount')
    .sort({ followersCount: -1 }) // Sort by popularity
    .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        users: suggestedUsers
      }
    });

  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggested users'
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers
}; 