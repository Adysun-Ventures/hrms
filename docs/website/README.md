# Adysun Ventures Website - Next.js Port

This directory contains the ported website from the original React application to Next.js, maintaining the same UI and content structure.

## 📁 File Structure

```
src/app/website/
├── page.tsx                           # Home page
├── about-us/
│   └── page.tsx                      # About Us page
├── partners/
│   └── page.tsx                      # Partners page
├── contact-us/
│   └── page.tsx                      # Contact Us page
├── services/
│   └── page.tsx                      # Services page
├── technologies/
│   └── page.tsx                      # Technologies page
├── careers/
│   └── page.tsx                      # Careers page
├── clients/
│   └── page.tsx                      # Clients page
├── industries/
│   ├── page.tsx                      # Industries overview
│   ├── stock-exchange/
│   │   └── page.tsx                  # Stock Exchange solutions
│   ├── ecommerce/
│   │   └── page.tsx                  # E-commerce solutions
│   └── transportation/
│       └── page.tsx                  # Transportation solutions
├── gallery/
│   └── page.tsx                      # Gallery page
└── not-found.tsx                     # 404 page
```

## 🎯 Current Status

- ✅ **Structure Created**: All routes and folders have been created
- ✅ **Sample Pages**: Basic pages with minimum content are generated
- ✅ **Layout Component**: Shared WebsiteLayout component created
- ✅ **Navigation**: Working navigation between all pages
- ✅ **Responsive Design**: Mobile-friendly layout with Tailwind CSS

## 🚀 Next Steps

### Phase 1: Content Migration
1. **Copy Content**: Use the screenshots in this directory as reference
2. **Update Pages**: Replace sample content with actual website content
3. **Images & Assets**: Migrate images, icons, and other assets
4. **Styling**: Match exact colors, fonts, and spacing from original

### Phase 2: Enhanced Features
1. **SEO Optimization**: Add meta tags, Open Graph, and structured data
2. **Performance**: Implement image optimization and lazy loading
3. **Analytics**: Add Google Analytics and tracking
4. **Forms**: Implement contact forms with validation

### Phase 3: Advanced Features
1. **CMS Integration**: Add content management capabilities
2. **Blog System**: Implement blog/news section
3. **Search Functionality**: Add site-wide search
4. **Multi-language**: Support for multiple languages

## 🔧 Technical Details

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Components**: React functional components with TypeScript
- **Layout**: Shared layout component for consistent navigation
- **Routing**: File-based routing with Next.js App Router

## 📱 Available Routes

- `/website` - Home page
- `/website/about-us` - About Us
- `/website/partners` - Technology Partnerships
- `/website/contact-us` - Contact Information
- `/website/services` - IT Services
- `/website/technologies` - Technology Stack
- `/website/careers` - Career Opportunities
- `/website/clients` - Client Success Stories
- `/website/industries` - Industry Solutions
- `/website/industries/stock-exchange` - Financial Services
- `/website/industries/ecommerce` - E-commerce Solutions
- `/website/industries/transportation` - Transportation & Logistics
- `/website/gallery` - Company Gallery

## 🎨 Design System

- **Primary Color**: Blue (#2563eb)
- **Secondary Colors**: Gray scale for text and backgrounds
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Components**: Reusable UI components with consistent styling

## 📝 Notes

- All pages currently show sample content with "Coming Soon" notices
- The layout matches the original website structure
- Navigation is fully functional between all pages
- Responsive design works on all screen sizes
- Ready for content migration from the React website
