/**
 * Monthly Salary Calculation Utilities
 * 
 * Pure calculation functions for monthly salary breakdown based on TOON model.
 * These functions are reusable and have no React dependencies.
 */

/**
 * Input interface for monthly salary calculations
 */
export interface MonthlySalaryInputs {
  ctc: number;
  fixedPay: number;
  year: number;
  month: number; // 1-12 (January = 1, December = 12)
  leavesCount: number;
}

/**
 * Result interface containing all calculated salary components
 */
export interface MonthlySalaryResult {
  // Derived values
  variablePay: number;
  monthDays: number;
  perMonth: number;
  perDay: number;
  workDays: number;
  
  // Salary components (for display/breakdown)
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  
  // Earnings
  grossSalary: number;
  
  // Deductions
  ptDeduct: number;
  leavesDeductAmt: number;
  totalDeduction: number;
  
  // Final
  netSalary: number;
}

/**
 * Calculates the number of days in a given month and year
 * @param year - The year
 * @param month - The month (1-12, where 1 = January, 12 = December)
 * @returns Number of days in the month
 */
export function daysInMonth(year: number, month: number): number {
  // month is 1-12, but Date constructor expects 0-11, so we use month (1-12) directly
  // new Date(year, month, 0) gives the last day of the previous month
  // So new Date(year, month, 0) where month is 1-12 gives us the last day of that month
  return new Date(year, month, 0).getDate();
}

/**
 * Validates input values for salary calculation
 * @param inputs - Input values to validate
 * @returns true if valid, throws error if invalid
 */
export function validateSalaryInputs(inputs: MonthlySalaryInputs): void {
  if (inputs.ctc < 0) {
    throw new Error('CTC cannot be negative');
  }
  if (inputs.fixedPay < 0) {
    throw new Error('Fixed Pay cannot be negative');
  }
  if (inputs.leavesCount < 0) {
    throw new Error('Leave Count cannot be negative');
  }
  if (inputs.fixedPay > inputs.ctc) {
    throw new Error('Fixed Pay cannot be greater than CTC');
  }
  if (inputs.month < 1 || inputs.month > 12) {
    throw new Error('Month must be between 1 and 12');
  }
  if (inputs.year < 1900 || inputs.year > 2100) {
    throw new Error('Year must be a valid year');
  }
}

/**
 * Rounds a number to 2 decimal places (for currency)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Main function to calculate monthly salary breakdown
 * 
 * Formula implementation based on TOON model:
 * - Variable Pay = CTC - Fixed Pay
 * - Month Days = days_in_month(year, month) - actual calendar days
 * - Per Month = Fixed Pay / 12
 * - Per Day = Per Month / 30 (uses fixed 30-day logic)
 * - Work Days = Month Days - Leave Count
 * - Gross Salary = Per Month (directly, no breakdown)
 * - PT (DEDUCT) = 200 (fixed)
 * - Leaves Deduct Amt = Leave Count × Per Day
 * - Total Deduction = PT (DEDUCT) + Leaves Deduct Amt
 * - Net Salary = Gross Salary - Total Deduction
 * 
 * @param inputs - Input values (CTC, Fixed Pay, Year, Month, Leave Count)
 * @returns Calculated salary breakdown
 */
export function calculateMonthlySalary(inputs: MonthlySalaryInputs): MonthlySalaryResult {
  // Validate inputs
  validateSalaryInputs(inputs);

  // Handle zero or missing values
  const ctc = inputs.ctc || 0;
  const fixedPay = inputs.fixedPay || 0;
  const year = inputs.year || new Date().getFullYear();
  const month = inputs.month || new Date().getMonth() + 1;
  const leavesCount = inputs.leavesCount || 0;

  // Calculate calendar days in month
  const monthDays = daysInMonth(year, month);

  // Calculate derived values
  const variablePay = roundToTwoDecimals(ctc - fixedPay);
  const perMonth = roundToTwoDecimals(fixedPay / 12);
  const perDay = roundToTwoDecimals(perMonth / 30); // Fixed 30-day logic
  const workDays = Math.max(0, monthDays - leavesCount); // Actual month days - leave count

  // Calculate salary components (for display/breakdown)
  // Based on Excel formulas:
  // Basic = 0.4 × Per Month
  // HRA = 0.4 × Basic
  // Conveyance Allowance = 0.05 × Per Month
  // Other Allowance = Per Month - (Basic + HRA + Conveyance Allowance)
  const basic = roundToTwoDecimals(0.4 * perMonth);
  const hra = roundToTwoDecimals(0.4 * basic);
  const conveyanceAllowance = roundToTwoDecimals(0.05 * perMonth);
  const otherAllowance = roundToTwoDecimals(
    perMonth - (basic + hra + conveyanceAllowance)
  );

  // Gross Salary = Per Month (directly, no breakdown)
  // Note: Gross Salary = Basic + HRA + Conveyance Allowance + Other Allowance (should equal Per Month)
  const grossSalary = perMonth;

  // Deductions
  const ptDeduct = 200; // Fixed value
  const leavesDeductAmt = roundToTwoDecimals(leavesCount * perDay);
  const totalDeduction = roundToTwoDecimals(ptDeduct + leavesDeductAmt);

  // Calculate Net Salary
  const netSalary = roundToTwoDecimals(grossSalary - totalDeduction);

  return {
    variablePay,
    monthDays,
    perMonth,
    perDay,
    workDays,
    basic,
    hra,
    conveyanceAllowance,
    otherAllowance,
    grossSalary,
    ptDeduct,
    leavesDeductAmt,
    totalDeduction,
    netSalary,
  };
}

/**
 * Helper function to calculate per month from fixed pay
 */
export function calculatePerMonth(fixedPay: number): number {
  return roundToTwoDecimals(fixedPay / 12);
}

/**
 * Helper function to calculate per day from per month
 * Uses fixed 30-day logic as per TOON model
 */
export function calculatePerDay(perMonth: number): number {
  return roundToTwoDecimals(perMonth / 30);
}

/**
 * Helper function to calculate work days from month days and leave count
 */
export function calculateWorkDays(monthDays: number, leavesCount: number): number {
  return Math.max(0, monthDays - leavesCount);
}

