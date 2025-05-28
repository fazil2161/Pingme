const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const testSearch = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pingme');
    console.log('Connected to MongoDB');

    // Get all users to see what we have
    const allUsers = await User.find({}).select('username email bio');
    console.log('\n=== All Users in Database ===');
    allUsers.forEach(user => {
      console.log(`Username: ${user.username}, Email: ${user.email}, Bio: ${user.bio || 'No bio'}`);
    });

    // Test search functionality
    const searchQueries = ['fazil', 'demo', 'faz', 'user'];
    
    for (const query of searchQueries) {
      console.log(`\n=== Testing search for: "${query}" ===`);
      
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ]
      })
      .select('username profilePicture bio isVerified followers following')
      .lean();

      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`- ${user.username} (followers: ${user.followers?.length || 0})`);
      });
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Testing search functionality...');
testSearch(); 