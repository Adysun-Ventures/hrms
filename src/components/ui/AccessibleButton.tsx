import React from 'react';
import { designTokens, combineTokens } from '@/lib/design-tokens';

interface AccessibleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
  role?: string;
  tabIndex?: number;
}

/**
 * Accessible Button component with enhanced accessibility features
 * - Minimum 44px touch targets
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Focus management
 * - Screen reader friendly
 */
export default function AccessibleButton({
  children,
  variant = 'primary',
  size = 'medium',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  role,
  tabIndex = 0
}: AccessibleButtonProps) {
           const sizeClasses = {
           small: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm touch-manipulation',
           medium: 'min-h-[44px] min-w-[44px] px-6 py-3 text-base touch-manipulation',
           large: 'min-h-[48px] min-w-[48px] px-8 py-4 text-lg touch-manipulation'
         };

  const variantClasses = {
    primary: combineTokens(
      designTokens.colors.primary[600],
      'hover:' + designTokens.colors.primary[700],
      designTokens.shadows.small,
      'hover:' + designTokens.shadows.medium
    ),
    secondary: 'bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white',
    outline: 'bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white',
    ghost: 'bg-transparent text-orange-600 hover:bg-orange-50'
  };

  const baseClasses = combineTokens(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
    'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    sizeClasses[size],
    variantClasses[variant],
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  const ariaProps = {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    'aria-disabled': disabled,
    role: role,
    tabIndex: disabled ? -1 : tabIndex
  };

  // Remove undefined aria props
  Object.keys(ariaProps).forEach(key => {
    if (ariaProps[key as keyof typeof ariaProps] === undefined) {
      delete ariaProps[key as keyof typeof ariaProps];
    }
  });

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={onClick}
        {...ariaProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      {...ariaProps}
    >
      {children}
    </button>
  );
}
