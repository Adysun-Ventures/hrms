"use client";

import React from 'react';

interface SocialMediaLink {
  platform: string;
  href: string;
  icon: string;
}

interface SocialMediaLinksProps {
  links: SocialMediaLink[];
  variant?: 'light' | 'dark';
  className?: string;
}

export default function SocialMediaLinks({ 
  links, 
  variant = 'dark',
  className = '' 
}: SocialMediaLinksProps) {
  const iconColor = variant === 'light' ? 'text-white' : 'text-gray-600';
  const hoverColor = variant === 'light' ? 'hover:text-orange-300' : 'hover:text-orange-600';
  
  return (
    <div className={`flex space-x-4 ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 rounded-full border-2 border-current flex items-center justify-center transition-colors ${iconColor} ${hoverColor}`}
          aria-label={`Follow us on ${link.platform}`}
        >
          <span className="text-lg">{link.icon}</span>
        </a>
      ))}
    </div>
  );
}
