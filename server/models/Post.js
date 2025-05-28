const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have an author']
  },
  text: {
    type: String,
    required: [true, 'Post text is required'],
    maxlength: [280, 'Post text cannot exceed 280 characters'],
    trim: true
  },
  image: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    }
  },
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  retweets: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  isRetweet: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    text: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastEdited: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('retweetsCount').get(function() {
  return this.retweets ? this.retweets.length : 0;
});

postSchema.virtual('isEdited').get(function() {
  return this.editHistory && this.editHistory.length > 0;
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ mentions: 1 });
postSchema.index({ isDeleted: 1 });

// Text index for search functionality
postSchema.index({ 
  text: 'text',
  hashtags: 'text'
});

// Pre-save middleware to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('text')) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(this.text)) !== null) {
      const hashtag = match[1].toLowerCase();
      if (!hashtags.includes(hashtag)) {
        hashtags.push(hashtag);
      }
    }
    this.hashtags = hashtags;

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    
    while ((match = mentionRegex.exec(this.text)) !== null) {
      mentions.push(match[1]);
    }
    
    // We'll resolve usernames to user IDs in the controller
    this._extractedMentions = mentions;
  }
  
  next();
});

// Instance method to like a post
postSchema.methods.like = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (!existingLike) {
    this.likes.push({ user: userId });
    return { liked: true, likesCount: this.likes.length };
  }
  
  return { liked: false, likesCount: this.likes.length };
};

// Instance method to unlike a post
postSchema.methods.unlike = function(userId) {
  const likeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId.toString()
  );
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return { unliked: true, likesCount: this.likes.length };
  }
  
  return { unliked: false, likesCount: this.likes.length };
};

// Instance method to check if user has liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// Instance method to retweet a post
postSchema.methods.retweet = function(userId) {
  const existingRetweet = this.retweets.find(retweet => 
    retweet.user.toString() === userId.toString()
  );
  
  if (!existingRetweet) {
    this.retweets.push({ user: userId });
    return { retweeted: true, retweetsCount: this.retweets.length };
  }
  
  return { retweeted: false, retweetsCount: this.retweets.length };
};

// Instance method to unretweet a post
postSchema.methods.unretweet = function(userId) {
  const retweetIndex = this.retweets.findIndex(retweet => 
    retweet.user.toString() === userId.toString()
  );
  
  if (retweetIndex > -1) {
    this.retweets.splice(retweetIndex, 1);
    return { unretweeted: true, retweetsCount: this.retweets.length };
  }
  
  return { unretweeted: false, retweetsCount: this.retweets.length };
};

// Instance method to check if user has retweeted the post
postSchema.methods.isRetweetedBy = function(userId) {
  return this.retweets.some(retweet => 
    retweet.user.toString() === userId.toString()
  );
};

// Static method to get trending hashtags
postSchema.statics.getTrendingHashtags = function(limit = 10, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false,
        hashtags: { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$hashtags' },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        recentPosts: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        hashtag: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to search posts
postSchema.statics.searchPosts = function(query, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = -1,
    author = null,
    hashtag = null
  } = options;
  
  const searchQuery = {
    isDeleted: false,
    $or: [
      { text: { $regex: query, $options: 'i' } },
      { hashtags: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (author) {
    searchQuery.author = author;
  }
  
  if (hashtag) {
    searchQuery.hashtags = hashtag.toLowerCase();
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(searchQuery)
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      }
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Post', postSchema); 