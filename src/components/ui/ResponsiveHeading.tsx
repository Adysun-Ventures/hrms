import React from 'react';

interface ResponsiveHeadingProps {
  children: React.ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  id?: string;
}

/**
 * Responsive Heading component using the new typography system
 * Automatically applies responsive font sizes and proper semantic markup
 */
export default function ResponsiveHeading({ 
  children, 
  level, 
  className = '',
  id 
}: ResponsiveHeadingProps) {
  const headingClasses = {
    1: 'heading-1',
    2: 'heading-2',
    3: 'heading-3',
    4: 'heading-4',
    5: 'heading-5',
    6: 'heading-6'
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag 
      className={`${headingClasses[level]} ${className}`}
      id={id}
    >
      {children}
    </Tag>
  );
}
