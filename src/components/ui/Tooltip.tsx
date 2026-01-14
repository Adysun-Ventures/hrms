import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  maxWidth?: number;
  color?: 'blue' | 'green' | 'red' | 'gray' | 'purple' | 'yellow';
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delay = 200,
  maxWidth = 200,
  color = 'gray'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollLeft + 8;
        break;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'gray':
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getArrowColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'border-t-blue-50';
      case 'green':
        return 'border-t-green-50';
      case 'red':
        return 'border-t-red-50';
      case 'purple':
        return 'border-t-purple-50';
      case 'yellow':
        return 'border-t-yellow-50';
      case 'gray':
      default:
        return 'border-t-gray-50';
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0 border-4 border-transparent';
    const colorClasses = getArrowColorClasses();
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 ${colorClasses}`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 ${colorClasses.replace('border-t-', 'border-b-')}`;
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ${colorClasses.replace('border-t-', 'border-l-')}`;
      case 'right':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 ${colorClasses.replace('border-t-', 'border-r-')}`;
      default:
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 ${colorClasses}`;
    }
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999]"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          role="tooltip"
          aria-hidden="true"
        >
          <div 
            className={`relative px-4 py-2.5 rounded-lg shadow-xl border ${getColorClasses()}`}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <div className="text-sm font-medium leading-relaxed whitespace-nowrap">
              {content}
            </div>
            {/* Arrow */}
            <div className={getArrowClasses()}></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip; 