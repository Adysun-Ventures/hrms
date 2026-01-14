# Design System - Adysun Ventures Website

## 🎯 **Design Principles**

- **Consistency**: Uniform sizing, spacing, and typography across all components
- **Hierarchy**: Clear visual hierarchy through consistent font sizes and spacing
- **Accessibility**: Readable text sizes and proper contrast ratios
- **Responsiveness**: Scalable design that works across all device sizes

## 📏 **Spacing Scale**

### **Section Spacing**
- **Small Sections**: `py-16` (64px top/bottom)
- **Medium Sections**: `py-20` (80px top/bottom) - **Standard**
- **Large Sections**: `py-24` (96px top/bottom)

### **Component Spacing**
- **Card Padding**: `p-8` (32px) - **Standard for all cards**
- **Grid Gaps**: `gap-8` (32px) - **Standard for all grids**
- **Margin Between Elements**: `mb-6` (24px) - **Standard spacing**

### **Section Margins**
- **Section Headers**: `mb-20` (80px) - **Standard for section titles**
- **Content Margins**: `mt-20` (80px) - **Standard for content after titles**

## 🔤 **Typography Scale**

### **Heading Hierarchy**
```css
/* Hero/Page Title */
h1: text-5xl md:text-6xl lg:text-7xl (48px - 72px)

/* Section Titles */
h2: text-4xl md:text-5xl (36px - 48px)

/* Subsection Titles */
h3: text-3xl md:text-4xl (30px - 36px)

/* Component Titles */
h4: text-xl (20px) - **Standard for all component titles**

/* Body Text */
p: text-lg (18px) - **Standard for all descriptions**

/* Small Text */
span: text-sm (14px) - **Standard for subtitles and badges**
```

### **Font Weights**
- **Bold**: `font-bold` - For headings and important text
- **Semibold**: `font-semibold` - For subheadings and emphasis
- **Medium**: `font-medium` - For subtitles and badges
- **Normal**: Default - For body text

## 🎨 **Icon Sizing System**

### **Icon Container Sizes**
```css
/* Standard Icon Container */
.w-20.h-20 (80px × 80px) - **Standard for all icon containers**

/* Button Icons */
.w-6.h-6 (24px × 24px) - **Standard for button icons**

/* Icon Content */
[&_*]:w-8 [&_*]:h-8 (32px × 32px) - **Standard for icon content**
```

### **Icon Usage by Component**
- **BenefitCard**: 80px container, 32px icon
- **TechStackCard**: 80px container, 32px icon
- **CTAButton**: 24px icon
- **PartnerCard**: Logo images (192px × 192px)

## 🎭 **Component Design Patterns**

### **Card Components**
```css
/* Standard Card Structure */
.rounded-2xl          /* Border radius */
.p-8                  /* Padding */
.shadow-lg            /* Base shadow */
.hover:shadow-xl      /* Hover shadow */
.transition-all       /* Smooth transitions */
.duration-300         /* Transition duration */
```

### **Interactive Elements**
```css
/* Hover Effects */
.hover:scale-110      /* Icon scale on hover */
.hover:-translate-y-1 /* Card lift on hover */
.hover:-translate-y-2 /* Tech stack card lift */

/* Focus States */
.focus:ring-4         /* Focus ring */
.focus:ring-orange-300 /* Orange focus color */
```

## 🌈 **Color System**

### **Orange Theme**
```css
/* Primary Orange */
orange-400 to orange-700    /* Gradients */
orange-50 to orange-100     /* Light backgrounds */
orange-900/95 to orange-800/95 /* Dark overlays */

/* Text Colors */
text-orange-600             /* Primary text */
text-orange-700             /* Hover states */
text-orange-300             /* Light text on dark */
```

### **Neutral Colors**
```css
/* Text Hierarchy */
text-gray-900               /* Primary headings */
text-gray-700               /* Body text */
text-gray-600               /* Secondary text */
text-gray-500               /* Subtle text */

/* Backgrounds */
bg-white                     /* Card backgrounds */
bg-gray-50                  /* Light backgrounds */
```

## 📱 **Responsive Design**

### **Breakpoint System**
```css
/* Mobile First Approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### **Grid Systems**
```css
/* Standard Grid Patterns */
grid-cols-1 md:grid-cols-3    /* 1 column on mobile, 3 on medium+ */
grid-cols-2 md:grid-cols-4    /* 2 columns on mobile, 4 on medium+ */
gap-8                         /* Consistent 32px gaps */
```

## 🔧 **Component Implementation**

### **Standard Props Interface**
```typescript
interface StandardCardProps {
  icon?: React.ReactNode;      // Optional icon
  title: string;               // Required title
  description?: string;        // Optional description
  subtitle?: string;           // Optional subtitle
  className?: string;          // Optional custom classes
}
```

### **Consistent Class Patterns**
```css
/* Always use these patterns */
.transition-all.duration-300   /* Smooth transitions */
.hover:shadow-xl               /* Enhanced hover shadows */
.rounded-2xl                   /* Consistent border radius */
.p-8                          /* Standard padding */
```

## 📋 **Implementation Checklist**

### **Before Creating New Components**
- [ ] Check existing spacing patterns
- [ ] Use standard icon sizes (80px containers, 32px icons)
- [ ] Follow typography hierarchy
- [ ] Implement consistent hover effects
- [ ] Use standard color palette

### **Component Review**
- [ ] Consistent padding (`p-8`)
- [ ] Standard margins (`mb-6`, `mb-20`)
- [ ] Proper icon sizing
- [ ] Typography hierarchy
- [ ] Hover and focus states

## 🚀 **Best Practices**

1. **Always use the spacing scale** - Don't create custom spacing values
2. **Maintain typography hierarchy** - Use established heading sizes
3. **Consistent icon sizing** - 80px containers, 32px icons
4. **Standard transitions** - 300ms duration for all animations
5. **Responsive first** - Design for mobile, enhance for desktop
6. **Accessibility** - Proper contrast and readable text sizes

---

**Remember**: Consistency creates trust and professionalism. Always refer to this guide when creating or modifying components.
