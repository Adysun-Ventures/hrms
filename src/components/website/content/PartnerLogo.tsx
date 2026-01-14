import React from 'react';
import Image from 'next/image';

interface PartnerLogoProps {
  src: string;
  alt: string;
  href?: string;
  className?: string;
}

export default function PartnerLogo({ 
  src, 
  alt, 
  href,
  className = '' 
}: PartnerLogoProps) {
  const logoElement = (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={120}
        height={60}
        className="max-w-full h-auto opacity-70 hover:opacity-100 transition-opacity duration-300"
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform duration-300">
        {logoElement}
      </a>
    );
  }

  return logoElement;
}
