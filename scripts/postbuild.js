const fs = require('fs-extra');
const path = require('path');

// Define source and destination paths
const publicDir = path.join(process.cwd(), 'public');
const outDir = path.join(process.cwd(), 'out');

// Function to copy special files
async function copySpecialFiles() {
  console.log('Copying special files to out directory...');
  
  try {
    // Make sure _redirects is copied to the output directory
    const redirectsSource = path.join(publicDir, '_redirects');
    const redirectsDestination = path.join(outDir, '_redirects');
    
    if (fs.existsSync(redirectsSource)) {
      await fs.copy(redirectsSource, redirectsDestination);
      console.log('_redirects file copied successfully');
    } else {
      // Create _redirects file in out directory if it doesn't exist in public
      fs.writeFileSync(redirectsDestination, '/*    /index.html   200');
      console.log('_redirects file created successfully');
    }
    
    // Make sure _headers is copied to the output directory
    const headersSource = path.join(publicDir, '_headers');
    const headersDestination = path.join(outDir, '_headers');
    
    if (fs.existsSync(headersSource)) {
      await fs.copy(headersSource, headersDestination);
      console.log('_headers file copied successfully');
    }

    // Ensure 404.html is in the output directory
    const notFoundSource = path.join(publicDir, '404.html');
    const notFoundDestination = path.join(outDir, '404.html');
    
    if (fs.existsSync(notFoundSource)) {
      await fs.copy(notFoundSource, notFoundDestination);
      console.log('404.html file copied successfully');
    }
    
    console.log('All special files processed successfully');
  } catch (err) {
    console.error('Error during post-build process:', err);
    process.exit(1);
  }
}

// Execute the copy operation
copySpecialFiles(); 