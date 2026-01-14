// Comprehensive Design System for Adysun Ventures
// Standardized typography, colors, spacing, and component tokens

export const designSystem = {
  // Typography Scale (Responsive)
  typography: {
    // Font Sizes with clamp() for responsive scaling
    sizes: {
      xs: 'clamp(0.75rem, 1vw, 0.875rem)',      // 12-14px
      sm: 'clamp(0.875rem, 1.5vw, 1rem)',      // 14-16px
      base: 'clamp(1rem, 2vw, 1.125rem)',      // 16-18px
      lg: 'clamp(1.125rem, 2.5vw, 1.25rem)',  // 18-20px
      xl: 'clamp(1.25rem, 3vw, 1.5rem)',      // 20-24px
      '2xl': 'clamp(1.5rem, 4vw, 1.875rem)',  // 24-30px
      '3xl': 'clamp(1.875rem, 5vw, 2.25rem)',  // 30-36px
      '4xl': 'clamp(2.25rem, 6vw, 3rem)',     // 36-48px
      '5xl': 'clamp(3rem, 7vw, 3.75rem)',     // 48-60px
    },
    
    // Font Weights
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Line Heights
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    
    // Letter Spacing
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Color Palette (Consolidated)
  colors: {
    // Primary Orange Brand Colors
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    
    // Neutral Grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
    
    // White/Black
    white: '#ffffff',
    black: '#000000',
  },

  // Spacing System (Standardized)
  spacing: {
    // Base spacing units
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    
    // Section spacing
    section: {
      sm: '3rem',   // 48px
      md: '5rem',   // 80px
      lg: '6rem',   // 96px
      xl: '8rem',   // 128px
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Touch Targets (Accessibility)
  touchTargets: {
    min: '44px',
    recommended: '48px',
  },
};

// Component-specific design tokens
export const componentTokens = {
  // Button Components
  button: {
    base: 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'min-h-[44px] px-3 py-2 text-sm',
      md: 'min-h-[44px] px-4 py-2 text-base',
      lg: 'min-h-[48px] px-6 py-3 text-lg',
    },
    variants: {
      primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
      secondary: 'bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white',
      outline: 'bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white',
      ghost: 'bg-transparent text-orange-600 hover:bg-orange-50',
    },
  },

  // Card Components
  card: {
    base: 'bg-white rounded-lg shadow-md border border-gray-200',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    hover: 'hover:shadow-lg transition-shadow duration-300',
  },

  // Section Components
  section: {
    base: 'py-12 md:py-16',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },

  // Typography Components
  heading: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
    h2: 'text-3xl md:text-4xl lg:text-5xl font-bold leading-tight',
    h3: 'text-2xl md:text-3xl font-semibold leading-snug',
    h4: 'text-xl md:text-2xl font-semibold leading-snug',
    h5: 'text-lg md:text-xl font-semibold leading-normal',
    h6: 'text-base md:text-lg font-semibold leading-normal',
  },

  // Form Components
  form: {
    input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
    label: 'block text-sm font-medium text-gray-700 mb-1',
    error: 'text-red-600 text-sm mt-1',
  },
};

// Utility functions
export const createTypographyClass = (size: keyof typeof designSystem.typography.sizes, weight?: keyof typeof designSystem.typography.weights) => {
  const sizeClass = `text-[${designSystem.typography.sizes[size]}]`;
  const weightClass = weight ? `font-${weight}` : '';
  return `${sizeClass} ${weightClass}`.trim();
};

export const createSpacingClass = (direction: 'p' | 'm', size: keyof typeof designSystem.spacing) => {
  return `${direction}-${size}`;
};

export const createColorClass = (type: 'bg' | 'text' | 'border', color: string) => {
  return `${type}-${color}`;
};
