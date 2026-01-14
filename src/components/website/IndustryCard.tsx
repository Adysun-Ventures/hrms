import React from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

interface IndustryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
  bgColor?: string;
}

export default function IndustryCard({ 
  icon, 
  title, 
  description, 
  link, 
  linkText,
  bgColor = 'bg-green-100'
}: IndustryCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <span className="text-white [&_*]:w-6 [&_*]:h-6">{icon}</span>
      </div>
      <h4 className="text-xl text-orange-900 font-semibold text-center mb-2">{title}</h4>
      <p className="text-orange-700 text-center mb-4">{description}</p>
      <div className="text-center">
      <Link
          href={link}
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
        >
          {linkText}
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
