"use client";

import React from 'react';

interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  isActive?: boolean;
}

interface ProcessStepsProps {
  steps: ProcessStep[];
  className?: string;
}

export default function ProcessSteps({ steps, className = '' }: ProcessStepsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
            step.isActive 
              ? 'bg-orange-600 text-white' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            step.isActive 
              ? 'bg-white text-orange-600' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step.number}
          </div>
          
          <div>
            <h4 className={`font-semibold ${step.isActive ? 'text-white' : 'text-gray-900'}`}>
              {step.title}
            </h4>
            <p className={`text-sm ${step.isActive ? 'text-gray-200' : 'text-gray-600'}`}>
              {step.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
