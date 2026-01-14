import React from 'react';
import { componentTokens, designTokens, combineTokens } from '@/lib/design-tokens';

interface SectionProps {
  children: React.ReactNode;
  variant?: 'white' | 'gradient' | 'dark' | 'custom';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}

/**
 * Reusable Section component with consistent spacing and styling
 * @param variant - Section background variant
 * @param size - Section padding size
 * @param className - Additional CSS classes
 * @param id - Section ID for navigation
 * @param as - HTML element to render as
 */
export default function Section({
  children,
  variant = 'white',
  size = 'medium',
  className = '',
  id,
  as: Component = 'section'
}: SectionProps) {
  const sizeClasses = {
    small: designTokens.spacing.section.small,
    medium: designTokens.spacing.section.medium,
    large: designTokens.spacing.section.large
  };

  const variantClasses = {
    white: combineTokens(
      sizeClasses[size],
      'bg-white',
      designTokens.spacing.container
    ),
    gradient: combineTokens(
      sizeClasses[size],
      designTokens.colors.gradients.primary,
      designTokens.spacing.container
    ),
    dark: combineTokens(
      sizeClasses[size],
      designTokens.colors.secondary.gray[800],
      designTokens.spacing.container,
      'text-white'
    ),
    custom: combineTokens(
      sizeClasses[size],
      designTokens.spacing.container
    )
  };

  const baseClasses = combineTokens(
    variantClasses[variant],
    className
  );

  return (
    <Component className={baseClasses} id={id}>
      {children}
    </Component>
  );
}
