const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers
const {
  createPost,
  getFeed,
  getPost,
  toggleLike,
  createComment,
  getUserPosts,
  searchPosts,
  deletePost,
  getTrendingHashtags,
  getExplorePosts
} = require('../controllers/postController');

// Import middleware
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadSingle } = require('../utils/upload');

// Validation rules
const createPostValidation = [
  body('text')
    .isLength({ min: 1, max: 280 })
    .withMessage('Post text must be between 1 and 280 characters')
    .trim()
];

const createCommentValidation = [
  body('text')
    .isLength({ min: 1, max: 280 })
    .withMessage('Comment text must be between 1 and 280 characters')
    .trim()
];

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', 
  authenticateToken,
  uploadSingle('postImage'),
  createPostValidation,
  createPost
);

// @route   GET /api/posts/feed
// @desc    Get user's feed (posts from followed users)
// @access  Private
router.get('/feed', 
  authenticateToken, 
  getFeed
);

// @route   GET /api/posts/explore
// @desc    Get explore posts (popular/recent posts)
// @access  Public
router.get('/explore',
  optionalAuth,
  getExplorePosts
);

// @route   GET /api/posts/trending
// @desc    Get trending hashtags
// @access  Public
router.get('/trending', 
  getTrendingHashtags
);

// @route   GET /api/posts/search
// @desc    Search posts by hashtag or text
// @access  Public
router.get('/search', 
  optionalAuth,
  searchPosts
);

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Public
router.get('/user/:userId', 
  optionalAuth,
  getUserPosts
);

// @route   GET /api/posts/:id
// @desc    Get a single post
// @access  Public
router.get('/:id', 
  optionalAuth,
  getPost
);

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/:id/like', 
  authenticateToken, 
  toggleLike
);

// @route   POST /api/posts/:id/comment
// @desc    Comment on a post
// @access  Private
router.post('/:id/comment', 
  authenticateToken,
  createCommentValidation,
  createComment
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', 
  authenticateToken, 
  deletePost
);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', 
  authenticateToken,
  createPostValidation,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user._id;
      const { text } = req.body;

      const Post = require('../models/Post');
      const post = await Post.findById(postId);

      if (!post || post.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check if user owns the post
      if (post.author.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own posts'
        });
      }

      // Save current text to edit history
      if (post.text !== text) {
        post.editHistory.push({
          text: post.text,
          editedAt: new Date()
        });
        post.lastEdited = new Date();
      }

      // Update post text
      post.text = text;
      await post.save();

      // Populate author information
      await post.populate('author', 'username profilePicture isVerified');

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: {
          post
        }
      });

    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating post'
      });
    }
  }
);

// @route   POST /api/posts/:id/retweet
// @desc    Retweet/Unretweet a post
// @access  Private
router.post('/:id/retweet', 
  authenticateToken,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user._id;

      const Post = require('../models/Post');
      const Notification = require('../models/Notification');
      
      const post = await Post.findById(postId).populate('author', 'username');

      if (!post || post.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const isCurrentlyRetweeted = post.isRetweetedBy(userId);
      let result;

      if (isCurrentlyRetweeted) {
        result = post.unretweet(userId);
      } else {
        result = post.retweet(userId);
        
        // Create notification for post author
        if (post.author._id.toString() !== userId.toString()) {
          await Notification.createNotification({
            recipient: post.author._id,
            sender: userId,
            type: 'retweet',
            relatedPost: postId
          });

          // Send real-time notification
          if (req.io) {
            req.io.notifyUser(post.author._id, {
              type: 'retweet',
              message: `${req.user.username} retweeted your post`,
              post: {
                _id: post._id,
                text: post.text
              },
              sender: {
                _id: req.user._id,
                username: req.user.username,
                profilePicture: req.user.profilePicture
              },
              timestamp: new Date()
            });
          }
        }
      }

      await post.save();

      res.status(200).json({
        success: true,
        message: isCurrentlyRetweeted ? 'Post unretweeted' : 'Post retweeted',
        data: {
          isRetweeted: !isCurrentlyRetweeted,
          retweetsCount: result.retweetsCount
        }
      });

    } catch (error) {
      console.error('Toggle retweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling retweet'
      });
    }
  }
);

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
// @access  Public
router.get('/:id/comments', 
  optionalAuth,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const Comment = require('../models/Comment');
      const comments = await Comment.getPostComments(postId, {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: -1,
        includeReplies: false
      });

      res.status(200).json({
        success: true,
        data: {
          comments,
          pagination: {
            currentPage: page,
            hasNextPage: comments.length === limit,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get post comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching comments'
      });
    }
  }
);

module.exports = router; 