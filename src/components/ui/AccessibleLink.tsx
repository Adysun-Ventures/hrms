import React from 'react';
import Link from 'next/link';
import { designTokens, combineTokens } from '@/lib/design-tokens';

interface AccessibleLinkProps {
  children: React.ReactNode;
  href: string;
  variant?: 'default' | 'button' | 'nav' | 'footer';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  external?: boolean;
  onClick?: () => void;
}

/**
 * Accessible Link component with enhanced accessibility features
 * - Proper ARIA labels for screen readers
 * - Keyboard navigation support
 * - External link indicators
 * - Focus management
 * - Minimum touch targets
 */
export default function AccessibleLink({
  children,
  href,
  variant = 'default',
  size = 'medium',
  className = '',
  ariaLabel,
  ariaDescribedBy,
  external = false,
  onClick
}: AccessibleLinkProps) {
           const sizeClasses = {
           small: 'min-h-[44px] min-w-[44px] px-2 py-1 text-sm touch-manipulation',
           medium: 'min-h-[44px] min-w-[44px] px-3 py-2 text-base touch-manipulation',
           large: 'min-h-[48px] min-w-[48px] px-4 py-3 text-lg touch-manipulation'
         };

  const variantClasses = {
    default: 'text-orange-600 hover:text-orange-700 underline underline-offset-2',
    button: combineTokens(
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
      designTokens.colors.primary[600],
      'hover:' + designTokens.colors.primary[700],
      designTokens.shadows.small,
      'hover:' + designTokens.shadows.medium
    ),
    nav: 'text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200',
    footer: 'text-gray-600 hover:text-orange-600 transition-colors duration-200'
  };

  const baseClasses = combineTokens(
    'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  const ariaProps = {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...(external && {
      'aria-label': `${ariaLabel || 'External link'} (opens in new tab)`,
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  };

  // Remove undefined aria props
  Object.keys(ariaProps).forEach(key => {
    if (ariaProps[key as keyof typeof ariaProps] === undefined) {
      delete ariaProps[key as keyof typeof ariaProps];
    }
  });

  return (
    <Link
      href={href}
      className={baseClasses}
      onClick={onClick}
      {...ariaProps}
    >
      {children}
      {external && (
        <span className="ml-1 inline-block" aria-hidden="true">
          <svg
            className="w-4 h-4 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </span>
      )}
    </Link>
  );
}
