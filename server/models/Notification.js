const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a sender']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'like_post',
      'like_comment', 
      'comment_post',
      'reply_comment',
      'follow',
      'unfollow',
      'mention_post',
      'mention_comment',
      'retweet',
      'post_published'
    ]
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Notification message cannot exceed 500 characters']
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ isDeleted: 1 });
notificationSchema.index({ relatedPost: 1 });
notificationSchema.index({ relatedComment: 1 });

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, isDeleted: 1, createdAt: -1 });

// Virtual to check if notification is recent (within last 24 hours)
notificationSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

// Virtual to get time elapsed since creation
notificationSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  } else {
    return 'now';
  }
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = null;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const {
    recipient,
    sender,
    type,
    relatedPost = null,
    relatedComment = null,
    relatedUser = null,
    metadata = {}
  } = data;
  
  // Don't create notification if sender and recipient are the same
  if (recipient.toString() === sender.toString()) {
    return null;
  }
  
  // Generate message based on type
  const senderUser = await mongoose.model('User').findById(sender).select('username');
  if (!senderUser) {
    throw new Error('Sender user not found');
  }
  
  let message = '';
  
  switch (type) {
    case 'like_post':
      message = `${senderUser.username} liked your post`;
      break;
    case 'like_comment':
      message = `${senderUser.username} liked your comment`;
      break;
    case 'comment_post':
      message = `${senderUser.username} commented on your post`;
      break;
    case 'reply_comment':
      message = `${senderUser.username} replied to your comment`;
      break;
    case 'follow':
      message = `${senderUser.username} started following you`;
      break;
    case 'unfollow':
      message = `${senderUser.username} unfollowed you`;
      break;
    case 'mention_post':
      message = `${senderUser.username} mentioned you in a post`;
      break;
    case 'mention_comment':
      message = `${senderUser.username} mentioned you in a comment`;
      break;
    case 'retweet':
      message = `${senderUser.username} retweeted your post`;
      break;
    case 'post_published':
      message = `${senderUser.username} published a new post`;
      break;
    default:
      message = `${senderUser.username} interacted with your content`;
  }
  
  // Check if similar notification already exists (to prevent spam)
  const existingNotification = await this.findOne({
    recipient,
    sender,
    type,
    relatedPost,
    relatedComment,
    createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
  });
  
  if (existingNotification) {
    return existingNotification;
  }
  
  // Create the notification
  const notification = new this({
    recipient,
    sender,
    type,
    message,
    relatedPost,
    relatedComment,
    relatedUser,
    metadata
  });
  
  await notification.save();
  return notification.populate(['sender', 'relatedPost', 'relatedComment', 'relatedUser']);
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;
  
  const skip = (page - 1) * limit;
  const query = {
    recipient: userId,
    isDeleted: false
  };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('sender', 'username profilePicture isVerified')
    .populate('relatedPost', 'text image createdAt')
    .populate('relatedComment', 'text createdAt')
    .populate('relatedUser', 'username profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isDeleted: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Pre-save middleware to validate related fields
notificationSchema.pre('save', function(next) {
  // Ensure that required related fields are present based on notification type
  const postRelatedTypes = ['like_post', 'comment_post', 'mention_post', 'retweet'];
  const commentRelatedTypes = ['like_comment', 'reply_comment', 'mention_comment'];
  const userRelatedTypes = ['follow', 'unfollow'];
  
  if (postRelatedTypes.includes(this.type) && !this.relatedPost) {
    return next(new Error(`Notification type ${this.type} requires a related post`));
  }
  
  if (commentRelatedTypes.includes(this.type) && !this.relatedComment) {
    return next(new Error(`Notification type ${this.type} requires a related comment`));
  }
  
  if (userRelatedTypes.includes(this.type) && !this.relatedUser) {
    this.relatedUser = this.sender; // Set sender as related user for follow/unfollow
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 