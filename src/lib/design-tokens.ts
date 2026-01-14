// Design Token System for Adysun Ventures
// Ensures consistency across all components

export const designTokens = {
  // Typography Scale
  typography: {
    h1: "text-5xl md:text-6xl lg:text-7xl font-bold leading-tight",
    h2: "text-4xl md:text-5xl font-bold",
    h3: "text-3xl md:text-4xl font-bold",
    h4: "text-2xl font-bold",
    h5: "text-xl font-bold",
    h6: "text-lg font-bold",
    body: {
      large: "text-xl leading-relaxed",
      medium: "text-lg leading-relaxed",
      small: "text-base leading-relaxed",
      caption: "text-sm leading-relaxed"
    }
  },

  // Color Palette
  colors: {
    primary: {
      50: "bg-orange-50 text-orange-900",
      100: "bg-orange-100 text-orange-900",
      500: "bg-orange-500 text-white",
      600: "bg-orange-600 text-white",
      700: "bg-orange-700 text-white",
      800: "bg-orange-800 text-white",
      900: "bg-orange-900 text-white"
    },
    secondary: {
      gray: {
        50: "bg-gray-50 text-gray-900",
        100: "bg-gray-100 text-gray-900",
        200: "bg-gray-200 text-gray-900",
        600: "bg-gray-600 text-white",
        700: "bg-gray-700 text-white",
        800: "bg-gray-800 text-white",
        900: "bg-gray-900 text-white"
      }
    },
    text: {
      primary: "text-gray-900",
      secondary: "text-gray-700",
      tertiary: "text-gray-600",
      white: "text-white",
      orange: "text-orange-600"
    },
    gradients: {
      primary: "bg-gradient-to-br from-orange-50 to-orange-100",
      secondary: "bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200",
      dark: "bg-gradient-to-r from-orange-900/95 to-orange-800/95"
    }
  },

  // Spacing System
  spacing: {
    section: {
      small: "py-12 md:py-16",
      medium: "py-16 md:py-20",
      large: "py-20 md:py-24"
    },
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    gap: {
      small: "gap-4",
      medium: "gap-6",
      large: "gap-8"
    }
  },

  // Border Radius
  borderRadius: {
    small: "rounded-lg",
    medium: "rounded-xl",
    large: "rounded-2xl",
    full: "rounded-full"
  },

  // Shadows
  shadows: {
    small: "shadow-md",
    medium: "shadow-lg",
    large: "shadow-xl",
    xl: "shadow-2xl"
  },

  // Transitions
  transitions: {
    fast: "transition-all duration-200",
    normal: "transition-all duration-300",
    slow: "transition-all duration-500"
  }
};

// Component-specific design tokens
export const componentTokens = {
  // Card Components
  card: {
    base: `${designTokens.colors.secondary.gray[50]} ${designTokens.borderRadius.medium} ${designTokens.shadows.medium} p-6`,
    hover: `${designTokens.shadows.large} ${designTokens.transitions.normal}`,
    interactive: "hover:scale-105 cursor-pointer"
  },

  // Button Components
  button: {
    base: "inline-flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300",
    primary: `${designTokens.colors.primary[600]} hover:${designTokens.colors.primary[700]} ${designTokens.shadows.small} hover:${designTokens.shadows.medium}`,
    secondary: "bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white",
    outline: "bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white"
  },

  // Section Components
  section: {
    base: `${designTokens.spacing.section.medium} ${designTokens.spacing.container}`,
    white: `${designTokens.spacing.section.medium} bg-white ${designTokens.spacing.container}`,
    gradient: `${designTokens.spacing.section.medium} ${designTokens.colors.gradients.primary} ${designTokens.spacing.container}`
  }
};

// Utility function to combine tokens
export const combineTokens = (...tokens: string[]) => tokens.join(' ');
