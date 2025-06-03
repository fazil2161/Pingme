const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150x150.png?text=User'
  },
  bio: {
    type: String,
    maxlength: [160, 'Bio cannot exceed 160 characters'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  website: {
    type: String,
    maxlength: [200, 'Website URL cannot exceed 200 characters'],
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Indexes for better performance
// Note: username and email indexes are automatically created due to unique: true
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to follow a user
userSchema.methods.follow = async function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    await this.save();
    
    // Add this user to the other user's followers
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $addToSet: { followers: this._id }
    });
  }
};

// Instance method to unfollow a user
userSchema.methods.unfollow = async function(userId) {
  this.following.pull(userId);
  await this.save();
  
  // Remove this user from the other user's followers
  await mongoose.model('User').findByIdAndUpdate(userId, {
    $pull: { followers: this._id }
  });
};

// Instance method to check if following a user
userSchema.methods.isFollowing = function(userId) {
  return this.following.includes(userId);
};

// Static method to find users by search term
userSchema.statics.search = function(searchTerm, limit = 10) {
  return this.find({
    $or: [
      { username: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } }
    ]
  })
  .select('username email profilePicture bio isVerified')
  .limit(limit);
};

// Update lastActive field before saving
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema); 