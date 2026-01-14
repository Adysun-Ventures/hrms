/**
 * Company Links Constants
 * Centralized location for all Adysun Ventures company links
 * Update links here to propagate changes across the entire application
 */

export const COMPANY_LINKS = {
  // Social Media
  social: {
    instagram: 'https://www.instagram.com/adysunventures/',
    linkedin: 'https://www.linkedin.com/company/adysun-ventures/',
    twitter: 'https://x.com/adysunventures',
  },
  
  // Google Services
  google: {
    businessProfile: 'https://g.co/kgs/C5Fe6uz',
    maps: {
      pune: 'https://maps.app.goo.gl/ABiUMnGGjcG7sT6o6',
      thane: 'https://maps.app.goo.gl/tziAu2cdmPzLm9ie9',
    },
  },
  
  // Contact Information
  contact: {
    // phone: {
    //   number: '+91 9579537523',
    //   href: 'tel:+919579537523',
    // },
    email: {
      general: 'info@adysunventures.com',
      hr: 'hr@adysunventures.com',
    },
  },
  
  // Office Locations
  locations: {
    pune: {
      name: 'Pune Office (Head Office)',
      address: 'Workplex, S no 47, Near Bhapkar Petrol Pump, Pune, Maharashtra - 411009',
      maps: 'https://maps.app.goo.gl/ABiUMnGGjcG7sT6o6',
      googleSearch: 'https://g.co/kgs/C5Fe6uz',
    },
    thane: {
      name: 'Thane Office (Mumbai Division)',
      address: 'A2, 704, Kanchanpushp Society Kavesar, Thane West, Thane, Maharashtra - 400607',
      maps: 'https://maps.app.goo.gl/tziAu2cdmPzLm9ie9',
      googleSearch: 'https://g.co/kgs/C5Fe6uz',
    },
  },
} as const;

