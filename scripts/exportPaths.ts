// This script generates static paths for Next.js export
// It's needed for GitHub Pages deployment with dynamic routes

import fs from 'fs';
import path from 'path';

// Function to get all dynamic route paths
export async function generateStaticPaths() {
  // Define your dynamic routes here
  // Format: { route: [params] }
  const routes = {
    // Example: dynamically generate paths for each employee ID
    '/employees/[id]': ['1', '2', '3'], // Replace with actual IDs if possible

    // Example: dynamically generate paths for document types
    '/dashboard/documents/[type]': [
      'offer-letter',
      'appointment-letter',
      'relieving-letter',
      'appraisal-letter',
      'company-card'
    ],

    // Add more dynamic routes as needed
  };

  // Convert routes to exportPathMap format for Next.js
  const pathMap: Record<string, { page: string; query?: Record<string, string> }> = {
    // Include static pages
    '/': { page: '/' },
    '/dashboard': { page: '/dashboard' },
    '/login': { page: '/login' },
    '/employees': { page: '/employees' },
    '/employments': { page: '/employments' },
    '/dashboard/documents': { page: '/dashboard/documents' },
    '/dashboard/documents/v2': { page: '/dashboard/documents/v2' },
  };

  // Add dynamic routes
  Object.entries(routes).forEach(([route, params]) => {
    // Extract the page name and param name from the route
    const page = route; // e.g., '/employees/[id]'
    const paramName = route.match(/\[([^\]]+)\]/)?.[1]; // e.g., 'id'

    if (paramName) {
      params.forEach(param => {
        // Create the actual path
        const path = route.replace(`[${paramName}]`, param);
        pathMap[path] = {
          page,
          query: { [paramName]: param }
        };
      });
    }
  });

  return pathMap;
}

// For testing/debugging
if (require.main === module) {
  generateStaticPaths().then(paths => {
    console.log(JSON.stringify(paths, null, 2));
  });
}

export default generateStaticPaths; 