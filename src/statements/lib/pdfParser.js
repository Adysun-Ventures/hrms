import * as pdfjs from 'pdfjs-dist';
import { blankAccount, newId } from './model.js';
import { toPaise } from './format.js';

// Month lookup dictionary for dates like "01-Nov-2026" or "01 Nov 2026"
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Convert any standard bank date string into strict ISO "YYYY-MM-DD".
 */
export function parseDateToISO(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD-MMM-YYYY or DD MMM YYYY or DD-MMM-YY
  const dMmmY = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})$/);
  if (dMmmY) {
    const day = dMmmY[1].padStart(2, '0');
    const mon = MONTH_MAP[dMmmY[2].toLowerCase()];
    let yr = dMmmY[3];
    if (yr.length === 2) yr = '20' + yr;
    if (mon) return `${yr}-${mon}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const mon = dmy[2].padStart(2, '0');
    let yr = dmy[3];
    if (yr.length === 2) yr = '20' + yr;
    return `${yr}-${mon}-${day}`;
  }

  return '';
}

/**
 * Parses monetary strings like "1,250.50", "₹ 50,000.00", "0.00", or "-" to standard "0.00".
 */
export function cleanAmount(str) {
  if (!str) return '0.00';
  const clean = String(str).replace(/[^\d.-]/g, '').trim();
  if (!clean || clean === '-' || isNaN(Number(clean))) return '0.00';
  return Number(clean).toFixed(2);
}

/**
 * Intelligent bank auto-detection based on text heuristics and distinguishing brand signatures.
 */
export function detectBankFromText(fullText) {
  const upper = String(fullText || '').toUpperCase();
  let kotakScore = 0;
  let hdfcScore = 0;

  // Kotak Indicators
  if (upper.includes('KOTAK')) kotakScore += 6;
  if (upper.includes('KKBK')) kotakScore += 5;
  if (upper.includes('CRN')) kotakScore += 4;
  if (upper.includes('KOTAK811')) kotakScore += 5;
  if (upper.includes('HAUSLA HAI TOH')) kotakScore += 5;
  if (upper.includes('MAHINDRA BANK')) kotakScore += 5;

  // HDFC Indicators
  if (upper.includes('HDFC')) hdfcScore += 6;
  if (upper.includes('WE UNDERSTAND YOUR WORLD')) hdfcScore += 5;
  if (upper.includes('CUST ID')) hdfcScore += 4;
  if (upper.includes('HDFC0')) hdfcScore += 5;
  if (upper.includes('HDFC BANK LIMITED')) hdfcScore += 5;
  if (upper.includes('CLOSING BALANCE')) hdfcScore += 1;

  if (hdfcScore > kotakScore) {
    return 'HDFC Bank';
  }
  return 'Kotak Mahindra Bank';
}

/**
 * Reconstruct text lines from PDF page items with spatial sorting.
 */
export function reconstructLinesFromTextItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Group items by Y coordinate (within 3pt threshold)
  const rows = [];
  // Sort top-to-bottom (Y descending in PDF coordinate space)
  const sorted = [...items].sort((a, b) => (b.transform?.[5] ?? 0) - (a.transform?.[5] ?? 0));

  for (const item of sorted) {
    const text = (item.str || '').trim();
    if (!text) continue;
    const y = item.transform?.[5] ?? 0;
    const x = item.transform?.[4] ?? 0;

    let targetRow = rows.find(r => Math.abs(r.y - y) <= 3);
    if (!targetRow) {
      targetRow = { y, items: [] };
      rows.push(targetRow);
    }
    targetRow.items.push({ x, text });
  }

  // Sort rows descending Y, and within each row sort items ascending X
  rows.sort((a, b) => b.y - a.y);
  return rows.map(r => {
    r.items.sort((a, b) => a.x - b.x);
    return r.items.map(it => it.text).join(' ');
  });
}

/**
 * Extracts metadata (Customer, Bank, Account, Period, Opening Balance) from text lines.
 */
export function extractMetadataFromText(fullText, lines = [], detectedBank = 'Kotak Mahindra Bank') {
  const account = blankAccount();
  account.bank = detectedBank;
  account.country = 'India';
  account.currency = 'INR';

  const isHdfc = detectedBank === 'HDFC Bank';

  // 1. Account Number
  const accMatch = fullText.match(/(?:Account\s*(?:No|Number|No\.)|A\/C\s*No\.?)\s*[:\-]?\s*(\d{8,18})/i);
  if (accMatch) {
    account.accountNumber = accMatch[1];
  } else {
    // Try finding standalone 10-16 digit account number
    const numMatch = fullText.match(/\b\d{10,16}\b/);
    if (numMatch) account.accountNumber = numMatch[0];
  }

  // 2. Customer ID / CRN (handles masked like xxxxxx135 as well)
  if (isHdfc) {
    const custIdMatch = fullText.match(/(?:Cust(?:omer)?\s*ID)\s*[:\-]?\s*([A-Za-z0-9]{6,14})/i);
    if (custIdMatch) account.customerId = custIdMatch[1];
  } else {
    const crnMatch = fullText.match(/CRN\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    if (crnMatch) account.customerId = crnMatch[1];
  }

  // 3. Customer Name & Title
  const nameMatch = fullText.match(/(?:Customer\s*Name|Name)\s*[:\-]?\s*([A-Za-z\s.]+?)(?=\n|CRN|Cust|Account|Address|Branch|Period|Opening|$)/i)
    || fullText.match(/Account No\.?\s*\d+\s*\n\s*([A-Za-z\s.]+?)\s*\n\s*(?:Account Type|CRN)/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    if (isHdfc) {
      const titleMatch = rawName.match(/^(MR|MS|MRS|DR)\.?\s+(.+)$/i);
      if (titleMatch) {
        account.title = titleMatch[1].toUpperCase() === 'MR' ? 'Mr' : titleMatch[1].toUpperCase() === 'MS' ? 'Ms' : 'Dr';
        account.holderName = titleMatch[2].trim();
      } else {
        account.holderName = rawName;
      }
    } else {
      account.holderName = rawName;
    }
  }

  // 4. Branch
  const branchMatch = fullText.match(/Branch\s*[:\-]?\s*([A-Za-z0-9\s,\-]+?)(?=\n|Sai|Flat|IFSC|MICR|Phone|Tel|Email|Period|Account|$)/i);
  if (branchMatch) {
    account.branch = branchMatch[1].trim();
  }

  // 5. IFSC Code
  const ifscMatch = fullText.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);
  if (ifscMatch) {
    account.ifsc = ifscMatch[1];
  }

  // 6. MICR
  const micrMatch = fullText.match(/MICR\s*(?:Code)?\s*[:\-]?\s*(\d{9})/i);
  if (micrMatch) {
    account.micr = micrMatch[1];
  }

  // 7. Statement Period (Start & End Date)
  const periodMatch = fullText.match(/(?:Statement\s*Period|Period|From)\s*[:\-]?\s*([0-9]{1,2}[-/. ][A-Za-z0-9]{2,3}[-/. ][0-9]{2,4})\s*(?:to|-)\s*([0-9]{1,2}[-/. ][A-Za-z0-9]{2,3}[-/. ][0-9]{2,4})/i)
    || fullText.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*-\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
  if (periodMatch) {
    account.periodStart = parseDateToISO(periodMatch[1]);
    account.periodEnd = parseDateToISO(periodMatch[2]);
  }

  // 8. Opening Balance
  const opBalMatch = fullText.match(/Opening\s*Balance[^\d]*([\d,]+\.?\d*)/i);
  if (opBalMatch) {
    account.openingBalance = cleanAmount(opBalMatch[1]);
  }

  // 9. PIN Code, City, State
  const pinMatch = fullText.match(/\b(1\d{5}|2\d{5}|3\d{5}|4\d{5}|5\d{5}|6\d{5}|7\d{5}|8\d{5})\b/);
  if (pinMatch) {
    account.pinCode = pinMatch[1];
  }

  const cityMatch = fullText.match(/([A-Za-z]+)\s*-\s*\d{6}/) || fullText.match(/(?:City)\s*[:\-]?\s*([A-Za-z]+)/i);
  if (cityMatch) {
    account.city = cityMatch[1].trim();
  }

  const stateMatch = fullText.match(/([A-Za-z]+)\s*-\s*India/i) || fullText.match(/(?:State)\s*[:\-]?\s*([A-Za-z\s]+)/i);
  if (stateMatch) {
    account.state = stateMatch[1].trim();
  }

  return account;
}

/**
 * Extracts tabular transaction entries from text lines.
 */
export function extractTransactionsFromLines(lines = []) {
  const transactions = [];

  const txDateRegex = /^(\d+\s+)?(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{2,4})\s+/;
  const threeAmtRegex = /([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})$/;
  const twoAmtRegex = /([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

  const STOP_PATTERNS = [
    /End of Statement/i,
    /Account Summary/i,
    /For assistance, reach out/i,
    /Important Information/i,
    /Commonly Used Narrations/i,
    /Registered Office:/i,
    /•\s*RBI mandates/i,
    /Statement Generated on/i,
    /Page \d+ of \d+/i,
  ];

  let runningPaise = null;
  let currentTx = null;
  let inStatementBody = true;
  let firstFoundBalance = null;
  let firstFoundTxType = null;
  let firstFoundTxAmount = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (STOP_PATTERNS.some(p => p.test(trimmed))) {
      if (trimmed.includes('End of Statement') || trimmed.includes('Account Summary')) {
        inStatementBody = false;
      }
      continue;
    }

    const nextTrimmed = (lines[i + 1] || '').trim();
    // Skip repeating page headers: e.g. Customer Name before "Account No. ...", or Account No itself
    if (/^Account No\.?\s*\d+/i.test(nextTrimmed)) {
      continue;
    }

    if (
      trimmed.includes('Opening Balance') ||
      trimmed.includes('Account Statement') ||
      trimmed.startsWith('Savings Account Transactions') ||
      trimmed.startsWith('# Date Description') ||
      trimmed.startsWith('Date Narration') ||
      /^Account No\.?\s*\d+/i.test(trimmed) ||
      trimmed.startsWith('Kotak Mahindra Bank') ||
      trimmed.startsWith('HDFC Bank')
    ) {
      continue;
    }

    const matchDate = trimmed.match(txDateRegex);
    if (matchDate) {
      if (currentTx) {
        transactions.push(currentTx);
        currentTx = null;
      }

      const dateStr = parseDateToISO(matchDate[2]);
      const rest = trimmed.slice(matchDate[0].length).trim();
      const match3 = rest.match(threeAmtRegex);
      const match2 = !match3 ? rest.match(twoAmtRegex) : null;
      const matchAmts = match3 || match2;

      if (matchAmts) {
        let type = 'debit';
        let amount = '0.00';
        let balance = '0.00';

        // 3 amounts: [withdrawal, deposit, balance]
        if (match3) {
          const w = cleanAmount(match3[1]);
          const d = cleanAmount(match3[2]);
          balance = cleanAmount(match3[3]);
          if (Number(d) > 0 && Number(w) === 0) {
            type = 'credit';
            amount = d;
          } else {
            type = 'debit';
            amount = w;
          }
          runningPaise = Math.round(Number(balance) * 100);
        } else {
          // 2 amounts: [txAmount, balance]
          amount = cleanAmount(match2[1]);
          balance = cleanAmount(match2[2]);
          const curBalPaise = Math.round(Number(balance) * 100);

          if (runningPaise !== null) {
            if (curBalPaise > runningPaise) {
              type = 'credit';
            } else {
              type = 'debit';
            }
          } else {
            // First transaction
            if (trimmed.toLowerCase().includes('cr') || trimmed.toLowerCase().includes('credit')) {
              type = 'credit';
            } else {
              type = 'debit';
            }
          }
          runningPaise = curBalPaise;
        }

        const middle = rest.slice(0, matchAmts.index).trim();
        let ref = '';
        let desc = middle;
        const refMatch = middle.match(/\s+(UPI[-/][A-Za-z0-9/]+|NEFT[-/][A-Za-z0-9/]+|IMPS[-/][A-Za-z0-9/]+|CHQ\s*[:\-]?\s*\d+|\d{10,18}|[A-Za-z0-9/-]{8,24})$/i);
        if (refMatch) {
          ref = refMatch[1].trim();
          desc = middle.slice(0, refMatch.index).trim();
        }

        if (firstFoundBalance === null && Number(balance) > 0) {
          firstFoundBalance = balance;
          firstFoundTxType = type;
          firstFoundTxAmount = amount;
        }

        currentTx = {
          id: newId(),
          date: dateStr,
          valueDate: dateStr,
          description: desc,
          reference: ref,
          amount,
          type,
          _balance: balance,
        };
      }
    } else if (currentTx && inStatementBody) {
      if (!trimmed.startsWith('#') && !trimmed.startsWith('Date') && !trimmed.includes('Kotak Mahindra Bank') && !trimmed.includes('HDFC Bank')) {
        const cleanCont = trimmed.split(/(?:End of Statement|Account Summary|Savings Account \(SA\)|Important Information)/)[0].trim();
        if (cleanCont) {
          currentTx.description = (currentTx.description + ' ' + cleanCont).trim();
        }
      }
    }
  }

  if (currentTx) transactions.push(currentTx);

  transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return {
    transactions,
    firstFoundBalance,
    firstFoundTxType,
    firstFoundTxAmount,
  };
}

/**
 * High-level parser that takes raw string or array of lines, detects bank, extracts account and transactions.
 */
export function parseStatementText(fullTextOrLines) {
  let lines = [];
  let fullText = '';

  if (Array.isArray(fullTextOrLines)) {
    lines = fullTextOrLines;
    fullText = lines.join('\n');
  } else {
    fullText = String(fullTextOrLines || '');
    lines = fullText.split(/\r?\n/);
  }

  const detectedBank = detectBankFromText(fullText);
  const account = extractMetadataFromText(fullText, lines, detectedBank);
  const { transactions, firstFoundBalance, firstFoundTxType, firstFoundTxAmount } = extractTransactionsFromLines(lines);

  // If opening balance wasn't found in metadata, derive it from the first transaction
  if (!account.openingBalance || Number(account.openingBalance) === 0) {
    if (firstFoundBalance !== null && firstFoundTxAmount !== null) {
      const balPaise = toPaise(firstFoundBalance);
      const amtPaise = toPaise(firstFoundTxAmount);
      let opPaise = balPaise;
      if (firstFoundTxType === 'debit') {
        opPaise = balPaise + amtPaise;
      } else {
        opPaise = Math.max(0, balPaise - amtPaise);
      }
      account.openingBalance = (opPaise / 100).toFixed(2);
    }
  }

  // If periodStart or periodEnd weren't found, derive from transaction dates
  if (transactions.length > 0) {
    if (!account.periodStart) {
      account.periodStart = transactions[0].date;
    }
    if (!account.periodEnd) {
      account.periodEnd = transactions[transactions.length - 1].date;
    }
  }

  return {
    account,
    transactions,
    detectedBank,
  };
}

/**
 * Client-side parser for PDF files or ArrayBuffers using pdfjs-dist.
 */
export async function parseStatementPdf(fileOrBuffer, options = {}) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer?.arrayBuffer) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer?.buffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer.buffer;
  } else {
    throw new Error('Invalid input: expected a PDF File or ArrayBuffer.');
  }

  const data = new Uint8Array(arrayBuffer);
  let pdfjsLib = pdfjs;

  // In Node.js testing/CLI environments, dynamically use legacy build to prevent subtle crypto issues
  if (typeof window === 'undefined') {
    try {
      const legacy = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (legacy && legacy.getDocument) pdfjsLib = legacy;
    } catch {
      // ignore
    }
  } else {
    // In Browser environments, ensure workerSrc is explicitly configured
    if (options.workerUrl && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerUrl;
    } else if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch {
        // ignore
      }
    }
  }

  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allLines = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageLines = reconstructLinesFromTextItems(content.items);
    allLines.push(...pageLines);
  }

  return parseStatementText(allLines);
}
