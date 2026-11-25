import { Suspense, lazy } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const StatementsApp = lazy(() => import('@/statements/App.jsx'));

export default function StatementsPage() {
  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Statements', isCurrent: true },
      ]}
    >
      <Suspense
        fallback={
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <StatementsApp />
      </Suspense>
    </DashboardLayout>
  );
}
