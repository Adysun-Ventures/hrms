"use client";

import React, { useRef, useEffect } from 'react';
import Button from '../ui/Button';
import { Cloud, Brain, Shield, Zap } from 'lucide-react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  backgroundImage?: string;
  variant?: 'dark' | 'gradient' | 'image';
  actions?: Array<{
    text: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
  }>;
  className?: string;
}

export default function HeroSection({ 
  title, 
  subtitle, 
  description,
  backgroundImage,
  variant = 'dark',
  actions = [],
  className = '' 
}: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = variant === 'image' && backgroundImage 
    ? (backgroundImage.endsWith('.mp4') || backgroundImage.endsWith('.webm') || backgroundImage.endsWith('.ogg'))
    : false;
  
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      // Ensure video plays on both desktop and mobile
      const playPromise = video.play();
      
      // If play() returns a promise, handle any errors
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video is playing successfully
          })
          .catch((error) => {
            // Autoplay was prevented, try again after user interaction
            console.log('Video autoplay prevented:', error);
          });
      }
    }
  }, [isVideo, backgroundImage]);
  
  if (variant === 'image' && backgroundImage) {
    
    return (
      <section 
        className={`relative w-full h-screen overflow-hidden ${className}`}
        style={{
          backgroundColor: 'rgb(10, 10, 10)',
          minHeight: '100vh'
        }}
        role="img"
        aria-label="Adysun Ventures hero section background"
      >
        {isVideo ? (
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src={backgroundImage} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }}
          />
        )}
        {/* Dark overlay - similar to data-overlay-dark="7" */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            // backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 0
          }}
        />
        
        {/* Content container - Industry Standard Layout */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex items-center pt-20 lg:pt-0" style={{ zIndex: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <div className="order-1 lg:order-1">
              
              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">ADYSUN VENTURES</span>
                {/* <span className="block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  When service matters
                  </span>
                </span> */}
              </h1>
              
              {/* Subtitle */}
              <h2 className="text-xl text-white">
                Premium IT Solutions & Business Strategy Servicessssss
              </h2>
              
              {/* Description */}
              {description && (
                <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-2xl">
                  {description}
                </p>
              )}
              
              {/* CTA Buttons */}
              {actions.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 m-12">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      href={action.href}
                      variant={action.variant}
                      size="lg"
                      className={`min-h-[56px] px-8 font-semibold transition-all duration-300 ${
                        action.variant === 'primary' 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/25' 
                          : 'border-2 border-white/30 hover:border-white/60 hover:bg-white/10'
                      }`}
                    >
                      {action.text}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Technology Focus Indicators */}
              {/* <div className="flex items-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center">
                  <Cloud className="w-10 h-10 text-orange-400 mr-2" />
                  <span>Cloud Solutions</span>
                </div>
                <div className="flex items-center">
                  <Brain className="w-10 h-10 text-blue-400 mr-2" />
                  <span>AI Integration</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-10 h-10 text-green-400 mr-2" />
                  <span>Cybersecurity</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-10 h-10 text-purple-400 mr-2" />
                  <span>Digital Transformation</span>
                </div>
              </div> */}
            </div>
            
            {/* Right Column - Interactive Tech Showcase */}
            <div className="order-2 lg:order-2 flex justify-center lg:justify-end hidden lg:flex">
              <div className="relative">
                {/* Floating Tech Cards - 2 per row on desktop with enhanced interactivity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Cloud Migration Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-float" style={{animationDelay: '0s'}}>
                    <div className="flex items-center justify-between mb-2">
                      <Cloud className="w-8 h-8 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold">Cloud Migration</h3>
                    <p className="text-gray-300 text-sm">AWS • Azure • GCP</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 bg-white/10 rounded-full h-1">
                      <div className="bg-orange-400 h-1 rounded-full w-4/5 animate-pulse"></div>
                    </div>
                    
                    {/* Hidden Stats on Hover */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Projects</span>
                        <span className="text-orange-400 font-bold">45+</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Success Rate</span>
                        <span className="text-green-400 font-bold">98%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Solutions Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-float" style={{animationDelay: '1.5s'}}>
                    <div className="flex items-center justify-between mb-2">
                      <Brain className="w-8 h-8 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold">AI Solutions</h3>
                    <p className="text-gray-300 text-sm">ML • Automation • Analytics</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 bg-white/10 rounded-full h-1">
                      <div className="bg-blue-400 h-1 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                    
                    {/* Hidden Stats on Hover */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Models Deployed</span>
                        <span className="text-blue-400 font-bold">32+</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Accuracy</span>
                        <span className="text-green-400 font-bold">94%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-float" style={{animationDelay: '3s'}}>
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-8 h-8 text-green-400 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold">Security</h3>
                    <p className="text-gray-300 text-sm">Compliance • Monitoring</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 bg-white/10 rounded-full h-1">
                      <div className="bg-green-400 h-1 rounded-full w-5/6 animate-pulse"></div>
                    </div>
                    
                    {/* Hidden Stats on Hover */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Systems Secured</span>
                        <span className="text-green-400 font-bold">120+</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Zero Breaches</span>
                        <span className="text-green-400 font-bold">100%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Digital Transform Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-float" style={{animationDelay: '4.5s'}}>
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-8 h-8 text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold">Digital Transform</h3>
                    <p className="text-gray-300 text-sm">Strategy • Implementation</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 bg-white/10 rounded-full h-1">
                      <div className="bg-purple-400 h-1 rounded-full w-4/5 animate-pulse"></div>
                    </div>
                    
                    {/* Hidden Stats on Hover */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Businesses Transformed</span>
                        <span className="text-purple-400 font-bold">67+</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>ROI Improvement</span>
                        <span className="text-green-400 font-bold">250%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default dark variant
  const backgroundClasses = variant === 'gradient' 
    ? 'bg-gradient-to-r from-orange-600 to-orange-700' 
    : 'bg-black';
  
  return (
    <section className={`relative py-20 ${backgroundClasses} ${className}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          {title}
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-orange-400 mb-6">
          {subtitle}
        </h2>
        
        {description && (
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            {description}
          </p>
        )}
        
        {actions.length > 0 && (
          <div className="space-x-4 flex flex-col sm:flex-row gap-4 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                href={action.href}
                variant={action.variant}
                size="lg"
                className="min-h-[48px] min-w-[44px] touch-manipulation"
              >
                {action.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
