import { toISO } from './format.js';
import { blankStatement, newId } from './model.js';

// Small seeded PRNG so the demo data is deterministic and reproducible.
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);

const KOTAK_MERCHANTS = [
  ['UPI - Demo Grocery Mart', 180, 3200],
  ['UPI - Sample Fuel Station', 500, 2500],
  ['UPI - Example Cafe', 120, 950],
  ['UPI - Demo Pharmacy', 150, 1800],
  ['Card - Online Shopping (Demo)', 400, 4800],
  ['UPI - Test Electronics Store', 900, 4200],
  ['UPI - Demo Restaurant', 350, 2100],
  ['UPI/DEMO HOME APPLIANCES PVT LTD/demo.appliances@okdemo/DEMO0000456/Payment for order 88231 - EMI instalment (demo)', 1200, 4500],
];

const HDFC_MERCHANTS = [
  ['UPI-DEMO GROCERY MART-GROCERY@PAYTM-PAYMENT', 180, 3200],
  ['UPI-SAMPLE FUEL STATION-FUEL@OKAXIS-PAYMENT', 500, 2500],
  ['UPI-EXAMPLE CAFE-CAFE@OKHDFCBANK-PAYMENT', 120, 950],
  ['UPI-DEMO PHARMACY-PHARMA@YBL-PAYMENT', 150, 1800],
  ['ACH D- PAYU FINANCE INDIA P-KX4G24WIV7MG', 400, 4800],
  ['UPI-CRED-CRED.CLUB@AXISB-UTIB0000114-PAYMENT ON CRED', 900, 4200],
  ['UPI-DEMO RESTAURANT-FOOD@PAYTM-PAYMENT', 350, 2100],
  ['ACH D- HERO FINCORP LTD-66111801', 1200, 4500],
];

/**
 * Returns a demo statement for the specified bank (Kotak Mahindra Bank or HDFC Bank)
 * populated with authentic bank metadata and ~60 transactions.
 */
export function demoStatement(today = new Date(), bank = 'Kotak Mahindra Bank') {
  const isHdfc = String(bank || '').toLowerCase().includes('hdfc');
  const targetBank = isHdfc ? 'HDFC Bank' : 'Kotak Mahindra Bank';

  const r = rng(isHdfc ? 20261115 : 20261112);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const between = (lo, hi) => Math.round((lo + r() * (hi - lo)) * 100) / 100;
  let refNo = 4100;

  const makeRef = () => {
    if (isHdfc) {
      return '0000' + String(Math.floor(r() * 900000000000 + 100000000000));
    }
    return `DM${(refNo += 7)}${Math.floor(r() * 90 + 10)}`;
  };

  const txns = [];
  const add = (date, description, type, amount) =>
    txns.push({
      id: newId(),
      date: toISO(date),
      valueDate: toISO(date),
      description,
      reference: makeRef(),
      type,
      amount: amount.toFixed(2),
    });

  const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0);

  const merchants = isHdfc ? HDFC_MERCHANTS : KOTAK_MERCHANTS;

  for (let k = 0; k < 3; k++) {
    const y = start.getFullYear(), m = start.getMonth() + k;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const day = d => new Date(y, m, Math.min(d, lastDay));

    if (isHdfc) {
      add(day(1), 'NEFT CR-UTIB0004520-DEMO TECHNOLOGIES PVT LTD-AARAV MEHTA-AXOMB' + Math.floor(r() * 9000000000 + 1000000000) + ' OTHERS SALARY', 'credit', 85000);
      add(day(3), 'UPI-RENT TRANSFER-LANDLORD@YBL-0000' + Math.floor(r() * 900000000000 + 100000000000) + '-PAYMENT FROM PHONE', 'debit', 22000);
      add(day(5), 'ACH D- CTRAZORPAY-DMIFINANCEPTFHQWEGNY2X', 'debit', 5000);
      add(day(10), 'Electricity bill - Demo Power Co', 'debit', between(1650, 2600));
      add(day(12), 'Mobile recharge - Demo Telecom', 'debit', 599);
      for (let i = 0; i < 2; i++) {
        add(day(6 + Math.floor(r() * 22)), 'ATM cash withdrawal - HDFC ATM 0421', 'debit', pick([2000, 3000, 5000]));
      }
    } else {
      add(day(1), 'Salary credit - Demo Technologies Pvt Ltd', 'credit', 85000);
      add(day(3), 'NEFT - Rent transfer to Demo Landlord', 'debit', 22000);
      add(day(5), 'Mutual fund SIP - Demo Asset Management', 'debit', 5000);
      add(day(10), 'Electricity bill - Demo Power Co', 'debit', between(1650, 2600));
      add(day(12), 'Mobile recharge - Demo Telecom', 'debit', 599);
      for (let i = 0; i < 2; i++) {
        add(day(6 + Math.floor(r() * 22)), 'ATM cash withdrawal - Demo ATM 0042', 'debit', pick([2000, 3000, 5000]));
      }
    }

    for (let i = 0; i < 10; i++) {
      const [name, lo, hi] = pick(merchants);
      add(day(2 + Math.floor(r() * (lastDay - 2))), name, 'debit', between(lo, hi));
    }
    add(day(8 + Math.floor(r() * 15)), isHdfc ? 'UPI-R KAPOOR-RKAPOOR@OKAXIS-PAYMENT RECEIVED' : 'UPI received - R Kapoor (shared expenses)', 'credit', between(800, 3500));
    if (k === 1) add(day(20), isHdfc ? 'UPI-REFUND ONLINE SHOPPING-PAYMENT' : 'Refund - Online Shopping (Demo)', 'credit', 1499);
  }

  add(end, 'Savings interest credit', 'credit', 312.45);
  txns.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const s = blankStatement();
  s.bank = targetBank;

  if (isHdfc) {
    s.account = {
      bank: 'HDFC Bank',
      title: 'Mr',
      holderName: 'Aarav Mehta',
      customerId: '104582731',
      address: '402, Sample Residency, Aundh Road\nNear Demo Park, Aundh',
      city: 'Pune',
      pinCode: '411007',
      state: 'Maharashtra',
      country: 'India',
      micr: '411240018',
      ifsc: 'HDFC0000794',
      accountNumber: '50100237280284',
      accountType: 'Savings',
      branch: 'HINJAWADI',
      accountStatus: 'Regular',
      nomination: 'Yes',
      currency: 'INR',
      periodStart: toISO(start),
      periodEnd: toISO(end),
      openingBalance: '48250.75',
    };
  } else {
    s.account = {
      bank: 'Kotak Mahindra Bank',
      title: 'Mr',
      holderName: 'Aarav Mehta',
      customerId: '104582731',
      address: '402, Sample Residency, Aundh Road\nNear Demo Park, Aundh',
      city: 'Pune',
      pinCode: '411007',
      state: 'Maharashtra',
      country: 'India',
      micr: '999999123',
      ifsc: 'DEMO0000123',
      accountNumber: '00001234567890',
      accountType: 'Savings',
      branch: 'Demo Branch – Baner, Pune',
      accountStatus: 'Active',
      nomination: 'Yes',
      currency: 'INR',
      periodStart: toISO(start),
      periodEnd: toISO(end),
      openingBalance: '48250.75',
    };
  }

  s.transactions = txns;
  return s;
}
