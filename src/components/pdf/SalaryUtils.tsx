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



