// Utility function to convert number to words
export const numberToWords = (num) => {
  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (num) => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + single[num % 10] : "");
  };

  if (num === 0) return "Zero";
  const convert = (num) => {
    if (num < 100) return formatTens(num);
    if (num < 1000) return single[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + formatTens(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  };

  // Split the number into integer and decimal parts
  const [integerPart, decimalPart] = num.toString().split('.');

  // Convert the integer part
  let words = convert(parseInt(integerPart));

  // If there's a decimal part, convert it to words
  if (decimalPart) {
    words += " Point " + decimalPart.split('').map(digit => single[parseInt(digit)]).join(" ");
  }

  return words;
};

// Calculate salary components based on LPA
export const calculateSalaryComponents = (lpa) => {
  const annualSalary = parseFloat(lpa) * 100000;
  
  // Calculate basic salary (50% of CTC)
  const basicSalary = annualSalary * 0.5;
  
  // Calculate HRA (40% of basic)
  const hra = basicSalary * 0.4;
  
  // Education allowance (fixed)
  const educationAllowance = 2400;
  
  // LTA (8.33% of basic)
  const lta = basicSalary * 0.0833;
  
  // Monthly Reimbursement
  const monthlyReimbursement = annualSalary * 0.05;
  
  // Statutory Bonus
  const statutoryBonus = 7000;
  
  // Calculate employer PF contribution (12% of basic, capped at 1800 per month)
  const basicMonthly = basicSalary / 12;
  const monthlyPFCap = 15000;
  const pfBasisMonthly = Math.min(basicMonthly, monthlyPFCap);
  const employerPF = pfBasisMonthly * 0.12 * 12;
  
  // Gratuity (4.81% of basic)
  const gratuity = basicSalary * 0.0481;
  
  // Monthly Wellness (fixed)
  const monthlyWellness = 2000 * 12;
  
  // Health Insurance (fixed)
  const healthInsurance = 12000;
  
  // Calculate remaining amount for special allowance
  const totalAllocated = basicSalary + hra + educationAllowance + lta + 
                         monthlyReimbursement + statutoryBonus + 
                         employerPF + gratuity + monthlyWellness + healthInsurance;
  
  const specialAllowance = annualSalary - totalAllocated;
  
  // Total of all components (should equal CTC)
  const total = basicSalary + hra + educationAllowance + lta + 
                monthlyReimbursement + statutoryBonus + specialAllowance +
                employerPF + gratuity + monthlyWellness + healthInsurance;
  
  // Return both monthly and annual values
  return {
    monthly: {
      basic: basicSalary / 12,
      hra: hra / 12,
      educationAllowance: educationAllowance / 12,
      lta: lta / 12,
      monthlyReimbursement: monthlyReimbursement / 12,
      statutoryBonus: statutoryBonus / 12,
      specialAllowance: specialAllowance / 12,
      employerPF: employerPF / 12,
      gratuity: gratuity / 12,
      monthlyWellness: monthlyWellness / 12,
      healthInsurance: healthInsurance / 12
    },
    annual: {
      basic: basicSalary,
      hra: hra,
      educationAllowance: educationAllowance,
      lta: lta,
      monthlyReimbursement: monthlyReimbursement,
      statutoryBonus: statutoryBonus,
      specialAllowance: specialAllowance,
      employerPF: employerPF,
      gratuity: gratuity,
      monthlyWellness: monthlyWellness,
      healthInsurance: healthInsurance,
      total: total
    },
    ctcInWords: `Rupees ${numberToWords(lpa * 100000)} Only`
  };
};

// Prepare salary data for the SalaryTable component
export const prepareSalaryTableData = (salaryComponents) => {
  const { monthly, annual } = salaryComponents;
  
  const components = [
    { name: 'Basic', monthly: monthly.basic, annual: annual.basic },
    { name: 'HRA', monthly: monthly.hra, annual: annual.hra },
    { name: 'Education Allowance', monthly: monthly.educationAllowance, annual: annual.educationAllowance },
    { name: 'Travel Reimbursement (LTA)', monthly: monthly.lta, annual: annual.lta },
    { name: 'Monthly Reimbursement', monthly: monthly.monthlyReimbursement, annual: annual.monthlyReimbursement },
    { name: 'Statutory Bonus', monthly: monthly.statutoryBonus, annual: annual.statutoryBonus },
    { name: 'Special Allowance', monthly: monthly.specialAllowance, annual: annual.specialAllowance },
  ];
  
  const totalMonthly = Object.values(monthly).reduce((sum, value) => sum + value, 0);
  const totalAnnual = annual.total;
  
  return {
    components,
    totalMonthly,
    totalAnnual
  };
}; 