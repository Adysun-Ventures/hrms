import React from 'react';

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="text-center group">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-200">
        {/* Icon Container - Consistent size with other components */}
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <span className="text-white [&_*]:w-8 [&_*]:h-8">{icon}</span>
        </div>
        
        {/* Title - Consistent with TechStackCard */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors">
          {title}
        </h3>
        
        {/* Description - Consistent with PartnerCard */}
        <p className="text-lg text-gray-700 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
