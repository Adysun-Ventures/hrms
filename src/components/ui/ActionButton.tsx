import React from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

type ActionButtonProps = {
  icon: React.ReactNode;
  title: string;
  colorClass: string; // e.g. "bg-blue-100 text-blue-600 hover:text-blue-900"
  href?: string;
  onClick?: () => void;
  as?: 'button' | 'link';
  className?: string;
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  title,
  colorClass,
  href,
  onClick,
  as,
  className = '',
}) => {
  // Extract color from colorClass to determine tooltip color
  const getTooltipColor = (colorClass: string): 'blue' | 'green' | 'red' | 'gray' | 'purple' | 'yellow' => {
    if (colorClass.includes('blue')) return 'blue';
    if (colorClass.includes('green')) return 'green';
    if (colorClass.includes('red')) return 'red';
    if (colorClass.includes('amber') || colorClass.includes('yellow')) return 'yellow';
    if (colorClass.includes('purple')) return 'purple';
    return 'gray';
  };

  const tooltipColor = getTooltipColor(colorClass);
  // Ensure perfect square buttons with proper padding like refresh button
  const baseClasses = `border border-gray-300 rounded-md p-2 w-10 h-10 flex items-center justify-center ${colorClass} ${className}`;

  const buttonContent = (
    <div className="flex items-center justify-center w-full h-full">
      {icon}
    </div>
  );

  if (as === 'link' || href) {
    return (
      <Tooltip content={title} color={tooltipColor} position="top">
        <Link href={href!} className={baseClasses}>
          {buttonContent}
        </Link>
      </Tooltip>
    );
  }
  return (
    <Tooltip content={title} color={tooltipColor} position="top">
      <button onClick={onClick} className={baseClasses}>
        {buttonContent}
      </button>
    </Tooltip>
  );
};
