import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Same protected list the old Next middleware used, now checked on every route change.
// (Signed-in users opening /login are sent on by the login page itself.)
const PROTECTED = [
  '/dashboard',
  '/employees',
  '/employments',
  '/salaries',
  '/profile',
  '/employee-dashboard',
  '/employee/',
  '/calculator',
];

export const isProtected = (pathname: string) => PROTECTED.some((r) => pathname.startsWith(r));


export default function SessionGate() {
  const { pathname } = useLocation();
  const { currentAdmin, currentEmployee } = useAuth();

  if (!currentAdmin && !currentEmployee && isProtected(pathname)) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />;
  }
  return <Outlet />;
}
