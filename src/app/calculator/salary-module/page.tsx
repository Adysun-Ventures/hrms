'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  calculateMonthlySalary,
  type MonthlySalaryResult,
} from '@/utils/monthlySalaryCalculationUtils';

export default function SalaryModulePage() {
  const [ctc, setCtc] = useState<number>(0);
  const [variablePay, setVariablePay] = useState<number>(0);
  const [isPfEnabled, setIsPfEnabled] = useState<boolean>(false);
  const [otherAllowance, setOtherAllowance] = useState<number>(0);
  const [otherAllowanceEdited, setOtherAllowanceEdited] = useState<boolean>(false);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [ptDeduct, setPtDeduct] = useState<number>(200);

  const fixedPay = useMemo(() => Math.max(0, Number(ctc || 0) - Number(variablePay || 0)), [ctc, variablePay]);
  const monthlyFixed = useMemo(() => fixedPay / 12, [fixedPay]);
  const basic = useMemo(() => monthlyFixed * 0.5, [monthlyFixed]);
  const hra = useMemo(() => basic * 0.4, [basic]);
  const conveyanceAllowance = 2000;
  const computedOtherAllowance = useMemo(
    () => monthlyFixed - (basic + hra + conveyanceAllowance),
    [monthlyFixed, basic, hra]
  );

  useEffect(() => {
    if (otherAllowanceEdited) return;
    setOtherAllowance(Number(computedOtherAllowance.toFixed(2)));
  }, [computedOtherAllowance, otherAllowanceEdited]);

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
  const grossSalary = basic + hra + conveyanceAllowance + (Number(otherAllowance) || 0);
  const totalDeduction = pfDeduct + (Number(ptDeduct) || 0) + calculations.leavesDeductAmt + (Number(otherDeduction) || 0);
  const netSalary = grossSalary - totalDeduction;
  const annualGrossSalary = grossSalary * 12;
  const annualPfDeduct = pfDeduct * 12;
  const annualPtDeduct = 2500;
  const annualLeavesDeductAmt = (Number(calculations.leavesDeductAmt) || 0) * 12;
  const annualOtherDeduction = (Number(otherDeduction) || 0) * 12;
  const annualTotalDeduction =
    annualPfDeduct + annualPtDeduct + annualLeavesDeductAmt + annualOtherDeduction;
  const annualNetSalary = netSalary * 12;

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

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Salary Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTC</label>
              <input
                type="number"
                value={ctc}
                onChange={(e) => setCtc(Number(e.target.value || 0))}
                placeholder="Enter CTC"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variable Pay</label>
              <input
                type="number"
                value={variablePay}
                onChange={(e) => setVariablePay(Number(e.target.value || 0))}
                placeholder="Enter Variable Pay"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Pay</label>
              <input
                type="text"
                value={fixedPay.toFixed(2)}
                readOnly
                disabled
                placeholder="Auto: CTC - Variable"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Monthly</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fixed</label>
                <input
                  type="text"
                  value={monthlyFixed.toFixed(2)}
                  readOnly
                  disabled
                  placeholder="Auto: Fixed / 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Basic</label>
                <input
                  type="text"
                  value={basic.toFixed(2)}
                  readOnly
                  disabled
                  placeholder="Auto: Monthly Fixed * 0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HRA</label>
                <input
                  type="text"
                  value={hra.toFixed(2)}
                  readOnly
                  disabled
                  placeholder="Auto: Basic * 0.4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conveyance</label>
                <input
                  type="text"
                  value={conveyanceAllowance.toFixed(2)}
                  readOnly
                  disabled
                  placeholder="Fixed: 2000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other</label>
                <input
                  type="number"
                  step="0.01"
                  value={otherAllowance}
                  onChange={(e) => {
                    setOtherAllowanceEdited(true);
                    setOtherAllowance(Number(e.target.value || 0));
                  }}
                  placeholder="Auto: Monthly Fixed - (Basic + HRA + Conveyance)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700 font-semibold">Gross Salary (Monthly)</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{formatINR(grossSalary)}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Annually</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fixed (Annual)</label>
                <input
                  type="text"
                  value={fixedPay.toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Basic (Annual)</label>
                <input
                  type="text"
                  value={(basic * 12).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HRA (Annual)</label>
                <input
                  type="text"
                  value={(hra * 12).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conveyance (Annual)</label>
                <input
                  type="text"
                  value={(conveyanceAllowance * 12).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other (Annual)</label>
                <input
                  type="text"
                  value={(Number(otherAllowance || 0) * 12).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700 font-semibold">Gross Salary (Annual)</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{formatINR(annualGrossSalary)}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-3">Deduction</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Monthly</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PF (DEDUCT)</label>
              <input
                type="text"
                value={Number(pfDeduct || 0).toFixed(2)}
                readOnly
                disabled
                placeholder="Auto from salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <button type="button" onClick={() => setIsPfEnabled((v) => !v)} className="mt-2 text-xs text-blue-600 underline">
                Is PF: {isPfEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PT (DEDUCT)</label>
              <input
                type="number"
                value={ptDeduct}
                onChange={(e) => setPtDeduct(Number(e.target.value || 0))}
                placeholder="Enter PT Deduction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Deduct Amt</label>
              <input
                type="text"
                value={Number(calculations.leavesDeductAmt || 0).toFixed(2)}
                readOnly
                disabled
                placeholder="Auto from salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Deduction</label>
              <input
                type="number"
                value={otherDeduction}
                onChange={(e) => setOtherDeduction(Number(e.target.value || 0))}
                placeholder="Enter Other Deduction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Total Deduction (Monthly)</p>
              <p className="text-xl font-bold text-red-700 mt-1">₹{formatINR(totalDeduction)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Net Salary (Monthly)</p>
              <p className="text-xl font-bold text-green-700 mt-1">₹{formatINR(netSalary)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Annually</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PF (DEDUCT) Annual</label>
              <input
                type="text"
                value={annualPfDeduct.toFixed(2)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PT (DEDUCT) Annual</label>
              <input
                type="text"
                value={annualPtDeduct.toFixed(2)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Deduct Annual</label>
              <input
                type="text"
                value={annualLeavesDeductAmt.toFixed(2)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Deduction Annual</label>
              <input
                type="text"
                value={annualOtherDeduction.toFixed(2)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Total Deduction (Annual)</p>
              <p className="text-xl font-bold text-red-700 mt-1">₹{formatINR(annualTotalDeduction)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Net Salary (Annual)</p>
              <p className="text-xl font-bold text-green-700 mt-1">₹{formatINR(annualNetSalary)}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
