
import Link from '@/lib/link';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/calculator/salary-module"
          className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Salary Calculator</h2>
          <p className="text-sm text-gray-600">
            Quick helper for salary-related calculations.
          </p>
        </Link>
      </div>
    </DashboardLayout>
  );
}
