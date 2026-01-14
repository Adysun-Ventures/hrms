import React from 'react';

interface PartnerCardProps {
  name: string;
  logo: string;
  partnership: string;
  description: string;
  isLast?: boolean;
}

export default function PartnerCard({ 
  name, 
  logo, 
  partnership, 
  description, 
  isLast = false 
}: PartnerCardProps) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
        {/* Partner Logo */}
        <div className="lg:col-span-3 text-center">
          <div className="bg-orange-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img
              src={logo}
              alt={`${name} Logo`}
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>
        </div>

        {/* Divider Line */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="w-px h-48 bg-gradient-to-b from-orange-400 to-orange-600 mx-auto"></div>
        </div>

        {/* Partner Information */}
        <div className="lg:col-span-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center lg:text-left">
            {name}
          </h2>
          <h3 className="text-xl text-orange-600 font-semibold mb-6 text-center lg:text-left uppercase tracking-wide">
            {partnership}
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed text-center lg:text-left">
            {description}
          </p>
        </div>
      </div>

      {/* Divider */}
      {!isLast && (
        <div className="flex justify-center mb-16">
          <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
        </div>
      )}
    </div>
  );
}
