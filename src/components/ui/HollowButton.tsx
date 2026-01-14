import React from 'react';

interface HollowButtonProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  target?: string;
  rel?: string;
  className?: string;
  onClick?: () => void;
}

export default function HollowButton({
  href,
  children,
  icon,
  target = "_blank",
  rel = "noopener noreferrer",
  className = "",
  onClick
}: HollowButtonProps) {
  const baseClasses = "border border-orange-500 hover:bg-orange-500 text-orange-500 hover:text-white px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 flex items-center space-x-1";
  
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={combinedClasses}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </a>
  );
}

// Predefined icon components for common use cases
export const GoogleMapsIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

export const GoogleSearchIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Additional common icons
export const PhoneIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

export const EmailIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

export const ExternalLinkIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>
);

// Convenience components for common use cases
export const GoogleMapsButton = ({ href, children = "Google Maps" }: { href: string; children?: string }) => (
  <HollowButton href={href} icon={<GoogleMapsIcon />}>
    {children}
  </HollowButton>
);

export const GoogleSearchButton = ({ href, children = "Google Search" }: { href: string; children?: string }) => (
  <HollowButton href={href} icon={<GoogleSearchIcon />}>
    {children}
  </HollowButton>
);

export const PhoneButton = ({ href, children }: { href: string; children: string }) => (
  <HollowButton href={href} icon={<PhoneIcon />}>
    {children}
  </HollowButton>
);

export const EmailButton = ({ href, children }: { href: string; children: string }) => (
  <HollowButton href={href} icon={<EmailIcon />}>
    {children}
  </HollowButton>
);
