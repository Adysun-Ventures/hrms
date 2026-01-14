import React from 'react';
import SectionTitle from '../ui/SectionTitle';
import FAQAccordion from '../content/FAQAccordion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function FAQSection({ 
  title = "Frequently Asked Questions",
  subtitle = "Find answers to common questions about our IT services and solutions",
  className = ''
}: FAQSectionProps) {
  const items: FAQItem[] = [
    {
      question: "What IT services does Adysun Ventures offer?",
      answer: "We offer comprehensive IT services including custom software development, cloud migration, cybersecurity, data analytics, digital transformation, and business strategy consulting."
    },
    {
      question: "How can IT solutions improve my business operations?",
      answer: "Our IT solutions can streamline processes, improve efficiency, reduce costs, enhance customer experience, and provide data-driven insights for better decision-making."
    },
    {
      question: "What industries does Adysun Ventures specialize in?",
      answer: "We specialize in financial services, e-commerce, transportation, healthcare, manufacturing, and retail, with tailored solutions for each industry's unique needs."
    },
    {
      question: "How does your business strategy consulting work?",
      answer: "We analyze your current technology landscape, identify improvement opportunities, develop strategic roadmaps, and help implement solutions that align with your business goals."
    },
    {
      question: "What security measures do you implement to protect client data?",
      answer: "We implement enterprise-grade security including encryption, secure development practices, regular security audits, compliance with industry standards, and ongoing monitoring."
    }
  ];
  return (
    <section className={`mb-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={title}
          subtitle={subtitle}
          alignment="center"
        />
        
        <FAQAccordion
          items={items}
          className="max-w-4xl mx-auto"
        />
      </div>
    </section>
  );
}
