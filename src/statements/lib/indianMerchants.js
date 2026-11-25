import { fakerEN_IN as faker } from '@faker-js/faker';

export const UPI_HANDLES = ['@okaxis', '@okicici', '@oksbi', '@ybl', '@paytm', '@ibl', '@axl'];
export const UPI_BANKS = ['YESB', 'SBIN', 'UTIB', 'ICIC', 'HDFC', 'KKBK', 'BARB'];

export const CORPORATE_SALARY_PRESETS = [
  'TATA CONSULTANCY SERVICES',
  'INFOSYS LIMITED',
  'WIPRO TECHNOLOGIES',
  'TECH MAHINDRA',
  'COGNIZANT TECH SOLUTIONS',
  'ACCENTURE INDIA',
  'ANYACCESS SOLUTIONS',
  'LARSEN & TOUBRO INFOTECH',
  'HCL TECHNOLOGIES',
  'CAPGEMINI INDIA',
  'RELIANCE JIO INFOCOMM',
  'PERSISTENT SYSTEMS',
];

export const MERCHANT_CATEGORIES = [
  {
    id: 'tapri',
    name: 'Tapri, Chai & Paan',
    weight: 25,
    minAmt: 10,
    maxAmt: 60,
    method: 'UPI',
    stores: [
      'ZAIKA CHAI',
      'RAHI PAN SHOP',
      'SHIV TEA STALL',
      'SHREE GANESH CHAI',
      'CHAI SUTTA BAR',
      'AMRUTTULYA CHAI',
      'SAI PAN SHOP',
      'YEVLE CHAI',
      'GANESH BHEL & CHAI',
      'MAULI TEA & SNACKS',
    ],
  },
  {
    id: 'fast_food',
    name: 'Snacks, Bakeries & Fast Food',
    weight: 15,
    minAmt: 50,
    maxAmt: 350,
    method: 'UPI',
    stores: [
      'CHITALE BANDHU MITHAIWALE',
      'WADAPAV CORNER',
      'IRANI CAFE',
      'HALDIRAM FOODS',
      'JAGDAMBA SWEETS & BHEL',
      'BABA SNACKS CENTER',
      'ROLLS MANIA',
      'GOKUL DAIRY & BAKERY',
      'BURGER KING',
    ],
  },
  {
    id: 'dining_delivery',
    name: 'Dining & Online Food Delivery',
    weight: 15,
    minAmt: 150,
    maxAmt: 1800,
    method: 'UPI',
    stores: [
      'SWIGGY',
      'ZOMATO',
      'HOTEL ANAND VEG',
      'MATA PITA VEG RESTAURANT',
      'CAFE COFFEE DAY',
      'DOMINOS PIZZA',
      'BARBEQUE NATION',
      'VAISHALI RESTAURANT',
      'SUBWAY INDIA',
    ],
  },
  {
    id: 'grocery_mart',
    name: 'Groceries, Supermarket & Quick Commerce',
    weight: 15,
    minAmt: 150,
    maxAmt: 3500,
    method: 'UPI',
    stores: [
      'BLINKIT COMMERCE',
      'ZEPTO QUICK',
      'SWIGGY INSTAMART',
      'D-MART SUPERMARKET',
      'APNA BAZAAR',
      'NATURE BASKET',
      'RELIANCE SMART POINT',
      'SHREE BALAJI PROVISIONS',
      'MORE SUPERMARKET',
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel & Petrol Pumps',
    weight: 8,
    minAmt: 150,
    maxAmt: 2500,
    method: 'POS',
    stores: [
      'INDIAN OIL AUTO CARE',
      'BHARAT PETROLEUM PUMP',
      'HP FUEL STATION',
      'SHELL PETROL PUMP',
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities & Telecom Recharges',
    weight: 5,
    minAmt: 299,
    maxAmt: 2499,
    method: 'UPI',
    stores: [
      'JIO MOBILITY RECHARGE',
      'AIRTEL PREPAID PAYMENT',
      'MSEB ELECTRICITY BILL',
      'BESCOM ELECTRICITY',
      'TATA PLAY DTH',
      'VI TELECOM BILL',
      'ACT FIBERNET BROADBAND',
    ],
  },
  {
    id: 'medical',
    name: 'Medical & Pharmacy',
    weight: 7,
    minAmt: 60,
    maxAmt: 1500,
    method: 'UPI',
    stores: [
      'APOLLO PHARMACY',
      'MEDPLUS PHARMA',
      'WELLNESS FOREVER',
      'NETMEDS HEALTHCARE',
      'GENERIC MEDICINE STORE',
    ],
  },
  {
    id: 'atm_wdl',
    name: 'ATM Cash Withdrawal',
    weight: 3,
    minAmt: 500,
    maxAmt: 10000,
    method: 'ATM',
    stores: [
      'ATM CASH WDL - KKBK BANER',
      'ATM-HDFC BANK HINJAWADI',
      'ATM CASH WDL - SBI AUNDH',
      'ATM-ICICI SENAPATI BAPAT RD',
    ],
  },
  {
    id: 'p2p',
    name: 'P2P Transfer to Friends / Family',
    weight: 7,
    minAmt: 100,
    maxAmt: 4000,
    method: 'UPI',
    stores: [], // Dynamically generated with fakerEN_IN
  },
];

export function random12Digit() {
  let s = '';
  for (let i = 0; i < 12; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s;
}

export function randomUtr(prefix = 'AXOMB') {
  let s = prefix;
  for (let i = 0; i < 11; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s;
}

export function randomPhone() {
  const prefixes = ['98', '97', '96', '95', '99', '88', '87', '77', '70'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  let s = p;
  for (let i = 0; i < 8; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickWeightedCategory() {
  const totalWeight = MERCHANT_CATEGORIES.reduce((sum, c) => sum + c.weight, 0);
  let r = Math.random() * totalWeight;
  for (const cat of MERCHANT_CATEGORIES) {
    if (r < cat.weight) return cat;
    r -= cat.weight;
  }
  return MERCHANT_CATEGORIES[0];
}

/**
 * Format narration matching authentic Kotak Bank or HDFC Bank syntax.
 */
export function formatBankNarration({ bank, categoryId, merchantName, rrn, utr, vpa, type, sender, holderName, ifsc }) {
  const isHdfc = bank === 'HDFC Bank';
  const cleanMerchant = (merchantName || 'MERCHANT').toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim();
  const bankCode = pickRandom(UPI_BANKS);

  if (type === 'credit') {
    // Salary or Self Deposit
    const cleanSender = (sender || 'EMPLOYER').toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim();
    const cleanHolder = (holderName || 'CUSTOMER').toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim();
    const useIfsc = ifsc || (isHdfc ? 'HDFC0000794' : 'KKBK0001767');
    const transferUtr = utr || randomUtr('UTIB');

    if (isHdfc) {
      return `NEFT CR-${useIfsc}-${cleanSender}- ${cleanHolder}-${transferUtr} OTHERS ANY ACCESS SALARY`;
    }
    return `NEFT CR-${useIfsc}-${cleanSender}-${cleanHolder}-${transferUtr}-SALARY`;
  }

  // ATM Withdrawal
  if (categoryId === 'atm_wdl') {
    if (isHdfc) {
      return `ATM WDL-${cleanMerchant.replace('ATM CASH WDL - ', '').replace('ATM-', '')}-411240018`;
    }
    return `ATM CASH WDL - ${cleanMerchant.replace('ATM CASH WDL - ', '')}`;
  }

  // Retail / Tapri / Food / Grocery UPI
  const userVpa = vpa || `${randomPhone()}${pickRandom(UPI_HANDLES)}`;
  if (isHdfc) {
    return `UPI-${cleanMerchant}-${userVpa}-${rrn}-PAYMENT FROM PHONE`;
  }
  return `UPI/${cleanMerchant}/${bankCode}/${rrn}/Payment from`;
}
