import React from 'react';

interface TechStackCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function TechStackCard({ icon, title, subtitle }: TechStackCardProps) {
  return (
    <div className="text-center group">
      <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-orange-100 hover:border-orange-300">
        {/* Icon Container - Consistent size with BenefitCard */}
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
          <span className="text-orange-500 group-hover:text-orange-600 [&_*]:w-8 [&_*]:h-8">{icon}</span>
        </div>
        
        {/* Title - Consistent with BenefitCard */}
        <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors">
          {title}
        </h4>
        
        {/* Subtitle - Consistent styling */}
        <span className="
inline-block text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-200 font-medium leading-snug text-center">
          {subtitle}
        </span>
      </div>
    </div>
  );
}