import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DetailedServiceSectionProps {
  title: string;
  description: string;
  solutions: string[];
  technologies?: string[];
  className?: string;
}

export default function DetailedServiceSection({ 
  title, 
  description, 
  solutions, 
  technologies = [],
  className = '' 
}: DetailedServiceSectionProps) {
  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="text-4xl md:text-5xl font-bold text-orange-600 mb-6 leading-tight">
              {title}
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {description}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200 shadow-lg">
            <h4 className="text-xl font-bold text-gray-900 mb-6">
              Adysun Ventures {title} Solutions Include:
            </h4>
            <ul className="space-y-4 mb-6">
              {solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-lg">{solution}</span>
                </li>
              ))}
            </ul>
            
            {technologies.length > 0 && (
              <div className="pt-6 border-t border-orange-200">
                <h5 className="text-lg font-semibold text-gray-800 mb-4">Technologies We Use:</h5>
                <div className="flex flex-wrap gap-3">
                  {technologies.map((tech, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium border border-orange-200 hover:bg-orange-50 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
