'use client';

import Navigation from './layout/Navigation';
import Footer from './Footer';
import SkipLink from '../ui/SkipLink';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  title?: string; // reserved for future use
  description?: string; // reserved for future use
  showContactBar?: boolean;
}

export default function WebsiteLayout({ children,}: WebsiteLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Accessibility Skip Links */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#footer">Skip to footer</SkipLink>

      {/* Navigation - Using public variant */}
      <Navigation />

      {/* Main Content - Added top padding to account for fixed header */}
      <main id="main-content" className="pt-16">
        {children}
      </main>

      

      {/* Footer */}
      <footer id="footer">
        <Footer />
      </footer>
    </div>
  );
}
