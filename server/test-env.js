require('dotenv').config();

console.log('Testing environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('');

console.log('JWT_SECRET details:');
console.log('  Exists:', !!process.env.JWT_SECRET);
console.log('  Type:', typeof process.env.JWT_SECRET);
console.log('  Length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('  First 10 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) : 'N/A');
console.log('  Contains +:', process.env.JWT_SECRET ? process.env.JWT_SECRET.includes('+') : false);
console.log('  Contains /:', process.env.JWT_SECRET ? process.env.JWT_SECRET.includes('/') : false);
console.log('');

console.log('JWT_REFRESH_SECRET details:');
console.log('  Exists:', !!process.env.JWT_REFRESH_SECRET);
console.log('  Type:', typeof process.env.JWT_REFRESH_SECRET);
console.log('  Length:', process.env.JWT_REFRESH_SECRET ? process.env.JWT_REFRESH_SECRET.length : 0);
console.log('');

// Test JWT signing with current secret
console.log('Testing JWT signing:');
try {
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET || 'fallback');
  console.log('✅ JWT signing works with current secret');
  console.log('Test token (first 20 chars):', testToken.substring(0, 20));
} catch (error) {
  console.log('❌ JWT signing failed:', error.message);
}

console.log('');
console.log('Suggested fix: Try simpler JWT secrets without special characters');
console.log('Example: JWT_SECRET=mysupersecretkey123456789012345678901234567890'); 