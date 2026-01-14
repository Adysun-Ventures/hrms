import React from 'react';

interface PartnerLogosSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function PartnerLogosSection({ 
  title = "Trusted Technology Partners",
  subtitle = "We work with leading technology platforms to deliver world-class solutions",
  className = ''
}: PartnerLogosSectionProps) {
  // Hardcoded partner logos for consistency
  const partnerLogos = [
    "/assets/images/brand-logos/adysunventures_aws.png",
    "/assets/images/brand-logos/adysunventures_azure.png", 
    "/assets/images/brand-logos/adysunventures_googlecloud.png",
    "/assets/images/brand-logos/alibaba-cloud.png"
  ];

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h3>
          <p className="text-gray-600">
            {subtitle}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {partnerLogos.map((logo, index) => (
            <div key={index} className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-lg transition-shadow duration-300">
                <img
                  src={logo}
                  alt={`Partner ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
