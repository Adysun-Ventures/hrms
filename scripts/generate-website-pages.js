const fs = require('fs');
const path = require('path');

// Define all the pages to generate
const pages = [
  {
    path: 'src/app/website/about-us/page.tsx',
    title: 'About Us',
    description: 'Learn about Adysun Ventures and our mission to deliver growth to your business'
  },
  {
    path: 'src/app/website/partners/page.tsx',
    title: 'Technology Partnership',
    description: 'Our Company Affiliations and Technology Partnerships'
  },
  {
    path: 'src/app/website/contact-us/page.tsx',
    title: 'Contact Us',
    description: 'Reach Out to ADYSUN VENTURES'
  },
  {
    path: 'src/app/website/services/page.tsx',
    title: 'Services',
    description: 'What We Offer - Comprehensive IT Solutions & Business Strategy Services'
  },
  {
    path: 'src/app/website/technologies/page.tsx',
    title: 'Technologies',
    description: 'Overview Of Our Diverse Technology Competency'
  },
  {
    path: 'src/app/website/careers/page.tsx',
    title: 'Careers',
    description: "Let's shape the future with tech together!"
  },
  {
    path: 'src/app/website/clients/page.tsx',
    title: 'Our Clients',
    description: 'Success stories and client testimonials'
  },
  {
    path: 'src/app/website/industries/page.tsx',
    title: 'Industries Solutions',
    description: 'We help businesses work smarter and grow faster with business technology consulting'
  },
  {
    path: 'src/app/website/industries/stock-exchange/page.tsx',
    title: 'Stock Exchange & Financial Services',
    description: 'High-performance solutions for financial markets and trading platforms'
  },
  {
    path: 'src/app/website/industries/ecommerce/page.tsx',
    title: 'E-Commerce & Retail Solutions',
    description: 'Scalable platforms and solutions for online retail businesses'
  },
  {
    path: 'src/app/website/industries/transportation/page.tsx',
    title: 'Transportation & Logistics',
    description: 'Logistics and fleet management technology solutions'
  },
  {
    path: 'src/app/website/gallery/page.tsx',
    title: 'Gallery',
    description: 'A glimpse of our workplace and culture'
  }
];

// Template for each page
const pageTemplate = (title, description) => `import React from 'react';
import WebsiteLayout from '@/components/website/WebsiteLayout';

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <WebsiteLayout 
      title="${title}"
      description="${description}"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">${title}</h2>
          <p className="text-gray-600 mb-6">${description}</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-blue-700">
              <strong>Note:</strong> This is a sample page. Content will be updated with actual website content during refactoring.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Coming Soon</h3>
              <p className="text-gray-600">
                This page is under development. We are porting the content from the React website to maintain the same UI and experience.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Responsive design</li>
                <li>• Modern UI components</li>
                <li>• SEO optimized</li>
                <li>• Fast loading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
`;

// Generate all pages
pages.forEach(page => {
  const dir = path.dirname(page.path);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Generate the page content
  const content = pageTemplate(page.title, page.description);
  
  // Write the file
  fs.writeFileSync(page.path, content);
  console.log(`✅ Generated: ${page.path}`);
});

console.log('\n🎉 All website pages have been generated successfully!');
console.log('📁 Check the src/app/website/ directory for all the new pages.');
console.log('🚀 You can now start the development server and visit /website to see the pages.');
