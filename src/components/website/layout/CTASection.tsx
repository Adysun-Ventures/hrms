import React from 'react';
import CTAButton from '../CTAButton';

interface CTAButtonAction {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

interface CTASectionProps {
  title: string;
  description: string;
  actions: CTAButtonAction[];
  backgroundImage?: string;
  className?: string;
}

export default function CTASection({ 
  title,
  description,
  actions,
  backgroundImage,
  className = ''
}: CTASectionProps) {
  return (
    <section 
      className={`py-24 bg-gradient-to-r from-orange-100 to-orange-200 text-gray-800 relative ${className}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/90 to-orange-200/90"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            {title}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-10">
            {description}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {actions.map((action, index) => (
            <CTAButton 
              key={index}
              href={action.href} 
              variant={action.variant || 'primary'}
            >
              {action.text}
            </CTAButton>
          ))}
        </div>
      </div>
    </section>
  );
}
