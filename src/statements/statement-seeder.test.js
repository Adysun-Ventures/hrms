import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fillTransactionGaps, generateSeedTransactions, getMonthsInRange, parseTransactionsFromJson } from './lib/seeder.js';
import { validateTransaction } from './lib/validate.js';
import { compute } from './lib/calc.js';

test('getMonthsInRange calculates exact calendar months', () => {
  const months = getMonthsInRange('2026-01-01', '2026-10-31');
  assert.equal(months.length, 10);
  assert.equal(months[0].key, '2026-01');
  assert.equal(months[0].label, 'Jan 2026');
  assert.equal(months[9].key, '2026-10');
  assert.equal(months[9].label, 'Oct 2026');
});

test('generateSeedTransactions generates 5 to 10 debits daily and exact monthly credits', () => {
  const account = {
    bank: 'HDFC Bank',
    holderName: 'Kiran Chandrakant Shinde',
    accountNumber: '50100237280284',
    ifsc: 'HDFC0000794',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-05', // 5 days
    openingBalance: '25000.00',
  };

  const txs = generateSeedTransactions(account, {
    minDailyTx: 5,
    maxDailyTx: 10,
    recurringCredit: {
      enabled: true,
      mode: 'NEFT',
      from: 'TECH MAHINDRA',
      dayOfMonth: 2,
      defaultAmount: '65000.00',
      sameAmountAllMonths: true,
      sameDateAllMonths: true,
    },
  });

  // 5 days * (5 to 10) = 25 to 50 debits + 1 credit on 2026-01-02
  assert.ok(txs.length >= 26 && txs.length <= 51);

  // Check monthly recurring salary credit
  const credits = txs.filter(t => t._isMonthlyCredit);
  assert.equal(credits.length, 1);
  assert.equal(credits[0].date, '2026-01-02');
  assert.equal(credits[0].amount, '65000.00');
  assert.match(credits[0].description, /TECH MAHINDRA/);
  assert.match(credits[0].description, /NEFT CR/);

  // Validate every generated transaction conforms to schema
  for (const t of txs) {
    const errors = validateTransaction(t, { start: account.periodStart, end: account.periodEnd });
    assert.deepEqual(errors, {}, `Transaction ${t.id} had errors: ${JSON.stringify(errors)}`);
    assert.match(t.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(t.valueDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number(t.amount) > 0);
  }

  // Verify compute() runs cleanly without errors
  const statement = { account, transactions: txs };
  const computed = compute(statement);
  assert.equal(computed.invalidIds.size, 0);
  assert.equal(computed.outOfPeriodIds.size, 0);
  assert.equal(computed.lines.length, txs.length);
  assert.ok(computed.credit > 0);
  assert.ok(computed.debit > 0);
});

test('Kotak Bank narration formatting conforms to standard', () => {
  const account = {
    bank: 'Kotak Mahindra Bank',
    holderName: 'Mahadev',
    accountNumber: '1249641801',
    ifsc: 'KKBK0001767',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-02',
    openingBalance: '8729.00',
  };

  const txs = generateSeedTransactions(account, {
    minDailyTx: 5,
    maxDailyTx: 6,
    recurringCredit: {
      enabled: true,
      dayOfMonth: 1,
      defaultAmount: '50000.00',
    },
  });

  const credit = txs.find(t => t._isMonthlyCredit);
  assert.ok(credit);
  assert.match(credit.description, /NEFT CR-KKBK0001767/);

  const debits = txs.filter(t => t.type === 'debit');
  assert.ok(debits.length >= 8);
  const upiDebits = debits.filter(t => t.description.startsWith('UPI/'));
  assert.ok(upiDebits.length > 0);
  assert.match(upiDebits[0].reference, /^UPI-\d{12}$/);
});

test('supports monthly custom amounts and dates overrides', () => {
  const account = {
    bank: 'HDFC Bank',
    holderName: 'Kiran Shinde',
    accountNumber: '50100237280284',
    ifsc: 'HDFC0000794',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    openingBalance: '10000.00',
  };

  const txs = generateSeedTransactions(account, {
    minDailyTx: 1,
    maxDailyTx: 2,
    recurringCredit: {
      enabled: true,
      mode: 'NEFT',
      from: 'INFOSYS LIMITED',
      dayOfMonth: 5,
      defaultAmount: '50000.00',
      sameAmountAllMonths: false,
      sameDateAllMonths: false,
      monthlyOverrides: {
        '2026-01': { day: 3, amount: '52000.00' },
        '2026-02': { day: 4, amount: '54000.00' },
        '2026-03': { day: 5, amount: '58000.00' },
      },
    },
  });

  const credits = txs.filter(t => t._isMonthlyCredit);
  assert.equal(credits.length, 3);
  assert.equal(credits[0].date, '2026-01-03');
  assert.equal(credits[0].amount, '52000.00');
  assert.equal(credits[1].date, '2026-02-04');
  assert.equal(credits[1].amount, '54000.00');
  assert.equal(credits[2].date, '2026-03-05');
  assert.equal(credits[2].amount, '58000.00');
});

test('parseTransactionsFromJson parses salary_credits.json accurately', () => {
  const filePath = path.resolve('data/salary_credits.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const account = {
    bank: 'Kotak Mahindra Bank',
    holderName: 'Mahadev',
    ifsc: 'KKBK0001767',
  };

  const parsed = parseTransactionsFromJson(raw, account);
  assert.equal(parsed.isSalaryCredits, true);
  assert.equal(parsed.transactions.length, 45);
  assert.equal(parsed.minDate, '2021-02-08');
  assert.equal(parsed.maxDate, '2024-10-07');

  // Verify first credit (Sr 1: 8 Feb 2021, 16080.65)
  assert.equal(parsed.transactions[0].date, '2021-02-08');
  assert.equal(parsed.transactions[0].amount, '16080.65');
  assert.equal(parsed.transactions[0].type, 'credit');
  assert.equal(parsed.transactions[0].description, 'NEFT N317243391404852 SOURCE CODE TECHNOLOGY HDFC');
  assert.equal(parsed.transactions[0].reference, 'NEFTINW-1031136568');

  // Verify Row 8 (7 Sept 2021: 23833.00)
  const row8 = parsed.transactions.find(t => t.date === '2021-09-07');
  assert.ok(row8);
  assert.equal(row8.amount, '23833.00');

  // Verify Row 31 (7 Aug 2023: 20724.64)
  const row31 = parsed.transactions.find(t => t.date === '2023-08-07');
  assert.ok(row31);
  assert.equal(row31.amount, '20724.64');
});

test('fillTransactionGaps preserves salary credits, populates realistic debits, and prevents negative balances', () => {
  const filePath = path.resolve('data/salary_credits.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const account = {
    bank: 'Kotak Mahindra Bank',
    holderName: 'Mahadev',
    accountNumber: '1249641801',
    ifsc: 'KKBK0001767',
    periodStart: '2021-01-01',
    periodEnd: '2024-10-31',
    openingBalance: '5000.00',
  };

  const parsed = parseTransactionsFromJson(raw, account);
  assert.equal(parsed.transactions.length, 45);

  const filled = fillTransactionGaps(account, parsed.transactions);
  assert.ok(filled.addedCount > 0, 'Should add gap transactions');
  assert.ok(filled.transactions.length > 45, 'Total transactions should include existing plus new filler transactions');

  // Verify all 45 original salary credits are still preserved
  for (const sc of parsed.transactions) {
    assert.ok(filled.transactions.some(t => t.id === sc.id), 'Original salary credit preserved');
  }
  const credits = filled.transactions.filter(t => t.type === 'credit');
  assert.ok(credits.length >= 45, 'All 45 salary credits must be preserved');
  assert.ok(filled.transactions.some(t => t.type === 'debit'), 'Debits must be populated');

  // Verify all transactions pass validation
  for (const t of filled.transactions) {
    const errs = validateTransaction(t, { start: account.periodStart, end: account.periodEnd });
    assert.deepEqual(errs, {}, `Transaction ${t.id} failed validation: ${JSON.stringify(errs)}`);
  }

  // Compute statement and verify financial math
  const statement = { account, transactions: filled.transactions };
  const computed = compute(statement);

  assert.equal(computed.invalidIds.size, 0, 'No invalid transactions');
  assert.equal(computed.outOfPeriodIds.size, 0, 'No out of period transactions');
  assert.equal(computed.negativeCount, 0, 'Running balance must never go negative');
  assert.ok(computed.closing > 0, 'Closing balance must be strictly positive');
  assert.ok(computed.debit > 0, 'Debits must be populated');
  assert.ok(computed.credit > computed.debit, 'Total credits must exceed debits for healthy savings');
});

