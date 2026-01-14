import React from 'react';

interface ComprehensiveServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function ComprehensiveServiceCard({ 
  icon, 
  title, 
  description, 
  className = '' 
}: ComprehensiveServiceCardProps) {
  return (
    <div className={`text-center group ${className}`}>
      <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200 hover:border-orange-300 hover:-translate-y-1">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-orange-200">
          <span className="text-orange-600 [&_*]:w-10 [&_*]:h-10 group-hover:text-orange-700 transition-colors">
            {icon}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
