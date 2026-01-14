'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Brain, BarChart3, Smartphone, Target, TrendingUp, Zap, RefreshCw, Briefcase } from 'lucide-react';

interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  content: {
    mainTitle: string;
    mainDescription: string;
    features: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
    }>;
  };
}

interface InteractiveProcessStepsProps {
  steps: ProcessStep[];
  className?: string;
}

export default function InteractiveProcessSteps({ steps, className = '' }: InteractiveProcessStepsProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality when component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start auto-play when component comes into view
            setIsAutoPlaying(true);
          } else {
            // Stop auto-play when component is out of view
            setIsAutoPlaying(false);
          }
        });
      },
      { threshold: 0.3 } // Trigger when 30% of component is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-play timer effect
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayIntervalRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 4000); // Change step every 4 seconds
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, steps.length]);

  // Pause auto-play when user manually clicks
  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false);
    
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  return (
    <div ref={containerRef} className={`grid grid-cols-1 lg:grid-cols-3 gap-12 ${className}`}>
      {/* Left Sidebar - Process Steps */}
      <div className="lg:col-span-1">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`cursor-pointer transition-all duration-300 rounded-xl p-4 ${
                activeStep === index
                  ? 'bg-gradient-to-r from-orange-200 to-orange-100 border-l-4 border-orange-600 pl-6 shadow-xl ring-2 ring-orange-200 border-0'
                  : 'bg-gradient-to-r from-orange-50 to-white border border-orange-200 pl-6 hover:bg-orange-100 hover:shadow-lg hover:border-orange-300'
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div className="flex items-start space-x-4">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  activeStep === index ? 'text-orange-700' : 'text-gray-400'
                }`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 transition-colors duration-300 ${
                    activeStep === index ? 'text-orange-800' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    activeStep === index ? 'text-orange-700' : 'text-gray-600'
                  }`}>
                    {step.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right Side - Content */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 shadow-xl border-2 border-orange-200 hover:shadow-2xl hover:border-orange-300 transition-all duration-300">
          <h3 className="text-2xl font-bold text-orange-900 mb-4">
            {steps[activeStep].content.mainTitle}
          </h3>
          <p className="text-orange-700 leading-relaxed">
            {steps[activeStep].content.mainDescription}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps[activeStep].content.features.map((feature, index) => (
            <div key={index} className="text-center bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 shadow-xl border-2 border-orange-200 hover:shadow-2xl hover:scale-105 hover:border-orange-300 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-orange-900">{feature.title}</h4>
              <p className="text-orange-700 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
