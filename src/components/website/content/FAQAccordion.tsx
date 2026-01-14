"use client";

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export default function FAQAccordion({ items, className = '' }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className={`w-full px-3 py-3 sm:px-4 sm:py-3 text-left flex justify-between items-start sm:items-center transition-all duration-300 ease-in-out min-h-[48px] ${
              openIndex === index 
                ? 'bg-orange-50 text-orange-900 border-l-4 border-orange-500' 
                : 'hover:bg-gray-50 text-gray-900'
            }`}
            onClick={() => toggleItem(index)}
            aria-expanded={openIndex === index}
            aria-controls={`faq-content-${index}`}
            aria-label={`${openIndex === index ? 'Close' : 'Open'} FAQ: ${item.question}`}
          >
            <span className="font-medium text-sm sm:text-base pr-2 leading-relaxed">{item.question}</span>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 ease-in-out ${
                openIndex === index ? 'rotate-180 text-orange-600' : 'text-gray-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div 
            id={`faq-content-${index}`}
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-hidden={openIndex !== index}
          >
            <div className="px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
