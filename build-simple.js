const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Simple build process starting...');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')} in ${cwd}`);
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, REACT_APP_API_URL: '/api' }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function build() {
  try {
    const root = process.cwd();
    
    // Install all dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install'], root);
    await runCommand('npm', ['install'], path.join(root, 'server'));
    await runCommand('npm', ['install'], path.join(root, 'client'));
    
    // Build React app
    console.log('🏗️ Building React app...');
    await runCommand('npm', ['run', 'build'], path.join(root, 'client'));
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build(); 