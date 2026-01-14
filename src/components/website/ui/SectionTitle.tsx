import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  variant?: 'light' | 'dark';
  alignment?: 'left' | 'center' | 'right';
  className?: string;
}

export default function SectionTitle({ 
  title, 
  subtitle, 
  variant = 'dark',
  alignment = 'center',
  className = '' 
}: SectionTitleProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  return (
    <div className={`mb-12 ${alignmentClasses[alignment]} ${className}`}>
      <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textColor}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg ${variant === 'light' ? 'text-gray-200' : 'text-gray-600'} max-w-3xl ${alignment === 'center' ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
