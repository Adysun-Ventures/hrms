import React from 'react';

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function CTAButton({ 
  href, 
  children, 
  variant = 'primary',
  className = '' 
}: CTAButtonProps) {
  const baseClasses = "inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300";
  
  const variantClasses = variant === 'primary' 
    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl" 
    : "bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white";
  
  return (
    <a 
      href={href} 
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
      {/* Icon - Consistent size with other components */}
      <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </a>
  );
}
