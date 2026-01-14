import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  variant = 'light',
  className = '' 
}: FeatureCardProps) {
  const baseClasses = "text-center p-6 rounded-lg transition-all duration-300 hover:shadow-lg";
  const variantClasses = variant === 'dark' 
    ? "bg-white text-gray-900" 
    : "border border-gray-200 bg-white text-gray-900";
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        variant === 'dark' ? 'bg-orange-100' : 'bg-orange-100'
      }`}>
        <span className={`text-2xl text-orange-600 [&_*]:w-6 [&_*]:h-6`}>{icon}</span>
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
