const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pingme');
    console.log('Connected to MongoDB');

    // Test login with specific credentials
    const testEmail = 'demo41@gmail.com'; // Replace with the email you're trying to login with
    const testPassword = 'Password123'; // Replace with the password you used during registration
    
    // Also test the other user
    const testEmail2 = 'demo31@gmail.com'; 
    
    console.log('\n=== Testing Both Users ===');

    console.log(`\nTesting login for: ${testEmail}`);
    console.log(`Testing password: ${testPassword}`);

    // Find user by email (same as login controller)
    const user = await User.findOne({ 
      email: testEmail.toLowerCase().trim() 
    }).select('+password +refreshToken');

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found in database');
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Has password: ${!!user.password}`);

    // Test password comparison
    console.log('\nTesting password comparison...');
    try {
      const isValidPassword = await user.comparePassword(testPassword);
      console.log(`Password comparison result: ${isValidPassword}`);
      
      if (isValidPassword) {
        console.log('✅ LOGIN SHOULD WORK - Password is correct!');
      } else {
        console.log('❌ LOGIN WILL FAIL - Password is incorrect');
        
        // Test with other common passwords that match the validation pattern
        const commonPasswords = [
          'Demo123', 'Demo1234', 'Password1', 'Test123', 'Test1234',
          'Fazil123', 'Fazil1234', 'Admin123', 'User123', 'Login123',
          'Hello123', 'Welcome123', 'Pingme123', 'Sample123',
          // Variations with different case
          'demo123', 'DEMO123', 'password123', 'PASSWORD123'
        ];
        
        console.log('\nTrying other common passwords...');
        for (const pwd of commonPasswords) {
          const result = await user.comparePassword(pwd);
          if (result) {
            console.log(`✅ Found correct password: ${pwd}`);
            return; // Stop when found
          }
        }
        console.log('❌ No common password found');
      }
    } catch (error) {
      console.log(`❌ Error during password comparison: ${error.message}`);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

console.log('Testing specific login...');
testLogin(); 