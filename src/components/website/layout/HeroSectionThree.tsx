"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface HeroSectionThreeProps {
  className?: string;
}

const HeroSectionThree: React.FC<HeroSectionThreeProps> = ({ 
  className = '' 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      {/* Header */}
      <header className="py-4 bg-gray-900 sm:py-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="shrink-0">
              <Link href="/" title="Adysun Ventures" className="flex">
                <img 
                  className="w-auto h-9" 
                  src="/adysun-logo.png" 
                  alt="Adysun Ventures" 
                />
              </Link>
            </div>

            <div className="flex md:hidden">
              <button 
                type="button" 
                className="text-white" 
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                <span className={expanded ? 'hidden' : 'block'} aria-hidden="true">
                  <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </span>

                <span className={expanded ? 'block' : 'hidden'} aria-hidden="true">
                  <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            </div>

            <nav className="hidden space-x-10 md:flex md:items-center md:justify-center lg:space-x-12">
              <Link href="/services" title="Services" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Services
              </Link>

              <Link href="/industries" title="Industries" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Industries
              </Link>

              <Link href="/technologies" title="Technologies" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Technologies
              </Link>

              <Link href="/contact-us" title="Contact" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Contact
              </Link>
            </nav>

       
          </div>

          <nav className={expanded ? 'block' : 'hidden'}>
            <div className="flex flex-col pt-8 pb-4 space-y-6">
              <Link href="/services" title="Services" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Services
              </Link>

              <Link href="/industries" title="Industries" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Industries
              </Link>

              <Link href="/technologies" title="Technologies" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Technologies
              </Link>

              <Link href="/contact-us" title="Contact" className="text-base font-normal text-gray-400 transition-all duration-200 hover:text-white">
                Contact
              </Link>

              <div className="relative inline-flex items-center justify-center group">
                <div className="absolute transition-all duration-200 rounded-full -inset-px bg-gradient-to-r from-orange-500 to-orange-600 group-hover:shadow-lg group-hover:shadow-orange-500/50"></div>
                <Link 
                  href="/contact-us" 
                  title="Get Started" 
                  className="relative inline-flex items-center justify-center w-full px-6 py-2 text-base font-normal text-white bg-black border border-transparent rounded-full" 
                  role="button"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gray-900 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid items-center max-w-5xl grid-cols-1 mx-auto gap-y-8 lg:grid-cols-5 gap-x-16">
            <div className="max-w-md mx-auto text-center lg:max-w-none lg:col-span-3">
              <h1 className="text-4xl font-normal text-white uppercase sm:text-5xl lg:text-6xl xl:text-8xl">
                When <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">service matters</span>
              </h1>
              <p className="mt-6 text-lg font-normal text-white sm:text-xl">
                Adysun Ventures is a leading IT solutions provider, offering comprehensive technology services to meet your industry-specific business needs.
              </p>
              <div className="mt-8 sm:mt-10">
                <Link 
                  href="/services" 
                  title="Our Services" 
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-normal text-white transition-all duration-200 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:contrast-150" 
                  role="button"
                >
                  Our Services
                </Link>
              </div>

              <p className="max-w-xs mx-auto mt-4 text-base font-normal text-gray-400 sm:mt-8">
                Premium IT Solutions & Business Strategy Services<br />
                <Link href="/contact-us" className="text-orange-400 hover:text-orange-300 underline">
                  Contact Us
                </Link>
              </p>
            </div>

            <div className="lg:col-span-2 lg:order-first">
              <img 
                className="w-full max-w-sm mx-auto" 
                src="/assets/images/bg/hero-bg-new.jpeg" 
                alt="Adysun Ventures IT Solutions" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSectionThree;
