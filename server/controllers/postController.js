const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text } = req.body;
    const userId = req.user._id;

    // Handle image upload
    let imageData = null;
    if (req.file) {
      const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
      imageData = {
        url: `${baseUrl}/uploads/post-images/${req.file.filename}`,
        filename: req.file.filename
      };
    }

    // Create new post
    const post = new Post({
      author: userId,
      text,
      image: imageData
    });

    await post.save();

    // Populate author information
    await post.populate('author', 'username profilePicture isVerified');

    // Notify followers about new post (if needed)
    if (req.io) {
      // Get user's followers and notify them
      const user = await User.findById(userId).populate('followers');
      user.followers.forEach(follower => {
        if (req.io.isUserOnline && req.io.isUserOnline(follower._id)) {
          req.io.notifyUser(follower._id, {
            type: 'post_published',
            message: `${req.user.username} published a new post`,
            post: {
              _id: post._id,
              text: post.text,
              image: post.image
            },
            sender: {
              _id: req.user._id,
              username: req.user.username,
              profilePicture: req.user.profilePicture
            },
            timestamp: new Date()
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating post'
    });
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findById(userId).select('following');
    const followingIds = user.following || [];
    
    // Include user's own posts in the feed
    const authorIds = [...followingIds, userId];

    // Get posts from followed users and own posts
    const posts = await Post.find({
      author: { $in: authorIds },
      isDeleted: false
    })
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'comments',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      },
      options: { sort: { createdAt: -1 }, limit: 2 }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Add additional metadata to posts
    const postsWithMetadata = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.isLikedBy(userId);
      postObj.isRetweeted = post.isRetweetedBy(userId);
      return postObj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithMetadata,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(posts.length / limit),
          hasNextPage: posts.length === limit,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feed'
    });
  }
};

// @desc    Get a single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user ? req.user._id : null;

    const post = await Post.findById(postId)
      .populate('author', 'username profilePicture isVerified')
      .populate({
        path: 'comments',
        match: { isDeleted: false, parentComment: null },
        populate: [
          {
            path: 'author',
            select: 'username profilePicture isVerified'
          },
          {
            path: 'replies',
            match: { isDeleted: false },
            populate: {
              path: 'author',
              select: 'username profilePicture isVerified'
            },
            options: { sort: { createdAt: 1 }, limit: 3 }
          }
        ],
        options: { sort: { createdAt: -1 } }
      });

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add metadata if user is authenticated
    const postObj = post.toObject();
    if (userId) {
      postObj.isLiked = post.isLikedBy(userId);
      postObj.isRetweeted = post.isRetweetedBy(userId);
    }

    res.status(200).json({
      success: true,
      data: {
        post: postObj
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching post'
    });
  }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('author', 'username');

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isCurrentlyLiked = post.isLikedBy(userId);
    let result;

    if (isCurrentlyLiked) {
      result = post.unlike(userId);
    } else {
      result = post.like(userId);
      
      // Create notification for post author
      if (post.author._id.toString() !== userId.toString()) {
        await Notification.createNotification({
          recipient: post.author._id,
          sender: userId,
          type: 'like_post',
          relatedPost: postId
        });

        // Send real-time notification
        if (req.io) {
          req.io.notifyUser(post.author._id, {
            type: 'like_post',
            message: `${req.user.username} liked your post`,
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
      message: isCurrentlyLiked ? 'Post unliked' : 'Post liked',
      data: {
        isLiked: !isCurrentlyLiked,
        likesCount: result.likesCount
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('author', 'username');

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create new comment
    const comment = new Comment({
      post: postId,
      author: userId,
      text
    });

    await comment.save();
    await comment.populate('author', 'username profilePicture isVerified');

    // Create notification for post author
    if (post.author._id.toString() !== userId.toString()) {
      await Notification.createNotification({
        recipient: post.author._id,
        sender: userId,
        type: 'comment_post',
        relatedPost: postId,
        relatedComment: comment._id
      });

      // Send real-time notification
      if (req.io) {
        req.io.notifyUser(post.author._id, {
          type: 'comment_post',
          message: `${req.user.username} commented on your post`,
          post: {
            _id: post._id,
            text: post.text
          },
          comment: {
            _id: comment._id,
            text: comment.text
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

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating comment'
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user ? req.user._id : null;

    const posts = await Post.find({
      author: userId,
      isDeleted: false
    })
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'comments',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      },
      options: { sort: { createdAt: -1 }, limit: 2 }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Add metadata if user is authenticated
    const postsWithMetadata = posts.map(post => {
      const postObj = post.toObject();
      if (currentUserId) {
        postObj.isLiked = post.isLikedBy(currentUserId);
        postObj.isRetweeted = post.isRetweetedBy(currentUserId);
      }
      return postObj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithMetadata,
        pagination: {
          currentPage: page,
          hasNextPage: posts.length === limit,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user posts'
    });
  }
};

// @desc    Search posts by hashtag or text
// @route   GET /api/posts/search
// @access  Public
const searchPosts = async (req, res) => {
  try {
    const { q, hashtag, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user ? req.user._id : null;

    let searchQuery = { isDeleted: false };

    if (hashtag) {
      searchQuery.hashtags = hashtag.toLowerCase();
    } else if (q) {
      searchQuery.$text = { $search: q };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Search query or hashtag is required'
      });
    }

    const posts = await Post.find(searchQuery)
      .populate('author', 'username profilePicture isVerified')
      .populate({
        path: 'comments',
        match: { isDeleted: false },
        populate: {
          path: 'author',
          select: 'username profilePicture isVerified'
        },
        options: { sort: { createdAt: -1 }, limit: 2 }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add metadata if user is authenticated
    const postsWithMetadata = posts.map(post => {
      const postObj = post.toObject();
      if (currentUserId) {
        postObj.isLiked = post.isLikedBy(currentUserId);
        postObj.isRetweeted = post.isRetweetedBy(currentUserId);
      }
      return postObj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithMetadata,
        searchQuery: q || hashtag,
        pagination: {
          currentPage: parseInt(page),
          hasNextPage: posts.length === parseInt(limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching posts'
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

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
        message: 'You can only delete your own posts'
      });
    }

    // Soft delete the post
    post.isDeleted = true;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting post'
    });
  }
};

// @desc    Get explore posts (popular/recent posts)
// @route   GET /api/posts/explore
// @access  Public
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user ? req.user._id : null;

    // Get recent posts from the last 30 days, sorted by creation date
    const posts = await Post.find({
      isDeleted: false,
      author: { $ne: null }, // Ensure author exists
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'comments',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      },
      options: { sort: { createdAt: -1 }, limit: 2 }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Filter out posts with missing author data and add metadata
    const validPosts = posts.filter(post => post.author && post.author._id);
    const postsWithMetadata = validPosts.map(post => {
      const postObj = post.toObject();
      if (currentUserId) {
        postObj.isLiked = post.isLikedBy(currentUserId);
        postObj.isRetweeted = post.isRetweetedBy(currentUserId);
      }
      return postObj;
    });

    // Calculate pagination info
    const totalPosts = await Post.countDocuments({
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithMetadata,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explore posts'
    });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/posts/trending
// @access  Public
const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    const trendingHashtags = await Post.getTrendingHashtags(limit, days);

    res.status(200).json({
      success: true,
      data: {
        hashtags: trendingHashtags
      }
    });

  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending hashtags'
    });
  }
};

module.exports = {
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
}; 