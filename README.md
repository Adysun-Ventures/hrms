# Admin Dashboard for Employee Management

## Deployment to Netlify

This project is configured for easy deployment to Netlify, which provides full support for Next.js applications with dynamic routes and server-side features.

### Prerequisites

- A [Netlify](https://www.netlify.com/) account
- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Deployment Steps

#### Option 1: Using the Netlify UI

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Log in to Netlify and click "New site from Git"
3. Select your repository and configure as follows:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Click "Deploy site"

#### Option 2: Using the Netlify CLI

1. Install Netlify CLI globally (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to Netlify:
   ```bash
   # For a draft preview URL
   npm run netlify-deploy
   
   # For production deployment
   npm run netlify-deploy -- --prod
   ```

### Environment Variables

Set the following environment variables in your Netlify site dashboard (Site settings → Environment variables):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
# Create optimized production build
npm run build

# Start production server locally
npm start
```

## Features

- Employee management
- Employment history tracking
- Document generation
- Dashboard analytics
- User authentication and authorization
- Responsive design for all devices
- **PAN Card validation and uniqueness checking**
- **Real-time form validation**
- **Cross-collection data integrity**

## Technologies Used

- Next.js 15
- React 19
- Firebase (Auth, Firestore, Storage)
- TypeScript
- Tailwind CSS
- React Hook Form

## Recent Updates

### PAN Card Validation System
- **Format Validation**: Ensures PAN follows the correct pattern (ABCDE1234F)
- **Uniqueness Checking**: Prevents duplicate PANs across enquiries and employees
- **Real-time Feedback**: Shows validation errors as users type
- **Cross-collection Integrity**: Maintains data consistency across the entire system

For detailed implementation guide, see [PAN Validation Documentation](docs/pan-validation-guide.md).

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Document Generator Integration

This admin dashboard integrates with the Employee Document Generator application to provide document generation capabilities. Here's how to set it up:

### Running Both Applications Together (Development)

1. **Start the Document Generator on port 3001**:
   ```bash
   cd ../employee_document_generator/employee_document_generator
   # Install dependencies if you haven't already
   npm install
   # Start on port 3001
   PORT=3001 npm start
   ```

2. **Start the Admin Dashboard**:
   ```bash
   # In the admin-dashboard directory
   npm run dev
   ```

3. **Access the Integrated Application**:
   - Open your browser to `http://localhost:3000`
   - Navigate to Documents > Offer Letters > Create Offer Letter
   - The document generator will be embedded within the admin dashboard page

### Production Deployment

For production deployment, you have two options:

1. **Proxy Configuration (Recommended)**:
   - Deploy the Document Generator app to its own subdomain (e.g., `document-generator.yourdomain.com`)
   - Update the destination URL in `next.config.js` to point to your deployed Document Generator
   - Deploy the Admin Dashboard

2. **Single Server Setup**:
   - Serve both applications from the same server
   - Configure your web server (Nginx, Apache, etc.) to route requests appropriately

### Troubleshooting

If the iframe is not loading properly, ensure:

1. The Document Generator is running and accessible
2. There are no Cross-Origin Resource Sharing (CORS) issues
3. The proxy rewrites are correctly configured in `next.config.js`

For additional help, please refer to the documentation of both applications.
