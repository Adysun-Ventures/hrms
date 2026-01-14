'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalarySlipPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/documents/salary-slip');
  }, [router]);

  return null;
}
