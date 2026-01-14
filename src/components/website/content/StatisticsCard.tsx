import React from 'react';
import CountUp from '@/components/reactbits/CountUp';

interface StatisticsCardProps {
  number: string;
  label: string;
  variant?: 'light' | 'dark';
  className?: string;
  duration?: number;
  delay?: number;
}

export default function StatisticsCard({ 
  number, 























































  
  label, 
  variant = 'dark',
  className = '',
  duration = 2,
  delay = 0
}: StatisticsCardProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const labelColor = variant === 'light' ? 'text-gray-200' : 'text-gray-600';
  
  // Extract numeric value and suffix from number string (e.g., "0+" -> value: 0, suffix: "+")
  const match = number.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const numericValue = match ? parseFloat(match[1]) : 0;
  const suffix = match && match[2] ? match[2] : '';
  
  return (
    <div className={`text-center group hover:scale-105 transition-transform duration-300 ${className}`}>
      <div className={`text-4xl md:text-5xl font-bold mb-2 ${textColor} group-hover:text-orange-600 transition-colors`}>
        <CountUp 
          to={numericValue} 
          duration={duration} 
          delay={delay}
        />
        {suffix}
      </div>
      <div className={`text-lg ${labelColor} group-hover:text-orange-500 transition-colors`}>
        {label}
      </div>
    </div>
  );
}
