// netlify-postbuild.js
const fs = require('fs');
const path = require('path');

// Paths
const nextDir = path.join(process.cwd(), '.next');
const publicDir = path.join(process.cwd(), 'public');

// Check if the .next directory exists
if (!fs.existsSync(nextDir)) {
  console.log('No .next directory found. Build may have failed.');
  process.exit(1);
}

// Copy the _redirects file to the .next directory if it exists
const redirectsSource = path.join(publicDir, '_redirects');
const redirectsTarget = path.join(nextDir, '_redirects');

if (fs.existsSync(redirectsSource)) {
  fs.copyFileSync(redirectsSource, redirectsTarget);
  console.log('Copied _redirects to .next directory');
}

// Copy the _headers file to the .next directory if it exists
const headersSource = path.join(publicDir, '_headers');
const headersTarget = path.join(nextDir, '_headers');

if (fs.existsSync(headersSource)) {
  fs.copyFileSync(headersSource, headersTarget);
  console.log('Copied _headers to .next directory');
}

console.log('Netlify post-build script completed successfully'); 