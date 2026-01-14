'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DocumentGeneratorIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to document generator list when accessed directly
    router.push('/dashboard/documents');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64">
        <p>Redirecting to document generator...</p>
      </div>
    </DashboardLayout>
  );
} 