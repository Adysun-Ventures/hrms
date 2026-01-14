'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EmployeeIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to employee list when accessed directly
    router.push('/employees');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64">
        <p>Redirecting to employee list...</p>
      </div>
    </DashboardLayout>
  );
} 