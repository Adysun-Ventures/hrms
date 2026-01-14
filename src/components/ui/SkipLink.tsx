import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip Link component for keyboard navigation accessibility
 * Allows users to skip to main content or other important sections
 */
export default function SkipLink({ 
  href, 
  children, 
  className = '' 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${className}`}
      aria-label={`Skip to ${children}`}
    >
      {children}
    </a>
  );
}
