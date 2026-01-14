'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Info,
  ChevronRight,
} from 'lucide-react';
import { GoogleMapsButton, GoogleSearchButton } from '../ui/HollowButton';
import CompanyContactBar from './layout/CompanyContactBar';

export default function Footer() {
  const pathname = usePathname();

  // Function to check if a link is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Function to get link classes based on active state
  const getLinkClasses = (href: string) => {
    const baseClasses = "flex items-center transition-colors duration-300";
    const activeClasses = "text-orange-400 hover:text-orange-300";
    const inactiveClasses = "text-white hover:text-gray-300";
    
    return `${baseClasses} ${isActive(href) ? activeClasses : inactiveClasses}`;
  };

  // Function to get icon classes based on active state
  const getIconClasses = (href: string) => {
    return `w-4 h-4 mr-2 ${isActive(href) ? 'text-orange-400' : 'text-white'}`;
  };

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/images/bg/landing_bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gray-900/90"></div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10">


<section aria-label="Company contact bar just above footer">
          <CompanyContactBar />
        </section>
      {/* Main Footer Content */}
      <div className="pb-16 pt-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Quick Links */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-2 text-white">Quick Links</h4>
              <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
              <ul className="space-y-3">
                <li>
                  <Link href="/about-us" className={getLinkClasses('/about-us')}>
                    <ChevronRight className={getIconClasses('/about-us')} />
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className={getLinkClasses('/contact-us')}>
                    <ChevronRight className={getIconClasses('/contact-us')} />
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/services" className={getLinkClasses('/services')}>
                    <ChevronRight className={getIconClasses('/services')} />
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/technologies" className={getLinkClasses('/technologies')}>
                    <ChevronRight className={getIconClasses('/technologies')} />
                    Technologies
                  </Link>
                </li>
                <li>
                  <Link href="/industries" className={getLinkClasses('/industries')}>
                    <ChevronRight className={getIconClasses('/industries')} />
                    Industries
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className={getLinkClasses('/careers')}>
                    <ChevronRight className={getIconClasses('/careers')} />
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/enquiry" className={getLinkClasses('/enquiry')}>
                    <ChevronRight className={getIconClasses('/enquiry')} />
                    Enquiry
                  </Link>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-2 text-white">Industries</h4>
              <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
              <ul className="space-y-3">
                <li>
                  <Link href="/industries/ecommerce" className={getLinkClasses('/industries/ecommerce')}>
                    <ChevronRight className={getIconClasses('/industries/ecommerce')} />
                    E-commerce
                  </Link>
                </li>
                <li>
                  <Link href="/industries/stock-exchange" className={getLinkClasses('/industries/stock-exchange')}>
                    <ChevronRight className={getIconClasses('/industries/stock-exchange')} />
                    Stock Exchange
                  </Link>
                </li>
                <li>
                  <Link href="/industries/algo-trading" className={getLinkClasses('/industries/algo-trading')}>
                    <ChevronRight className={getIconClasses('/industries/algo-trading')} />
                    Algo Trading
                  </Link>
                </li>
                <li>
                  <Link href="/industries/crypto-currency" className={getLinkClasses('/industries/crypto-currency')}>
                    <ChevronRight className={getIconClasses('/industries/crypto-currency')} />
                    Crypto Currency
                  </Link>
                </li>
              </ul>
            </div>

            {/* Our Locations */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-2 text-white">Our Locations</h4>
              <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
              <div className="space-y-6">
                {/* Pune Office */}
                <div>
                  <div className="flex items-start space-x-3 mb-3">
                    <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                       <h5 className="font-semibold text-orange-500">Pune Office (Head Office)</h5>
                       <p className="text-white text-sm mt-1">
                         Adysun Ventures Pvt. Ltd.<br />
                         Workplex, S no 47,<br />
                         Near Bhapkar Petrol Pump,<br />
                         Pune, Maharashtra - 411009
                       </p>
                     </div>
                   </div>
                   <div className="flex space-x-2 mt-3">
                     <GoogleMapsButton href="https://maps.app.goo.gl/ABiUMnGGjcG7sT6o6" />
                     <GoogleSearchButton href="https://g.co/kgs/C5Fe6uz" />
                   </div>
                </div>

                {/* Thane Office */}
                <div>
                  <div className="flex items-start space-x-3 mb-3">
                    <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-orange-500">Thane Office (Mumbai Division)</h5>
                      <p className="text-white text-sm mt-1">
                        Adysun Ventures Pvt. Ltd.<br />
                        A2, 704, Kanchanpushp Society<br />
                        Kavesar, Thane West,<br />
                        Thane, Maharashtra - 400607
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <GoogleMapsButton href="https://maps.app.goo.gl/ABiUMnGGjcG7sT6o6" />
                    <GoogleSearchButton href="https://g.co/kgs/C5Fe6uz" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Us */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-2 text-white">Contact Us</h4>
              <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
              <div className="space-y-6">
                {/* Email Addresses Section */}
                <div>
                  <h6 className="text-orange-500 mb-3 font-semibold flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-orange-500" />
                    Email Addresses
                  </h6>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white text-sm mb-1">General Inquiries</p>
                      <a href="mailto:info@adysunventures.com" className="text-white hover:text-gray-300 transition-colors duration-300 text-sm">
                        info@adysunventures.com
                      </a>
                    </div>
                    <div>
                      <p className="text-white text-sm mb-1">HR & Recruitment</p>
                      <a href="mailto:hr@adysunventures.com" className="text-white hover:text-gray-300 transition-colors duration-300 text-sm">
                        hr@adysunventures.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Contact Number Section */}
                {/* <div>
                  <h6 className="text-orange-500 mb-3 font-semibold flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-orange-500" />
                    Contact Number
                  </h6>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-white" />
                      <a href="tel:+919579537523" className="text-white hover:text-gray-300 transition-colors duration-300 text-sm">
                        +91 9579537523
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-white" />
                      <span className="text-white text-sm">Mon-Sat 10:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-white" />
                      <span className="text-white text-sm">Closed on Sundays & National Holidays</span>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Footer Section */}
      <div className="border-t border-gray-700">
        {/* Company Info Section */}
        <div className="bg-white py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-black text-sm mb-1">
                Adysun Ventures Private Limited
              </p>
              <p className="text-black text-sm">
                CIN : U72900PN2020PTC196380
              </p>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="bg-black py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                © Copyright 2025 ADYSUN VENTURES PVT. LTD. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}