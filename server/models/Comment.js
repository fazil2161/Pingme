const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment must belong to a post']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author']
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [280, 'Comment text cannot exceed 280 characters'],
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
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
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
commentSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

commentSchema.virtual('repliesCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

commentSchema.virtual('isEdited').get(function() {
  return this.editHistory && this.editHistory.length > 0;
});

// Indexes for better performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'likes.user': 1 });
commentSchema.index({ mentions: 1 });
commentSchema.index({ isDeleted: 1 });

// Pre-save middleware to extract mentions
commentSchema.pre('save', function(next) {
  if (this.isModified('text')) {
    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(this.text)) !== null) {
      mentions.push(match[1]);
    }
    
    // We'll resolve usernames to user IDs in the controller
    this._extractedMentions = mentions;
  }
  
  next();
});

// Instance method to like a comment
commentSchema.methods.like = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (!existingLike) {
    this.likes.push({ user: userId });
    return { liked: true, likesCount: this.likes.length };
  }
  
  return { liked: false, likesCount: this.likes.length };
};

// Instance method to unlike a comment
commentSchema.methods.unlike = function(userId) {
  const likeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId.toString()
  );
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return { unliked: true, likesCount: this.likes.length };
  }
  
  return { unliked: false, likesCount: this.likes.length };
};

// Instance method to check if user has liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// Instance method to add a reply
commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
};

// Instance method to remove a reply
commentSchema.methods.removeReply = function(replyId) {
  this.replies.pull(replyId);
};

// Static method to get comments for a post with pagination
commentSchema.statics.getPostComments = function(postId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 1,
    includeReplies = false
  } = options;
  
  const skip = (page - 1) * limit;
  const query = {
    post: postId,
    isDeleted: false
  };
  
  // If not including replies, only get top-level comments
  if (!includeReplies) {
    query.parentComment = null;
  }
  
  return this.find(query)
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      },
      options: { sort: { createdAt: 1 }, limit: 3 } // Show only first 3 replies
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method to get replies for a comment
commentSchema.statics.getCommentReplies = function(commentId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 1
  } = options;
  
  const skip = (page - 1) * limit;
  
  return this.find({
    parentComment: commentId,
    isDeleted: false
  })
  .populate('author', 'username profilePicture isVerified')
  .sort({ [sortBy]: sortOrder })
  .skip(skip)
  .limit(limit);
};

// Pre-remove middleware to update parent comment's replies array
commentSchema.pre('remove', async function(next) {
  if (this.parentComment) {
    await mongoose.model('Comment').findByIdAndUpdate(
      this.parentComment,
      { $pull: { replies: this._id } }
    );
  }
  
  // Also remove this comment from the post's comments array
  await mongoose.model('Post').findByIdAndUpdate(
    this.post,
    { $pull: { comments: this._id } }
  );
  
  next();
});

// Post-save middleware to update parent comment's replies array
commentSchema.post('save', async function(doc) {
  if (doc.parentComment && doc.isNew) {
    await mongoose.model('Comment').findByIdAndUpdate(
      doc.parentComment,
      { $addToSet: { replies: doc._id } }
    );
  }
  
  // Add this comment to the post's comments array
  if (doc.isNew) {
    await mongoose.model('Post').findByIdAndUpdate(
      doc.post,
      { $addToSet: { comments: doc._id } }
    );
  }
});

module.exports = mongoose.model('Comment', commentSchema); 