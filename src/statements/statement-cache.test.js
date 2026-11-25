import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearStatementCache,
  getCachedStatementBlob,
  getStatementSignature,
  hasCachedStatementBlob,
} from './pdf/cache.js';

const mockStatement = (overrides = {}) => ({
  id: 'st-test-1',
  updatedAt: 1700000000000,
  account: {
    bank: 'Kotak Mahindra Bank',
    holderName: 'Mahadev Test',
    accountNumber: '1249641801',
    accountType: 'Savings',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    openingBalance: '8729.00',
    closingBalance: '15000.00',
    currency: 'INR',
    branch: 'Pune-Baner',
    crn: 'xxxxxx135',
    ifsc: 'KKBK0001767',
    micr: '411485022',
    pinCode: '411045',
    address: 'Sai Heritage, Baner',
    ...overrides.account,
  },
  transactions: overrides.transactions || [
    { id: 'tx-1', date: '2026-01-01', type: 'debit', amount: '50.00' },
    { id: 'tx-2', date: '2026-01-05', type: 'credit', amount: '1000.00' },
  ],
  ...overrides,
});

test('getStatementSignature: deterministic and detects mutations', () => {
  const base = mockStatement();
  const sig1 = getStatementSignature(base);
  const sig2 = getStatementSignature(mockStatement());

  assert.equal(sig1, sig2, 'Identical statement content must yield identical signatures');
  assert.ok(sig1.length > 20, 'Signature must be a non-empty descriptive string');

  // Mutation in account field
  const mutatedAccount = mockStatement({ account: { holderName: 'Another Name' } });
  assert.notEqual(sig1, getStatementSignature(mutatedAccount), 'Account changes must change signature');

  // Mutation in period
  const mutatedPeriod = mockStatement({ account: { periodEnd: '2026-02-28' } });
  assert.notEqual(sig1, getStatementSignature(mutatedPeriod), 'Period changes must change signature');

  // Mutation in transactions count
  const mutatedTxCount = mockStatement({
    transactions: [...base.transactions, { id: 'tx-3', date: '2026-01-10', type: 'debit', amount: '100.00' }],
  });
  assert.notEqual(sig1, getStatementSignature(mutatedTxCount), 'Transaction count change must change signature');

  // Mutation in transaction amounts
  const mutatedTxAmount = mockStatement({
    transactions: [
      { id: 'tx-1', date: '2026-01-01', type: 'debit', amount: '55.00' },
      base.transactions[1],
    ],
  });
  assert.notEqual(sig1, getStatementSignature(mutatedTxAmount), 'Transaction amount change must change signature');

  // Mutation in updatedAt timestamp
  const mutatedTimestamp = mockStatement({ updatedAt: 1700000099999 });
  assert.notEqual(sig1, getStatementSignature(mutatedTimestamp), 'updatedAt timestamp change must change signature');
});

test('getCachedStatementBlob: caches in memory and avoids recompilation', async () => {
  clearStatementCache();

  const st = mockStatement();
  assert.equal(hasCachedStatementBlob(st), false, 'Initially statement must not be in cache');

  let compileCalls = 0;
  const mockCompile = async s => {
    compileCalls++;
    return new Blob([`pdf-bytes-for-${s.account.holderName}`], { type: 'application/pdf' });
  };

  // 1st call -> compiles
  const blob1 = await getCachedStatementBlob(st, mockCompile);
  assert.equal(compileCalls, 1, 'First call must invoke compileFn');
  assert.ok(blob1 instanceof Blob, 'Must return a Blob');
  assert.equal(hasCachedStatementBlob(st), true, 'Statement must now be cached in memory');

  // 2nd call -> instant cache hit (compileFn not called again)
  const blob2 = await getCachedStatementBlob(st, mockCompile);
  assert.equal(compileCalls, 1, 'Second call must hit cache without calling compileFn');
  assert.equal(blob1, blob2, 'Cached blob instance must be identical');

  // Call with mutated statement -> must compile again
  const mutated = mockStatement({ account: { holderName: 'Updated Name' } });
  assert.equal(hasCachedStatementBlob(mutated), false, 'Mutated statement must not be in cache');

  const blob3 = await getCachedStatementBlob(mutated, mockCompile);
  assert.equal(compileCalls, 2, 'Mutated statement must invoke compileFn');
  assert.notEqual(blob1, blob3, 'Mutated statement must return different blob');

  // clearStatementCache resets state
  clearStatementCache();
  assert.equal(hasCachedStatementBlob(st), false, 'clearStatementCache must wipe memory cache');
});
