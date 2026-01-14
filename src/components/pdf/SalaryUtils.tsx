// Utility function to convert number to words
export const numberToWords = (num: number): string => {
  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + single[num % 10] : "");
  };

  if (num === 0) return "Zero";
  const convert = (num: number): string => {
    if (num < 100) return formatTens(num);
    if (num < 1000) return single[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + formatTens(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  };

  // Split the number into integer and decimal parts
  const parts = num.toString().split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];

  // Convert the integer part
  let words = convert(integerPart);

  // If there's a decimal part, convert it to words
  if (decimalPart) {
    words += " Point " + decimalPart.split('').map(digit => single[parseInt(digit)]).join(" ");
  }

  return words;
};

interface MonthlySalaryComponents {
  basic: number;
  dearnessAllowance: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  total: number;
}

interface AnnualSalaryComponents {
  basic: number;
  dearnessAllowance: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  total: number;
}

interface SalaryComponents {
  monthly: MonthlySalaryComponents;
  annual: AnnualSalaryComponents;
  ctcInWords: string;
}

// Calculate salary components based on LPA to match reference PDF structure
export const calculateSalaryComponentsV2 = (lpa: number): SalaryComponents => {
  const annualSalary = parseFloat(lpa.toString()) * 100000;
  
  // Calculate the salary components according to reference document
  // Based on the sample PDF, we have 4 components with these proportions:
  // 1. Basic (35%)
  // 2. Dearness Allowance (30%)
  // 3. Conveyance Allowance (20%)
  // 4. Other Allowance (15%)
  
  const basic = annualSalary * 0.35;            // 35% of total
  const dearnessAllowance = annualSalary * 0.30; // 30% of total
  const conveyanceAllowance = annualSalary * 0.20; // 20% of total
  const otherAllowance = annualSalary * 0.15;    // 15% of total
  
  // Monthly equivalents
  const monthlyBasic = basic / 12;
  const monthlyDearness = dearnessAllowance / 12;
  const monthlyConveyance = conveyanceAllowance / 12;
  const monthlyOther = otherAllowance / 12;
  
  return {
    monthly: {
      basic: monthlyBasic,
      dearnessAllowance: monthlyDearness,
      conveyanceAllowance: monthlyConveyance,
      otherAllowance: monthlyOther,
      total: monthlyBasic + monthlyDearness + monthlyConveyance + monthlyOther
    },
    annual: {
      basic: basic,
      dearnessAllowance: dearnessAllowance,
      conveyanceAllowance: conveyanceAllowance,
      otherAllowance: otherAllowance,
      total: annualSalary
    },
    ctcInWords: `${numberToWords(lpa)} Lakh Rupees Only`
  };
};

// Function to format currency with comma separators for Indian number system
export const formatIndianCurrency = (amount: number): string => {
  // Ensure we're working with a number
  amount = amount || 0;
  
  // Convert to integer to avoid decimal formatting issues
  const amountInt = Math.round(Number(amount));
  
  // Use a simpler approach to format the Indian currency
  const numStr = amountInt.toString();
  let result = '';
  
  // Handle numbers less than 1000
  if (numStr.length <= 3) {
    result = numStr;
  } else {
    // Add comma after the first 3 digits from right
    const lastThree = numStr.substring(numStr.length - 3);
    const remaining = numStr.substring(0, numStr.length - 3);
    
    // Add comma after every 2 digits for the remaining part
    const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    
    result = formattedRemaining + ',' + lastThree;
  }
  
  // Add the decimal part for better alignment with original PDF
  return result + '.00';
}; 