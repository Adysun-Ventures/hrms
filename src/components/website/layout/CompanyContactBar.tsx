'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Phone, Mail, Twitter, Instagram, Linkedin, Building2, MapPin, ChevronRight } from 'lucide-react';
import React from 'react';

type SocialItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

export type CompanyContactBarProps = {
  logoSrc?: string;
  companyName?: string;
  phone?: { label: string; href: string };
  email?: { label: string; href: string };
  social?: SocialItem[];
  cta?: { label: string; href: string };
  className?: string;
  variant?: 'light' | 'dark';
};

/**
 * A reusable horizontal contact/info strip designed to sit just above the footer.
 * Layout: Logo + name | phone + email | socials | CTA
 */
export default function CompanyContactBar({
  logoSrc = '/assets/adysunventures_logo.png',
  companyName = 'Adysun Ventures',
  phone = { label: '+91 9579537523', href: 'tel:+919579537523' },
  email = { label: 'info@adysunventures.com', href: 'mailto:info@adysunventures.com' },
  social,

  className = '',
  variant = 'light'
}: CompanyContactBarProps) {
  const defaultSocial: SocialItem[] = [
    {
      href: 'https://x.com/adysunventures',
      title: 'Twitter (X)',
      icon: <Twitter className="w-5 h-5" />
    },
    {
      href: 'https://www.instagram.com/adysunventures/',
      title: 'Instagram',
      icon: <Instagram className="w-5 h-5" />
    },
    {
      href: 'https://www.linkedin.com/company/adysun-ventures/',
      title: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />
    },
    {
      href: 'https://g.co/kgs/C5Fe6uz',
      title: 'Google Business Profile',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      href: 'https://maps.app.goo.gl/ABiUMnGGjcG7sT6o6',
      title: 'Google Maps',
      icon: <MapPin className="w-5 h-5" />
    }
  ];

  const items = social && social.length > 0 ? social : defaultSocial;

  const isLight = variant === 'light';
  const baseText = isLight ? 'text-white' : 'text-white';
  const subtleText = isLight ? 'text-gray-300' : 'text-gray-300';
  const iconColor = isLight ? 'text-gray-200' : 'text-gray-200';
  const iconHover = isLight ? 'hover:text-orange-400' : 'hover:text-orange-400';
  const ringColor = isLight ? 'border-gray-600' : 'border-gray-600';
  const bg = isLight ? '' : 'bg-gray-900';

  return (
    <div className={`${bg} ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Logo + Company Name */}
          {/* <div className="flex items-center gap-3 min-w-0">
            <Image
              src={logoSrc}
              alt={`${companyName} Logo`}
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <span className={`font-semibold text-lg ${baseText} truncate`}>{companyName}</span>
          </div> */}


<Link 
            href="/" 
            className="flex items-center space-x-2 rounded-md flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Adysun Ventures Home"
          >
            <Image
              src="/adysun-logo.png"
              alt="Adysun Ventures Logo"
              width={40}
              height={40}
              className="w-10 h-10 flex-shrink-0 drop-shadow-sm"
            />
            <div className="sm:block flex-shrink-0">
              <div className="text-base lg:text-lg font-bold text-dark-900 drop-shadow-sm">ADYSUN VENTURES</div>
              <div className="text-xs text-black drop-shadow-sm text-white">Inspire. Imagine. Implement.</div>
            </div>
          </Link>


          {/* Middle: Contact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2">
            {/* <a href={phone.href} className={`flex items-center gap-2 ${baseText} hover:opacity-80 transition-opacity`}>
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">{phone.label}</span>
            </a> */}
            <a href={email.href} className={`flex items-center gap-2 ${baseText} hover:opacity-80 transition-opacity`}>
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">{email.label}</span>
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {items.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.title}
                className={`${iconColor} ${iconHover} border ${ringColor} w-9 h-9 rounded-full flex items-center justify-center transition-colors`}
              >
                {link.icon}
              </a>
            ))}
          </div>

        
        </div>
      </div>
    </div>
  );
}


