
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/lib/navigation';
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
  const redirected = useRef(false);
  // Pages pass allowedUserTypes as an inline array (new every render); depend on its contents.
  const allowedKey = allowedUserTypes.join(',');

  useEffect(() => {
    // Only show the blocking loader on the very first auth check.
    if (loading) return;

    // Redirect once: repeating it while the target page loads restarts the navigation in a loop.
    const go = (to: string) => {
      if (redirected.current) return;
      redirected.current = true;
      router.replace(to);
    };

    if (!currentUserData) {
      go(redirectTo);
      return;
    }

    if (!allowedKey.split(',').includes(currentUserData.userType)) {
      if (currentUserData.userType === 'admin') go('/dashboard');
      else if (currentUserData.userType === 'employee') go('/employee-dashboard');
      else go(redirectTo);
      return;
    }

    // At this point user is valid and first check is done.
    setHasInitialCheckCompleted(true);
  }, [currentUserData, loading, allowedKey, redirectTo, router]);

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