'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FaBroom } from 'react-icons/fa6';
import { FiChevronLeft } from 'react-icons/fi';
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

  const clearSalaryInputs = () => {
    setCtc(0);
    setVariablePay(0);
    setOtherAllowanceEdited(false);
    setOtherAllowance(0);
  };

  const clearMonthly = () => {
    setOtherAllowanceEdited(false);
    setOtherAllowance(Number(computedOtherAllowance.toFixed(2)));
  };

  const clearAnnually = () => {
    setOtherAllowanceEdited(false);
    setOtherAllowance(Number(computedOtherAllowance.toFixed(2)));
  };

  const clearDeduction = () => {
    setIsPfEnabled(false);
    setOtherDeduction(0);
    setPtDeduct(200);
  };

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
        { label: 'Salary Calculator', isCurrent: true },
      ]}
    >
      <div className="w-full mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="relative flex items-center justify-center mb-6">
          <Link
            href="/calculator"
            className="absolute left-0 px-3 py-2 rounded-full flex items-center gap-2 transition-colors duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            aria-label="Back"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">Salary Calculator</h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Salary Inputs</h2>
            <button
              type="button"
              onClick={clearSalaryInputs}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
            >
              <FaBroom className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTC</label>
              <input
                type="number"
                value={ctc === 0 ? '' : ctc}
                onChange={(e) => setCtc(Number(e.target.value || 0))}
                placeholder="Enter CTC"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Variable Pay</label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setVariablePay(60000)}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    60 K
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariablePay(80000)}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    80 K
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariablePay(100000)}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    1 L
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={variablePay === 0 ? '' : variablePay}
                onChange={(e) => setVariablePay(Number(e.target.value || 0))}
                placeholder="Enter Variable"
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

        <div className="border-t border-gray-200 mb-6" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">Monthly</h2>
                <span className="text-sm text-gray-600">
                  Monthly Fixed: ₹{formatINR(monthlyFixed)}
                </span>
              </div>
              <button
                type="button"
                onClick={clearMonthly}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
              >
                <FaBroom className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="p-2 bg-blue-50 rounded-md md:col-span-2">
                <p className="text-sm text-gray-700 font-semibold">Gross Salary (Monthly)(A)</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{formatINR(grossSalary)}</p>
              </div>
            </div>
          </div>
          

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">Annually</h2>
                <span className="text-sm text-gray-600">
                  Fixed (Annual): ₹{formatINR(fixedPay)}
                </span>
              </div>
              <button
                type="button"
                onClick={clearAnnually}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
              >
                <FaBroom className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="p-2 bg-blue-50 rounded-md md:col-span-2">
                <p className="text-sm text-gray-700 font-semibold">Gross Salary (Annual)(A)</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{formatINR(annualGrossSalary)}</p>
              </div>
            </div>
          </div>

          {/* Vertical divider between Monthly and Annually (no layout shift) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" aria-hidden />
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Deduction</h2>
          <button
            type="button"
            onClick={clearDeduction}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
          >
            <FaBroom className="w-4 h-4" />
            Clear
          </button>
        </div>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Monthly</h3>
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-700">PF (DEDUCT)</label>
                <button
                  type="button"
                  onClick={() => setIsPfEnabled((v) => !v)}
                  className="text-xs text-blue-600 underline whitespace-nowrap"
                >
                  Is PF: {isPfEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <input
                type="text"
                value={Number(pfDeduct || 0).toFixed(2)}
                readOnly
                disabled
                placeholder="Auto from salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PT (DEDUCT) <span className="text-sm text-red-500">(IN FEB: 300)</span></label>
              <input
                type="number"
                value={ptDeduct}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Deduct Amt</label>
              <input
                type="text"
                value={Number(calculations.leavesDeductAmt || 0).toFixed(2)}
                readOnly
                disabled
                placeholder="Auto from salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div> */}
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
            <div className="p-2 bg-red-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Total Deduction (Monthly) (B)</p>
              <p className="text-xl font-bold text-red-700 mt-1">₹{formatINR(totalDeduction)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Net Salary (Monthly) (C=A-B)</p>
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
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Deduct Annual</label>
              <input
                type="text"
                value={annualLeavesDeductAmt.toFixed(2)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div> */}
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
            <div className="p-2 bg-red-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Total Deduction (Annual)(B)</p>
              <p className="text-xl font-bold text-red-700 mt-1">₹{formatINR(annualTotalDeduction)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-md">
              <p className="text-sm text-gray-700 font-semibold">Net Salary (Annual)(C=A-B)</p>
              <p className="text-xl font-bold text-green-700 mt-1">₹{formatINR(annualNetSalary)}</p>
            </div>
          </div>

          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" aria-hidden />
        </div>
      </div>
    </DashboardLayout>
  );
}
