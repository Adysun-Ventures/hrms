import React from 'react';
import { componentTokens, combineTokens } from '@/lib/design-tokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Reusable Card component with consistent styling
 * @param variant - Card style variant
 * @param padding - Card padding size
 * @param hover - Enable hover effects
 * @param interactive - Make card clickable
 * @param className - Additional CSS classes
 */
export default function Card({
  children,
  variant = 'default',
  padding = 'medium',
  hover = false,
  interactive = false,
  className = '',
  onClick
}: CardProps) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const variantClasses = {
    default: componentTokens.card.base,
    elevated: combineTokens(
      componentTokens.card.base,
      componentTokens.shadows.large
    ),
    outlined: combineTokens(
      'bg-white border-2 border-orange-200',
      componentTokens.borderRadius.medium,
      paddingClasses[padding]
    )
  };

  const baseClasses = combineTokens(
    variantClasses[variant],
    paddingClasses[padding],
    hover ? componentTokens.card.hover : '',
    interactive ? componentTokens.card.interactive : '',
    className
  );

  return (
    <div
      className={baseClasses}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
}
