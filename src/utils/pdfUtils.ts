// Utility functions for PDF generation

// Format currency in Indian format (e.g., 1,00,000)
export const formatIndianCurrency = (amount: number): string => {
  if (isNaN(amount)) return '0';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};

// Convert number to words for salary display
export const numberToWords = (num: number): string => {
  // Handle zero, negative, and NaN
  if (isNaN(num)) return "Zero";
  if (num === 0) return "Zero";
  if (num < 0) return "Negative " + numberToWords(Math.abs(num));
  
  // For safety, limit input size
  if (num >= 1000000000000) return "Too Large";
  
  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (num: number) => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + single[num % 10] : "");
  };
  
  const safeConvert = (num: number): string => {
    // Base cases first
    if (num < 100) return formatTens(num);
    if (num < 1000) return single[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + formatTens(num % 100) : "");
    
    // For larger numbers, handle each range directly rather than recursive calls
    if (num < 100000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return formatTens(thousands) + " Thousand" + (remainder ? " " + safeConvert(remainder) : "");
    }
    
    if (num < 10000000) {
      const lakhs = Math.floor(num / 100000);
      const remainder = num % 100000;
      return formatTens(lakhs) + " Lakh" + (remainder ? " " + safeConvert(remainder) : "");
    }
    
    // Crores
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return formatTens(crores) + " Crore" + (remainder ? " " + safeConvert(remainder) : "");
  };

  // Split the number into integer and decimal parts
  const parts = num.toString().split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];

  // Convert the integer part
  let words = safeConvert(integerPart);

  // If there's a decimal part, convert it to words
  if (decimalPart) {
    words += " Point " + decimalPart.split('').map(digit => single[parseInt(digit)]).join(" ");
  }

  return words;
};

// Calculate salary components for offer letter v2
export const calculateSalaryComponentsV2 = (lpa: number | string) => {
  // Convert string to number if needed
  const lpaNum = typeof lpa === 'string' ? parseFloat(lpa) : lpa;
  
  // Check if it's a valid number
  if (isNaN(lpaNum)) {
    return {
      annual: {
        basic: 0,
        dearnessAllowance: 0,
        conveyanceAllowance: 0,
        otherAllowance: 0,
        total: 0
      },
      monthly: {
        basic: 0,
        dearnessAllowance: 0,
        conveyanceAllowance: 0,
        otherAllowance: 0,
        total: 0
      },
      lpa: 0
    };
  }
  
  const annualSalary = lpaNum * 100000;
  
  // Calculate annual components
  const annualBasic = Math.round(annualSalary * 0.35); // 35% of CTC
  const annualDA = Math.round(annualSalary * 0.30); // 30% of CTC
  const annualConveyance = Math.round(annualSalary * 0.20); // 20% of CTC
  const annualOther = Math.round(annualSalary * 0.15); // 15% of CTC
  
  // Calculate monthly components
  const monthlyBasic = Math.round(annualBasic / 12);
  const monthlyDA = Math.round(annualDA / 12);
  const monthlyConveyance = Math.round(annualConveyance / 12);
  const monthlyOther = Math.round(annualOther / 12);
  const monthlyTotal = monthlyBasic + monthlyDA + monthlyConveyance + monthlyOther;
  
  return {
    annual: {
      basic: annualBasic,
      dearnessAllowance: annualDA,
      conveyanceAllowance: annualConveyance,
      otherAllowance: annualOther,
      total: annualSalary
    },
    monthly: {
      basic: monthlyBasic,
      dearnessAllowance: monthlyDA,
      conveyanceAllowance: monthlyConveyance,
      otherAllowance: monthlyOther,
      total: monthlyTotal
    },
    lpa: lpaNum
  };
};

// Format date to DD MMM YYYY format
export const formatDateToDDMMMYYYY = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}; 