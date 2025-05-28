// Test 1: Load from .env file
console.log('=== TEST 1: Loading from .env file ===');
require('dotenv').config();
console.log('JWT_SECRET from .env:', process.env.JWT_SECRET ? 'FOUND' : 'NOT FOUND');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Test 2: Manually set environment variable
console.log('\n=== TEST 2: Manual environment variable ===');
process.env.JWT_SECRET = 'test-secret-123456789';
console.log('JWT_SECRET manually set:', process.env.JWT_SECRET);

// Test 3: Test JWT generation with manual secret
console.log('\n=== TEST 3: JWT Generation Test ===');
try {
  const jwt = require('jsonwebtoken');
  const { generateTokens } = require('./middleware/auth');
  
  console.log('Testing generateTokens function...');
  const tokens = generateTokens('test-user-id');
  console.log('✅ Token generation successful!');
  console.log('Access token (first 30 chars):', tokens.accessToken.substring(0, 30));
} catch (error) {
  console.log('❌ Token generation failed:', error.message);
}

// Test 4: Check if .env file exists and is readable
console.log('\n=== TEST 4: File System Check ===');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('.env file path:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('.env file size:', content.length, 'bytes');
    console.log('Contains JWT_SECRET:', content.includes('JWT_SECRET'));
    
    // Show first few lines
    const lines = content.split('\n').slice(0, 10);
    console.log('First 10 lines:');
    lines.forEach((line, i) => {
      console.log(`  ${i + 1}: ${line}`);
    });
  } catch (error) {
    console.log('Error reading .env file:', error.message);
  }
} 