'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeSelfEmployment, updateEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { Employment } from '@/types';

export default function EmployeeEmploymentEditPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employmentData, setEmploymentData] = useState<Employment[]>([]);

  const currentEmployment = useMemo(
    () => employmentData.find((emp) => !emp.endDate) || employmentData[0],
    [employmentData]
  );

  const [form, setForm] = useState({
    bankName: '',
    accountNo: '',
    ifscCode: '',
    accountHolderName: '',
    panNumber: '',
    reportingManager: '',
    location: '',
    workSchedule: '',
    probationPeriod: '',
    noticePeriod: '',
  });

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

  useEffect(() => {
    if (!currentEmployment) return;
    setForm({
      bankName: currentEmployment.bankName || '',
      accountNo: currentEmployment.accountNo || '',
      ifscCode: currentEmployment.ifscCode || '',
      accountHolderName: currentEmployment.accountHolderName || '',
      panNumber: currentEmployment.panNumber || '',
      reportingManager: currentEmployment.reportingManager || '',
      location: currentEmployment.location || '',
      workSchedule: currentEmployment.workSchedule || '',
      probationPeriod: currentEmployment.probationPeriod || '',
      noticePeriod: currentEmployment.noticePeriod || '',
    });
  }, [currentEmployment]);

  if (!currentUserData || currentUserData.userType !== 'employee') return null;

  const onSave = async () => {
    try {
      if (!currentEmployment?.id) {
        toast.error('Employment record not found');
        return;
      }
      setSaving(true);
      await updateEmployeeSelfEmployment(currentUserData.id, currentEmployment.id, {
        ...form,
        ifscCode: form.ifscCode?.toUpperCase().trim(),
        panNumber: form.panNumber?.toUpperCase().trim(),
      });
      toast.success('Employment updated');
      router.push('/employee/employment');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to update employment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'My Employment', href: '/employee/employment' },
        { label: 'Edit Employment', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Edit Employment</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/employee/employment')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading || !currentEmployment}
              onClick={onSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : !currentEmployment ? (
          <p className="text-gray-500">No employment record found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reporting Manager</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.reportingManager}
                onChange={(e) => setForm((p) => ({ ...p, reportingManager: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work Schedule</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.workSchedule}
                onChange={(e) => setForm((p) => ({ ...p, workSchedule: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Probation Period</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.probationPeriod}
                onChange={(e) => setForm((p) => ({ ...p, probationPeriod: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notice Period</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.noticePeriod}
                onChange={(e) => setForm((p) => ({ ...p, noticePeriod: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mt-2">Bank Details</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.bankName}
                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Holder Name</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.accountHolderName}
                onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account No.</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.accountNo}
                onChange={(e) => setForm((p) => ({ ...p, accountNo: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IFSC Code</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.ifscCode}
                onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PAN Number</label>
              <input
                className="w-full p-2 border rounded-md"
                value={form.panNumber}
                onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

