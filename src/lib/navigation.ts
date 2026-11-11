import { useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams as useRouterSearchParams } from 'react-router-dom';

// Same hook names the pages used under Next (useRouter/usePathname/useSearchParams/useParams),
// backed by React Router.
export { useParams };

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (to: string) => navigate(to),
      replace: (to: string) => navigate(to, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      // Pages call this from "Reload" buttons; a client-only app reloads to re-fetch.
      refresh: () => window.location.reload(),
      prefetch: () => {},
    }),
    [navigate]
  );
}

/** '/employees/' -> '/employees' (old URLs had a trailing slash); '/' stays '/'. */
export const trimTrailingSlash = (pathname: string) => pathname.replace(/(.)\/+$/, '$1');

/** Pathname without a trailing slash, like Next's usePathname. */
export function usePathname() {
  return trimTrailingSlash(useLocation().pathname);
}

export function useSearchParams() {
  return useRouterSearchParams()[0];
}
