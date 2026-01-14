import React from 'react';
import CountUp from '@/components/reactbits/CountUp';
import { Briefcase, Users, Award, CheckCircle } from 'lucide-react';

type CounterItem = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
};

interface CounterSectionProps {
  items?: CounterItem[];
  backgroundImageUrl?: string;
  overlayOpacity?: number; // 0-100 (used for custom overlays if needed)
  className?: string;
}

export default function CounterSection({
  items,
  backgroundImageUrl,
  overlayOpacity = 60,
  className = ''
}: CounterSectionProps) {
  // Default statistics with real numbers
  const defaultItems: CounterItem[] = [
    {
      icon: <Briefcase className="w-6 h-6" />,
      value: "150+",
      label: "Total Projects"
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: "75+",
      label: "Happy Clients"
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: "12+",
      label: "Awards Won"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      value: "500+",
      label: "Tasks Completed"
    }
  ];

  const displayItems = items || defaultItems;
  const hasBackground = Boolean(backgroundImageUrl);

  return (
    <section
      className={`relative py-12 md:py-16 ${hasBackground ? 'bg-cover bg-center' : ''} ${className}`}
      style={hasBackground ? { backgroundImage: `url(${backgroundImageUrl})` } : undefined}
      aria-label="Key metrics"
    >
      {hasBackground && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: Math.min(Math.max(overlayOpacity, 0), 100) / 100 }}
          aria-hidden
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="bg-white/80 border border-orange-200 rounded-lg text-center p-6 shadow-lg backdrop-blur-sm"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4">
                {/* Icons should inherit current color; ensure they are sized */}
                <span className="[&_*]:w-6 [&_*]:h-6">{item.icon}</span>
              </span>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {typeof item.value === 'string' ? (
                  (() => {
                    const match = (item.value as string).match(/^(\d+(?:\.\d+)?)(.*)$/);
                    const end = match ? parseFloat(match[1]) : Number(item.value);
                    const suffix = match && match[2] ? match[2] : '';
                    return (
                      <>
                        <CountUp to={end} duration={2} />{suffix}
                      </>
                    );
                  })()
                ) : (
                  <CountUp to={Number(item.value)} duration={2} />
                )}
              </h3>
              <div className="h-0.5 w-16 bg-orange-300 my-3 mx-auto" />
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


