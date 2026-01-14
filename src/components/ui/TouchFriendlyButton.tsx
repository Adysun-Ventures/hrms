import React from 'react';
import { designTokens, combineTokens } from '@/lib/design-tokens';

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Touch-Friendly Button component with enhanced mobile accessibility
 * - Minimum 44px touch targets (WCAG 2.1 AA compliant)
 * - Proper focus indicators
 * - Loading states
 * - Responsive sizing
 */
export default function TouchFriendlyButton({
  children,
  variant = 'primary',
  size = 'medium',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  loading = false
}: TouchFriendlyButtonProps) {
  const sizeClasses = {
    small: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm touch-manipulation',
    medium: 'min-h-[44px] min-w-[44px] px-6 py-3 text-base touch-manipulation',
    large: 'min-h-[48px] min-w-[48px] px-8 py-4 text-lg touch-manipulation'
  };

  const variantClasses = {
    primary: combineTokens(
      designTokens.colors.primary[600],
      'hover:' + designTokens.colors.primary[700],
      'active:' + designTokens.colors.primary[800],
      designTokens.shadows.small,
      'hover:' + designTokens.shadows.medium
    ),
    secondary: 'bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white active:bg-orange-700',
    outline: 'bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white active:bg-orange-700',
    ghost: 'bg-transparent text-orange-600 hover:bg-orange-50 active:bg-orange-100'
  };

  const baseClasses = combineTokens(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
    'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    'touch-manipulation', // Optimize for touch
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  const content = loading ? (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>Loading...</span>
    </div>
  ) : children;

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={onClick}
        aria-disabled={disabled}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={loading ? 'Loading, please wait' : undefined}
    >
      {content}
    </button>
  );
}
