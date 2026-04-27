'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeForm16Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/documents');
  }, [router]);

  return null;
}
