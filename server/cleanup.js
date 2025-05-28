const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const cleanup = async () => {
  try {
    // Check environment variables
    console.log('Checking environment variables:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
    console.log('MONGO_URI:', process.env.MONGO_URI || 'Using default: mongodb://localhost:27017/pingme');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pingme');
    console.log('Connected to MongoDB');
    
    // Delete the user with email demo31@gmail.com
    const result = await User.deleteOne({ email: 'demo31@gmail.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Successfully deleted user with email: demo31@gmail.com');
    } else {
      console.log('ℹ️ No user found with email: demo31@gmail.com');
    }
    
    // Also delete by username just in case
    const result2 = await User.deleteOne({ username: 'fazil2161' });
    if (result2.deletedCount > 0) {
      console.log('✅ Successfully deleted user with username: fazil2161');
    }
    
    console.log('Cleanup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanup(); 