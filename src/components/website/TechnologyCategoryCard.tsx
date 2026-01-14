import React from 'react';

interface Technology {
  name: string;
  logo: string;
}

interface TechnologyCategoryCardProps {
  title: string;
  icon: React.ReactNode;
  technologies: Technology[];
}

export default function TechnologyCategoryCard({ 
  title, 
  icon, 
  technologies 
}: TechnologyCategoryCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-8 border border-orange-200">
      {/* Category Header with Icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white [&_*]:w-8 [&_*]:h-8">{icon}</span>
        </div>
        <h3 className="text-3xl font-bold text-gray-900">
          {title}
        </h3>
      </div>

      {/* Technology Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {technologies.map((tech, techIndex) => (
          <div key={techIndex} className="group">
            <div className="bg-white hover:bg-orange-50 border-2 border-orange-100 hover:border-orange-300 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={tech.logo} 
                  alt={tech.name}
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                {tech.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
