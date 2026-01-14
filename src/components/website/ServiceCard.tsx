import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  image: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function ServiceCard({ 
  image, 
  icon, 
  title, 
  description, 
  className = '' 
}: ServiceCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-orange-200 ${className}`}>
      <div className="h-48 overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-1/2 ml-4">
          <span className="text-white [&_*]:w-6 [&_*]:h-6">{icon}</span>
        </div>
      </div>
      <div className="p-6 pt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed mb-4">{description}</p>
        <div className="flex items-center text-orange-600 font-semibold group-hover:text-orange-700 transition-colors">
          <span className="mr-2">Learn More</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
