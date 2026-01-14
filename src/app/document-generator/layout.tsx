'use client';

import React from 'react';
import { Inter } from 'next/font/google';

// Initialize font
const inter = Inter({ subsets: ['latin'] });

export default function DocumentGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} document-generator-layout`}>
      {/* Basic styling for document generator contents */}
      <style jsx global>{`
        /* This ensures the document generator content fills its container */
        .document-generator-container {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          padding: 0;
          margin: 0;
          background-color: #f9fafb;
        }

        /* Reset styles for the generator */
        .document-generator-container * {
          box-sizing: border-box;
        }
      `}</style>
      
      {/* Document content */}
      {children}
    </div>
  );
} 