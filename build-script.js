const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting custom build process...');

// Get current working directory
const rootDir = process.cwd();
console.log('Root directory:', rootDir);

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: rootDir });
  
  // Install server dependencies
  console.log('Installing server dependencies...');
  const serverDir = path.join(rootDir, 'server');
  execSync('npm install', { stdio: 'inherit', cwd: serverDir });
  
  // Install client dependencies
  console.log('Installing client dependencies...');
  const clientDir = path.join(rootDir, 'client');
  execSync('npm install', { stdio: 'inherit', cwd: clientDir });
  
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Verify client structure
console.log('🔍 Verifying client structure...');
const clientDir = path.join(rootDir, 'client');
const publicDir = path.join(clientDir, 'public');
const indexPath = path.join(publicDir, 'index.html');

console.log('Client directory exists:', fs.existsSync(clientDir));
console.log('Public directory exists:', fs.existsSync(publicDir));
console.log('Index.html exists:', fs.existsSync(indexPath));

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found at:', indexPath);
  process.exit(1);
}

// Set environment variable for API URL
process.env.REACT_APP_API_URL = '/api';
console.log('🔧 Set REACT_APP_API_URL to:', process.env.REACT_APP_API_URL);

// Build React app
console.log('🏗️ Building React application...');
try {
  execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: clientDir,
    env: { ...process.env, REACT_APP_API_URL: '/api' }
  });
  console.log('✅ React build completed successfully!');
} catch (error) {
  console.error('❌ Error building React app:', error.message);
  process.exit(1);
}

// Verify build output
const buildDir = path.join(clientDir, 'build');
if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory created successfully');
  const buildFiles = fs.readdirSync(buildDir);
  console.log('Build files:', buildFiles);
} else {
  console.error('❌ Build directory not created');
  process.exit(1);
}

console.log('🎉 Build process completed successfully!'); 