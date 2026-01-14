import React from 'react';
import Threads from '@/components/ui/Threads';

interface HeroSectionTwoProps {
  className?: string;
}

const HeroSectionTwo: React.FC<HeroSectionTwoProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        {/* <Threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        /> */}
      </div>
    </div>
  );
};

export default HeroSectionTwo;
