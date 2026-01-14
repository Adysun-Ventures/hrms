// This file provides static parameters for the dynamic route
// Required for static site generation with Next.js export

export async function generateStaticParams() {
  // For static export, we'll create a fallback page with ID '0'
  // The actual data will be fetched client-side
  return [
    { id: '0' },
  ];
} 