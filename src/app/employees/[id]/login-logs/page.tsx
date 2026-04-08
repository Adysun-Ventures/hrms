'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import { FiBook } from 'react-icons/fi';
import { getEmployee, getEmployeeLoginLogs } from '@/utils/firebaseUtils';
import { formatDateToDayMonYearWithTime } from '@/utils/documentUtils';
import toast, { Toaster } from 'react-hot-toast';

type PageParams = {
  params: Promise<{ id: string }>;
};

type LoginLogRow = {
  id: string;
  ipAddress?: string;
  city?: string;
  deviceType?: string;
  userAgent?: string;
  browserNameVersion?: string;
  sessionOpenedAt?: any;
  sessionClosedAt?: any;
  sessionClosedThrough?: string;
};

const toDateText = (value: any) => {
  if (!value) return '-';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return formatDateToDayMonYearWithTime(d);
};

const toSessionCloseThroughText = (row: LoginLogRow) => {
  const through = String(row.sessionClosedThrough || '').toLowerCase();
  if (through === 'logout') return 'Logout';
  if (through === 'browser_tab_close') return 'Browser/Tab Close';
  if (through === 'session_expired') return 'Session Expired';
  if (through === 'network_lost') return 'Network Lost';
  if (through === 'unknown') return 'Unknown';
  if (through) return through.replaceAll('_', ' ');
  if (!row.sessionClosedAt) return '-';
  return 'Unknown';
};

export default function EmployeeLoginLogsPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState('Loading...');
  const [rows, setRows] = useState<LoginLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [employee, logs] = await Promise.all([
          getEmployee(id),
          getEmployeeLoginLogs(id),
        ]);
        setEmployeeName(employee?.name || 'Employee');
        setRows((logs || []) as LoginLogRow[]);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load login logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        { label: employeeName, href: `/employees/${id}` },
        { label: 'Login Logs', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Login Logs"
          total={rows.length}
          showStats={true}
          showSearch={false}
          showFilter={false}
          searchValue=""
          onSearchChange={() => {}}
          actionButtons={[]}
          backButton={{ href: `/employees/${id}`, label: 'Back' }}
          customReloadButton={
            <button
              type="button"
              onClick={() => router.refresh()}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FiBook size={14} />
            </button>
          }
        />

        <div className="overflow-x-auto px-6 pb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time of Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Open</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Close</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">How Session Closed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={9}>
                    No login logs found.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{toDateText(row.sessionOpenedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.ipAddress || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.deviceType || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate" title={row.userAgent || '-'}>
                    {row.userAgent || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.browserNameVersion || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{toDateText(row.sessionOpenedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{toDateText(row.sessionClosedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{toSessionCloseThroughText(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

