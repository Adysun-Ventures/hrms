import React from 'react';

interface PageHeroProps {
  title: string;
  titleHighlight?: string;
  description?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    isActive?: boolean;
  }>;
  className?: string;
  marginTop?: string;
}

export default function PageHero({
  title,
  titleHighlight,
  description,
  breadcrumbs = [],
  className = '',
  marginTop = ''
}: PageHeroProps) {
  return (
    <section className={`relative bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 py-16 ${className} `}>
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex justify-center items-center space-x-2 text-sm text-gray-600 mb-6">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-orange-600 mx-2">/</span>
                  )}
                  {crumb.href ? (
                    <a 
                      href={crumb.href}
                      className={`hover:text-orange-600 transition-colors duration-300 ${
                        crumb.isActive ? 'text-orange-600 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={`${
                      crumb.isActive ? 'text-orange-600 font-semibold' : 'text-gray-600'
                    }`}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            {title}
            {titleHighlight && (
              <span className="text-orange-600"> {titleHighlight}</span>
            )}
          </h1>
          
          {/* Description */}
          {description && (
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
