#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if frontend directory exists
if (!fs.existsSync('frontend')) {
  console.error('❌ Error: frontend directory not found.');
  process.exit(1);
}

try {
  // Step 1: Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Step 2: Install frontend dependencies
  console.log('\n📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });

  // Step 3: Build frontend
  console.log('\n🔨 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  // Step 4: Check if build was successful
  if (!fs.existsSync('frontend/build')) {
    throw new Error('Frontend build failed - build directory not found');
  }

  console.log('\n✅ Deployment preparation completed successfully!');
  console.log('\n📋 Next steps for Netlify deployment:');
  console.log('1. Push your code to GitHub:');
  console.log('   git add .');
  console.log('   git commit -m "Ready for deployment"');
  console.log('   git push origin main');
  console.log('\n2. Connect to Netlify:');
  console.log('   - Go to https://app.netlify.com');
  console.log('   - Click "New site from Git"');
  console.log('   - Select your GitHub repository');
  console.log('\n3. Build settings:');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: frontend/build');
  console.log('   - Functions directory: netlify/functions');
  console.log('\n4. Environment variables:');
  console.log('   - NODE_ENV=production');
  console.log('   - JWT_SECRET=your_production_secret_here');
  console.log('   - JWT_EXPIRES_IN=7d');
  console.log('   - ADMIN_CODE=admin007');
  console.log('   - NETLIFY=true');
  console.log('\n📖 Full deployment guide: See DEPLOYMENT.md');
  console.log('🔐 Admin code: admin007');
  console.log('🎉 Your app is ready for Netlify deployment!');

} catch (error) {
  console.error('\n❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
