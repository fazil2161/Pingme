const fs = require('fs');
const path = require('path');

console.log('=== BUILD DEBUG INFO ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Check if client directory exists
const clientDir = path.join(process.cwd(), 'client');
console.log('Client directory path:', clientDir);
console.log('Client directory exists:', fs.existsSync(clientDir));

// Check if client/public exists
const publicDir = path.join(clientDir, 'public');
console.log('Public directory path:', publicDir);
console.log('Public directory exists:', fs.existsSync(publicDir));

// Check if index.html exists
const indexPath = path.join(publicDir, 'index.html');
console.log('Index.html path:', indexPath);
console.log('Index.html exists:', fs.existsSync(indexPath));

// List contents of current directory
console.log('\nContents of current directory:');
try {
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    const stats = fs.statSync(path.join(process.cwd(), file));
    console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${file}`);
  });
} catch (err) {
  console.log('Error reading directory:', err.message);
}

// List contents of client directory if it exists
if (fs.existsSync(clientDir)) {
  console.log('\nContents of client directory:');
  try {
    const files = fs.readdirSync(clientDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(clientDir, file));
      console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${file}`);
    });
  } catch (err) {
    console.log('Error reading client directory:', err.message);
  }
} 