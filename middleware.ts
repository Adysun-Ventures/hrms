import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/employees',
  '/employments', 
  '/salaries',
  '/enquiry',
  '/profile',
  '/documents',
  '/attendance',
  '/leaves',
  '/employee-dashboard'
];

// Public routes that don't require authentication
const publicRoutes = ['/login', '/candidate/enquiry', '/verify'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get auth tokens from cookies
  const adminSessionId = request.cookies.get('adminSessionId')?.value;
  const employeeSessionId = request.cookies.get('employeeSessionId')?.value;
  const isAuthenticated = adminSessionId || employeeSessionId;
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === '/login') {
    if (adminSessionId) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (employeeSessionId) {
      return NextResponse.redirect(new URL('/employee-dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|adysun-logo.png|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
}; 