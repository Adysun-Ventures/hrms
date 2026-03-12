'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedUserTypes?: ('admin' | 'employee')[];
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  allowedUserTypes = ['admin', 'employee'],
  redirectTo = '/login'
}: AuthGuardProps) {
  const { currentUserData, loading } = useAuth();
  const router = useRouter();
  const [hasInitialCheckCompleted, setHasInitialCheckCompleted] = useState(false);

  useEffect(() => {
    // Only show the blocking loader on the very first auth check.
    if (loading) return;

    if (!currentUserData) {
      router.push(redirectTo);
      return;
    }

    const isAllowedUserType = allowedUserTypes.includes(currentUserData.userType);

    if (!isAllowedUserType) {
      if (currentUserData.userType === 'admin') {
        router.push('/dashboard');
      } else if (currentUserData.userType === 'employee') {
        router.push('/employee-dashboard');
      } else {
        router.push(redirectTo);
      }
      return;
    }

    // At this point user is valid and first check is done.
    if (!hasInitialCheckCompleted) {
      setHasInitialCheckCompleted(true);
    }
  }, [currentUserData, loading, allowedUserTypes, redirectTo, router, hasInitialCheckCompleted]);

  // Block the UI only during the very first auth check to avoid page blink on every route change.
  if (!hasInitialCheckCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!currentUserData || !allowedUserTypes.includes(currentUserData.userType)) {
    return null;
  }

  return <>{children}</>;
} 