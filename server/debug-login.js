const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const debugLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pingme');
    console.log('Connected to MongoDB');

    // Get all users from database
    const users = await User.find({}).select('+password');
    console.log('\n=== All Users in Database ===');
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Username: ${user.username || 'MISSING'}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password Hash: ${user.password}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });

    // Test login for each user
    console.log('\n=== Testing Login ===');
    
    // Test with passwords that match the validation pattern
    const testPasswords = [
      'Password123', 'Password1', 'Demo123', 'Demo1234', 
      'Fazil123', 'Fazil1234', 'Test123', 'Test1234',
      'Admin123', 'User123', 'Welcome123', 'Hello123'
    ];
    
    for (const user of users) {
      console.log(`\nTesting login for: ${user.email}`);
      console.log(`Username: ${user.username || 'MISSING'}`);
      
      let foundPassword = false;
      for (const testPassword of testPasswords) {
        try {
          const isValid = await user.comparePassword(testPassword);
          if (isValid) {
            console.log(`✅ Password "${testPassword}" is CORRECT for ${user.email}`);
            foundPassword = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Error testing password "${testPassword}": ${error.message}`);
        }
      }
      
      if (!foundPassword) {
        console.log(`❌ No matching password found for ${user.email}`);
      }
    }

    // Test login API endpoint simulation
    console.log('\n=== Simulating Login API ===');
    for (const user of users) {
      console.log(`\nSimulating login for: ${user.email}`);
      
      // Check if user has required fields
      if (!user.username) {
        console.log('❌ User missing username field!');
      }
      if (!user.password) {
        console.log('❌ User missing password field!');
      }
      
      // Try to find user like login controller does
      const foundUser = await User.findOne({ 
        email: user.email.toLowerCase().trim() 
      }).select('+password +refreshToken');
      
      if (foundUser) {
        console.log('✅ User found in database');
        console.log(`Username: ${foundUser.username || 'MISSING'}`);
        console.log(`Has password: ${!!foundUser.password}`);
      } else {
        console.log('❌ User not found in database');
      }
    }

    // Test password hashing
    console.log('\n=== Testing Password Hashing ===');
    const testPassword = 'TestPassword123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log(`Original: ${testPassword}`);
    console.log(`Hashed: ${hashedPassword}`);
    
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Comparison result: ${isMatch}`);

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Starting login debug...');
debugLogin(); 