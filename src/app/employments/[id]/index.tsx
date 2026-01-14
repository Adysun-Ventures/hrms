'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EmploymentIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to employment list when accessed directly
    router.push('/employments');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64">
        <p>Redirecting to employment list...</p>
      </div>
    </DashboardLayout>
  );
} 