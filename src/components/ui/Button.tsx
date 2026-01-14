import React from 'react';
import { componentTokens, combineTokens } from '@/lib/design-tokens';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Reusable Button component with consistent styling
 * @param variant - Button style variant
 * @param size - Button size
 * @param href - Optional link URL
 * @param onClick - Click handler
 * @param disabled - Disabled state
 * @param className - Additional CSS classes
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}: ButtonProps) {
           const sizeClasses = {
           small: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm touch-manipulation',
           medium: 'min-h-[44px] min-w-[44px] px-6 py-3 text-base touch-manipulation',
           large: 'min-h-[48px] min-w-[48px] px-8 py-4 text-lg touch-manipulation'
         };

  const variantClasses = {
    primary: componentTokens.button.primary,
    secondary: componentTokens.button.secondary,
    outline: componentTokens.button.outline,
    ghost: 'bg-transparent text-orange-600 hover:bg-orange-50'
  };

  const baseClasses = combineTokens(
    componentTokens.button.base,
    sizeClasses[size],
    variantClasses[variant],
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={onClick}
        aria-disabled={disabled}
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
    >
      {children}
    </button>
  );
}
