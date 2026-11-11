import './app/globals.css';
import { createRoot } from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';
import SessionGate from '@/components/auth/SessionGate';
import RouteError from '@/app/error';
import { dirOf, toRoutePath } from '@/lib/routes';

// File-based routes, same folders as before: src/app/employees/[id]/page.tsx -> /employees/:id.
// Each page is its own lazily loaded chunk.
const pages = import.meta.glob<{ default: ComponentType }>('./app/**/page.{tsx,jsx}');
const layouts = import.meta.glob<{ default: ComponentType<{ children: ReactNode }> }>('./app/**/layout.tsx', {
  eager: true,
});

const routes = Object.entries(pages).map(([file, load]) => {
  const dir = dirOf(file);
  const wrappers = Object.entries(layouts)
    .filter(([l]) => `${dir}/`.startsWith(`${dirOf(l)}/`))
    .sort(([a], [b]) => a.length - b.length)
    .map(([, m]) => m.default)
    .reverse();
  return {
    path: toRoutePath(dir),
    lazy: async () => {
      const Page = (await load()).default;
      return {
        Component: () => wrappers.reduce<ReactNode>((child, Layout) => <Layout>{child}</Layout>, <Page />),
      };
    },
  };
});

const router = createBrowserRouter([
  {
    element: (
      <QueryProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </QueryProvider>
    ),
    errorElement: <RouteError />,
    // Shown while the first page's code chunk downloads (instead of a blank screen).
    hydrateFallbackElement: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    ),
    children: [{ element: <SessionGate />, children: [...routes, { path: '*', element: <Navigate to="/" replace /> }] }],
  },
]);

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
