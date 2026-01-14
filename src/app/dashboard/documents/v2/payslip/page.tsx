'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalarySlipV2PageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/documents/v2/salary-slip');
  }, [router]);

  return null;
}
