import React from 'react';
import ContactCard from '../content/ContactCard';
import { MapPin, Mail, Phone } from 'lucide-react';
import GoogleSearchIcon from '../icons/GoogleSearchIcon';
import GoogleMapsIcon from '../icons/GoogleMapsIcon';

interface Contact {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  actions?: Array<{
    text: string;
    href: string;
    variant: 'primary' | 'secondary';
    icon?: React.ReactNode;
  }>;
}

interface ContactSectionProps {
  contacts?: Contact[];
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * ContactSection component for displaying contact information
 * @param contacts - Array of contact information
 * @param title - Section title
 * @param subtitle - Section subtitle
 * @param className - Additional CSS classes
 */
export default function ContactSection({ 
  contacts,
  title = 'REACH OUT TO ADYSUN VENTURES',
  subtitle = 'Ready to start your journey with Adysun Ventures? Contact our team today.',
  className = ''
}: ContactSectionProps) {
  const defaultContacts: Contact[] = [
    {
      title: 'Pune Office (Head Office)',
      icon: <MapPin className="w-5 h-5" />,
      content: (
        <div>
          <p>Adysun Ventures Pvt. Ltd.</p>
          <p>Workplex, S no 47,</p>
          <p>Near Bhapkar Petrol Pump,</p>
          <p>Pune, Maharashtra - 411009</p>
        </div>
      ),
      actions: [
        { text: 'Google Maps', href: '#', variant: 'primary', icon: <GoogleMapsIcon size={16} /> },
        { text: 'Google Search', href: '#', variant: 'primary', icon: <GoogleSearchIcon size={16} /> }
      ]
    },
    {
      title: 'Thane Office (Mumbai Division)',
      icon: <MapPin className="w-5 h-5" />,
      content: (
        <div>
          <p>Adysun Ventures Pvt. Ltd.</p>
          <p>A2, 704, Kanchanpushp Society</p>
          <p>Kavesar, Thane West,</p>
          <p>Thane, Maharashtra - 400607</p>
        </div>
      ),
      actions: [
        { text: 'Google Maps', href: '#', variant: 'primary', icon: <GoogleMapsIcon size={16} /> },
        { text: 'Google Search', href: '#', variant: 'primary', icon: <GoogleSearchIcon size={16} /> }
      ]
    },
    {
      title: 'Email Contacts',
      icon: <Mail className="w-5 h-5" />,
      content: (
        <div>
          <p><strong>General Inquiries:</strong></p>
          <p>info@adysunventures.com</p>
          <p><strong>HR & Recruitment:</strong></p>
          <p>hr@adysunventures.com</p>
        </div>
      )
    },
    // {
    //   title: 'Phone',
    //   icon: <Phone className="w-5 h-5" />,
    //   content: (
    //     <div>
    //       <p className="text-lg font-semibold">+91 9579537523</p>
    //       <p>Mon-Sat: 10:00 AM - 6:00 PM</p>
    //       <p>Closed on Sundays & National Holidays</p>
    //     </div>
    //   )
    // }
  ];

  const contactData = contacts || defaultContacts;

  return (
    <section className={`py-20 bg-gradient-to-br from-orange-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-block bg-orange-100 text-orange-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
            Contact Information
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contactData.map((contact, index) => (
            <ContactCard
              key={index}
              title={contact.title}
              icon={contact.icon}
              content={contact.content}
              actions={contact.actions}
              className="hover:shadow-xl hover:border-orange-300 transition-all duration-300 border border-orange-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
