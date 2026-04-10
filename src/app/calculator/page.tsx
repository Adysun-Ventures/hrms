'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CalculatorPage() {
  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Calculator', isCurrent: true },
      ]}
    >
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Calculator</h1>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 underline">
            Back
          </Link>
        </div>
        <Link
          href="/calculator/salary-module"
          className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Salary Calculation</h2>
          <p className="text-sm text-gray-600">
            Quick helper for salary-related calculations.
          </p>
        </Link>
      </div>
    </DashboardLayout>
  );
}
