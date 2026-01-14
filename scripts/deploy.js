#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify deployment preparation...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if netlify-cli is installed
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log('✅ Netlify CLI is installed');
} catch (error) {
  console.log('⚠️  Netlify CLI not found. Installing...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Netlify CLI. Please install it manually:');
    console.error('   npm install -g netlify-cli');
    process.exit(1);
  }
}

// Check if user is logged in to Netlify
try {
  execSync('netlify status', { stdio: 'ignore' });
  console.log('✅ Logged in to Netlify');
} catch (error) {
  console.log('⚠️  Not logged in to Netlify. Please login:');
  console.log('   netlify login');
  process.exit(1);
}

// Build the project
console.log('\n🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed. Please fix the errors and try again.');
  process.exit(1);
}

// Deploy to Netlify
console.log('\n🚀 Deploying to Netlify...');
try {
  execSync('netlify deploy --prod', { stdio: 'inherit' });
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up environment variables in your Netlify dashboard');
  console.log('2. Configure your custom domain (optional)');
  console.log('3. Set up continuous deployment');
} catch (error) {
  console.error('❌ Deployment failed. Please check the error messages above.');
  process.exit(1);
} 