'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false);
  const industriesRef = useRef<HTMLDivElement>(null);
  const mobileIndustriesRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Route matching helpers
  const normalize = (p: string) => (p?.endsWith('/') && p !== '/' ? p.slice(0, -1) : p);
  const current = normalize(pathname || '/');
  const isActive = (href: string) => {
    const target = normalize(href);
    if (target === '/') return current === '/';
    return current === target || current.startsWith(target + '/login');
  };

  // Styling helpers
  const desktopBase = 'font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md px-2 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm lg:text-base';
  const desktopActive = 'text-orange-600 border-b-2 border-orange-500 font-semibold';
  const desktopInactive = 'text-black hover:text-orange-600';

  const mobileBase = 'block rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] flex items-center';
  const mobileActive = 'text-orange-600 bg-orange-50 font-semibold';
  const mobileInactive = 'text-black hover:text-orange-600 hover:bg-orange-50';

  const isIndustries = isActive('/industries');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.navigation-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsIndustriesOpen(false);
      }
    };

    if (isMenuOpen || isIndustriesOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, isIndustriesOpen]);

  // Close industries dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideDesktop = industriesRef.current && industriesRef.current.contains(target);
      const isInsideMobile = mobileIndustriesRef.current && mobileIndustriesRef.current.contains(target);
      
      if (!isInsideDesktop && !isInsideMobile) {
        setIsIndustriesOpen(false);
      }
    };

    if (isIndustriesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isIndustriesOpen]);

  // Links are rendered inline below with active-state logic

  const industriesItems = [
    { href: '/industries/ecommerce', label: 'E-commerce' },
    { href: '/industries/stock-exchange', label: 'Stock Exchange' },
    { href: '/industries/algo-trading', label: 'Algo Trading'},
    { href: '/industries/crypto-currency', label: 'Crypto Currency'}
  ];

  return (
    // <nav 
    //   className={`navigation-container fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    //     isScrolled 
    //       ? 'backdrop-blur-md bg-white/20 border-b border-white/30 shadow-xl' 
    //       : 'backdrop-blur-sm bg-white/10 border-b border-white/20'
    //   } ${className}`}
    //   role="navigation"
    //   aria-label="Main navigation"
    // >
    //   <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
    //     <div className="flex justify-between items-center h-16">
    //       {/* Logo */}
    //       <Link 
    //         href="/" 
    //         className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md flex-shrink-0 hover:opacity-80 transition-opacity"
    //         aria-label="Adysun Ventures Home"
    //       >
    //         <Image
    //           src="/adysun-logo.png"
    //           alt="Adysun Ventures Logo"
    //           width={40}
    //           height={40}
    //           className="w-10 h-10 flex-shrink-0 drop-shadow-sm"
    //         />
    //         <div className="sm:block flex-shrink-0">
    //           <div className="text-base lg:text-lg font-bold text-gray-900 drop-shadow-sm">ADYSUN VENTURES</div>
    //           <div className="text-xs text-black drop-shadow-sm">Inspire. Imagine. Implement.</div>
    //         </div>
    //       </Link>

    //                 {/* Desktop Navigation */}
    //       <div className="hidden md:flex items-center space-x-4 lg:space-x-6 min-w-0 flex-wrap">
    //         {/* Home */}
    //         <Link
    //           href="/"
    //           aria-current={isActive('/') ? 'page' : undefined}
    //           className={`${isActive('/') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Home page"
    //         >
    //           Home
    //         </Link>
            
    //         {/* About */}
    //         <Link
    //           href="/about-us"
    //           aria-current={isActive('/about-us') ? 'page' : undefined}
    //           className={`${isActive('/about-us') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to About page"
    //         >
    //           About
    //         </Link>
            
    //         {/* Services */}
    //         <Link
    //           href="/services"
    //           aria-current={isActive('/services') ? 'page' : undefined}
    //           className={`${isActive('/services') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Services page"
    //         >
    //           Services
    //         </Link>
            
    //         {/* Partners */}
    //         <Link
    //           href="/partners"
    //           aria-current={isActive('/partners') ? 'page' : undefined}
    //           className={`${isActive('/partners') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Partners page"
    //         >
    //           Partners
    //         </Link>
            
    //         {/* Technologies */}
    //         <Link
    //           href="/technologies"
    //           aria-current={isActive('/technologies') ? 'page' : undefined}
    //           className={`${isActive('/technologies') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Technologies page"
    //         >
    //           Technologies
    //         </Link>
            
    //         {/* Industries Dropdown */}
    //         <div ref={industriesRef} className="relative">
    //           <div className="flex items-center">
    //             <Link
    //               href="/industries"
    //               aria-current={isIndustries ? 'page' : undefined}
    //               className={`${isIndustries ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //               aria-label="Navigate to Industries page"
    //             >
    //               Industries
    //             </Link>
    //             <button
    //               className="text-black hover:text-orange-600 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md px-1 py-2 min-h-[44px] min-w-[32px] flex items-center justify-center text-sm lg:text-base hover:bg-white/20 hover:backdrop-blur-sm"
    //               onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
    //               aria-expanded={isIndustriesOpen}
    //               aria-haspopup="true"
    //               aria-label="Industries dropdown menu"
    //             >
    //               <ChevronDown 
    //                 className={`w-4 h-4 transition-transform duration-200 ${
    //                   isIndustriesOpen ? 'rotate-180' : ''
    //                 }`} 
    //                 aria-hidden="true" 
    //               />
    //             </button>
    //           </div>
              
    //           {/* Dropdown Menu */}
    //           <div
    //             className={`absolute top-full left-0 mt-1 w-48 backdrop-blur-md bg-white rounded-lg shadow-xl border border-white/30 py-2 transition-all duration-200 ${
    //               isIndustriesOpen 
    //                 ? 'opacity-100  visible translate-y-0' 
    //                 : 'opacity-0 invisible -translate-y-2'
    //             }`}
    //             role="menu"
    //             aria-orientation="vertical"
    //             aria-hidden={!isIndustriesOpen}
    //           >
    //             {industriesItems.map((item) => (
    //               <Link
    //                 key={item.href}
    //                 href={item.href}
    //                 aria-current={isActive(item.href) ? 'page' : undefined}
    //                 className={`block px-4 py-2 text-sm ${isActive(item.href) ? 'text-orange-600 bg-orange-50/80 font-semibold' : 'text-gray-700 hover:text-orange-600 hover:bg-white/40'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] flex items-center backdrop-blur-sm`}
    //                 onClick={() => setIsIndustriesOpen(false)}
    //                 role="menuitem"
    //                 aria-label={`Navigate to ${item.label} page`}
    //               >
    //                 {item.label}
    //               </Link>
    //             ))}
    //           </div>
    //         </div>
            
    //         {/* Careers */}
    //         <Link
    //           href="/careers"
    //           aria-current={isActive('/careers') ? 'page' : undefined}
    //           className={`${isActive('/careers') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Careers page"
    //         >
    //           Careers
    //         </Link>
            
    //         {/* Clients */}
    //         <Link
    //           href="/clients"
    //           aria-current={isActive('/clients') ? 'page' : undefined}
    //           className={`${isActive('/clients') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Clients page"
    //         >
    //           Clients
    //         </Link>
            
    //         {/* Contact */}
    //         <Link
    //           href="/contact-us"
    //           aria-current={isActive('/contact-us') ? 'page' : undefined}
    //           className={`${isActive('/contact-us') ? desktopActive : desktopInactive} ${desktopBase} hover:bg-white/20 hover:backdrop-blur-sm transition-all duration-200`}
    //           aria-label="Navigate to Contact page"
    //         >
    //           Contact
    //         </Link>
    //       </div>

    //       {/* Mobile Menu Button */}
    //       <button
    //         className="md:hidden p-2 rounded-md text-gray-700 hover:text-orange-600 hover:bg-white/30 hover:backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
    //         onClick={() => setIsMenuOpen(!isMenuOpen)}
    //         aria-expanded={isMenuOpen}
    //         aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
    //         aria-controls="mobile-menu"
    //       >
    //         {isMenuOpen ? (
    //           <X className="w-6 h-6" aria-hidden="true" />
    //         ) : (
    //           <Menu className="w-6 h-6" aria-hidden="true" />
    //         )}
    //       </button>
    //     </div>

    //     {/* Mobile Menu */}
    //     <div
    //       id="mobile-menu"
    //       className={`md:hidden transition-all duration-300 ease-in-out ${
    //         isMenuOpen 
    //           ? 'max-h-auto opacity-100 visible' 
    //           : 'max-h-0 opacity-0 invisible'
    //       }`}
    //       aria-hidden={!isMenuOpen}
    //     >
    //                                                  <div className="px-2 pt-2 pb-3 space-y-1 backdrop-blur-md bg-white/30 rounded-lg mt-2 shadow-lg border border-white/30">
    //                 {/* Home */}
    //                 <Link
    //                   href="/"
    //                   aria-current={isActive('/') ? 'page' : undefined}
    //                   className={`${isActive('/') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Home page"
    //                 >
    //                   Home
    //                 </Link>
                    
    //                 {/* About */}
    //                 <Link
    //                   href="/about-us"
    //                   aria-current={isActive('/about-us') ? 'page' : undefined}
    //                   className={`${isActive('/about-us') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to About page"
    //                 >
    //                   About
    //                 </Link>
                    
    //                 {/* Services */}
    //                 <Link
    //                   href="/services"
    //                   aria-current={isActive('/services') ? 'page' : undefined}
    //                   className={`${isActive('/services') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Services page"
    //                 >
    //                   Services
    //                 </Link>
                    
    //                 {/* Partners */}
    //                 <Link
    //                   href="/partners"
    //                   aria-current={isActive('/partners') ? 'page' : undefined}
    //                   className={`${isActive('/partners') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Partners page"
    //                 >
    //                   Partners
    //                 </Link>
                    
    //                 {/* Technologies */}
    //                 <Link
    //                   href="/technologies"
    //                   aria-current={isActive('/technologies') ? 'page' : undefined}
    //                   className={`${isActive('/technologies') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Technologies page"
    //                 >
    //                   Technologies
    //                 </Link>
                    
    //                 {/* Mobile Industries Dropdown */}
    //                 <div ref={mobileIndustriesRef} className="border-t border-white/30 pt-2 mt-2 relative z-10">
    //                   <div className="flex items-center justify-between">
    //                     <Link
    //                       href="/industries"
    //                       aria-current={isIndustries ? 'page' : undefined}
    //                       className={`flex-1 text-left ${isIndustries ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                       onClick={() => setIsMenuOpen(false)}
    //                       aria-label="Navigate to Industries page"
    //                     >
    //                       Industries
    //                     </Link>
    //                     <button
    //                       className="px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
    //                       onClick={(e) => {
    //                         e.preventDefault();
    //                         e.stopPropagation();
    //                         setIsIndustriesOpen(!isIndustriesOpen);
    //                       }}
    //                       aria-expanded={isIndustriesOpen}
    //                       aria-haspopup="true"
    //                       aria-label="Industries dropdown menu"
    //                     >
    //                       <ChevronDown 
    //                         className={`w-4 h-4 transition-transform duration-200 ${
    //                           isIndustriesOpen ? 'rotate-180' : ''
    //                         }`} 
    //                         aria-hidden="true" 
    //                       />
    //                     </button>
    //                   </div>
                      
    //                   {/* Mobile Dropdown Items */}
    //                   <div
    //                     className={`overflow-hidden transition-all duration-300 ease-in-out ${
    //                       isIndustriesOpen 
    //                         ? 'max-h-48 opacity-100 translate-y-0' 
    //                         : 'max-h-0 opacity-0 -translate-y-2'
    //                     }`}
    //                     aria-hidden={!isIndustriesOpen}
    //                   >
    //                     {industriesItems.map((item) => (
    //                       <Link
    //                         key={item.href}
    //                         href={item.href}
    //                         aria-current={isActive(item.href) ? 'page' : undefined}
    //                         className={`block px-6 py-2 text-sm ${isActive(item.href) ? 'text-orange-600 bg-orange-50/80 font-semibold' : 'text-gray-600 hover:text-orange-600 hover:bg-white/40'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] flex items-center backdrop-blur-sm`}
    //                         onClick={() => {
    //                           setIsMenuOpen(false);
    //                           setIsIndustriesOpen(false);
    //                         }}
    //                         aria-label={`Navigate to ${item.label} page`}
    //                       >
    //                         {item.label}
    //                       </Link>
    //                     ))}
    //                   </div>
    //                 </div>
                    
    //                 {/* Careers */}
    //                 <Link
    //                   href="/careers"
    //                   aria-current={isActive('/careers') ? 'page' : undefined}
    //                   className={`${isActive('/careers') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Careers page"
    //                 >
    //                   Careers
    //                 </Link>
                    
    //                 {/* Clients */}
    //                 <Link
    //                   href="/clients"
    //                   aria-current={isActive('/clients') ? 'page' : undefined}
    //                   className={`${isActive('/clients') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Clients page"
    //                 >
    //                   Clients
    //                 </Link>
                    
    //                 {/* Contact */}
    //                 <Link
    //                   href="/contact-us"
    //                   aria-current={isActive('/contact-us') ? 'page' : undefined}
    //                   className={`${isActive('/contact-us') ? mobileActive : mobileInactive} ${mobileBase} px-3 py-3 text-base font-medium hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200`}
    //                   onClick={() => setIsMenuOpen(false)}
    //                   aria-label="Navigate to Contact page"
    //                 >
    //                   Contact
    //                 </Link>
    //               </div>
    //     </div>
    //   </div>
    // </nav>
    <></>
  );
}
