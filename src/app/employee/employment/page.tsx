'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { Employment } from '@/types';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { toTitleCase } from '@/utils/stringUtils';

export default function EmployeeEmploymentPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employmentData, setEmploymentData] = useState<Employment[]>([]);

  const currentEmployment = useMemo(
    () => employmentData.find((emp) => !emp.endDate) || employmentData[0],
    [employmentData]
  );

  useEffect(() => {
    const run = async () => {
      try {
        if (!currentUserData?.id || currentUserData.userType !== 'employee') return;
        setLoading(true);
        const employments = await getEmployeeSelfEmployment(currentUserData.id);
        setEmploymentData(employments);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load employment information');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentUserData?.id, currentUserData?.userType]);

  // Redirect to the admin-style employment view (self only)
  useEffect(() => {
    if (!loading && currentEmployment?.id) {
      router.push(`/employments/${currentEmployment.id}`);
    }
  }, [loading, currentEmployment?.id, router]);

  if (!currentUserData || currentUserData.userType !== 'employee') return null;

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'My Employment', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500">Loading employment information...</p>
        </div>
      ) : !currentEmployment?.id ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500">No employment record found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500">Redirecting to employment details...</p>
        </div>
      )}
    </EmployeeLayout>
  );
}

