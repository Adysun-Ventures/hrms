'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  calculateMonthlySalary,
  getProfessionalTaxByMonth,
  type MonthlySalaryResult,
} from '@/utils/monthlySalaryCalculationUtils';

export default function SalaryModulePage() {
  const [ctc, setCtc] = useState<number>(0);
  const [variablePay, setVariablePay] = useState<number>(0);
  const [isPfEnabled, setIsPfEnabled] = useState<boolean>(true);
  const [otherAllowance, setOtherAllowance] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [ptDeduct, setPtDeduct] = useState<number>(() =>
    getProfessionalTaxByMonth(new Date().getMonth() + 1)
  );

  const fixedPay = useMemo(() => Math.max(0, Number(ctc || 0) - Number(variablePay || 0)), [ctc, variablePay]);

  const calculations: MonthlySalaryResult = useMemo(() => {
    const d = new Date();
    return calculateMonthlySalary({
      ctc: Number(ctc) || 0,
      fixedPay: Number(fixedPay) || 0,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      leavesCount: 0,
    });
  }, [ctc, fixedPay]);

  const pfDeduct = isPfEnabled ? calculations.pfDeduct || 0 : 0;
  const grossSalary = calculations.basic + calculations.hra + calculations.conveyanceAllowance + (Number(otherAllowance) || 0);
  const totalDeduction = pfDeduct + (Number(ptDeduct) || 0) + calculations.leavesDeductAmt + (Number(otherDeduction) || 0);
  const netSalary = grossSalary - totalDeduction;

  const formatINR = (num: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Calculator', href: '/calculator' },
        { label: 'Salary Module', isCurrent: true },
      ]}
    >
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Salary Calculation Module</h1>
          <Link href="/calculator" className="text-sm text-blue-600 hover:text-blue-800 underline">
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CTC</label>
            <input type="number" value={ctc} onChange={(e) => setCtc(Number(e.target.value || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variable Pay</label>
            <input type="number" value={variablePay} onChange={(e) => setVariablePay(Number(e.target.value || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Pay</label>
            <input type="number" value={Number(fixedPay.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fixed</label>
            <input type="number" value={Number((fixedPay / 12).toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Basic</label>
            <input type="number" value={Number(calculations.basic.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HRA</label>
            <input type="number" value={Number(calculations.hra.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conveyance Allowance</label>
            <input type="number" value={Number(calculations.conveyanceAllowance.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Allowance</label>
            <input type="number" value={otherAllowance} onChange={(e) => setOtherAllowance(Number(e.target.value || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PF (DEDUCT)</label>
            <input type="number" value={Number(pfDeduct.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
            <button type="button" onClick={() => setIsPfEnabled((v) => !v)} className="mt-2 text-xs text-blue-600 underline">
              Is PF: {isPfEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PT (DEDUCT)</label>
            <input type="number" value={ptDeduct} onChange={(e) => setPtDeduct(Number(e.target.value || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Deduct Amt</label>
            <input type="number" value={Number(calculations.leavesDeductAmt.toFixed(2))} readOnly disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Deduction</label>
            <input type="number" value={otherDeduction} onChange={(e) => setOtherDeduction(Number(e.target.value || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700 font-semibold">Gross Salary (A)</p>
            <p className="text-xl font-bold text-blue-700 mt-1">₹{formatINR(grossSalary)}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-sm text-gray-700 font-semibold">Total Deduction (B)</p>
            <p className="text-xl font-bold text-red-700 mt-1">₹{formatINR(totalDeduction)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-700 font-semibold">Net Salary (InHand)</p>
            <p className="text-xl font-bold text-green-700 mt-1">₹{formatINR(netSalary)}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
