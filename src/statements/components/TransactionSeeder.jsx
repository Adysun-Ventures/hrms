import { useMemo, useState } from 'react';
import { fillTransactionGaps, generateSeedTransactions, parseLocalDate } from '../lib/seeder.js';
import { CORPORATE_SALARY_PRESETS, pickRandom } from '../lib/indianMerchants.js';
import { ICONS, Icon } from '../shared/icons.jsx';

/**
 * Clean, single-action Transaction Seeder.
 * If existing transactions (such as imported salary credits) are present, it operates in
 * smart filler mode: preserves all existing credits/transactions and fills empty gap days
 * with realistic daily retail debits while maintaining a positive balance.
 * If no transactions exist, synthesizes a complete set of daily debits and recurring salary.
 */
export default function TransactionSeeder({ account, transactions = [], onSeed }) {
  const [generating, setGenerating] = useState(false);

  const daysCount = useMemo(() => {
    const s = parseLocalDate(account.periodStart);
    const e = parseLocalDate(account.periodEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [account.periodStart, account.periodEnd]);

  const hasValidDates = daysCount > 0;
  const hasExisting = transactions && transactions.length > 0;
  const creditsCount = hasExisting ? transactions.filter(t => t.type === 'credit').length : 0;

  function handleGenerate() {
    if (!hasValidDates) return;
    setGenerating(true);
    try {
      if (hasExisting) {
        // Smart filler mode: preserve existing transactions (e.g. monthly salary credits)
        // and fill the remaining empty day gaps with realistic daily debits.
        const res = fillTransactionGaps(account, transactions);
        onSeed(res.transactions, { isFiller: true, addedCount: res.addedCount });
      } else {
        // Full synthesis mode: generate both salary credit and daily debits
        const sender = pickRandom(CORPORATE_SALARY_PRESETS);
        const salaryAmt = (Math.floor(Math.random() * 21 + 55) * 1000).toFixed(2);

        const txs = generateSeedTransactions(account, {
          minDailyTx: 5,
          maxDailyTx: 10,
          recurringCredit: {
            enabled: true,
            mode: 'NEFT',
            from: sender,
            dayOfMonth: 5,
            defaultAmount: salaryAmt,
            sameAmountAllMonths: true,
            sameDateAllMonths: true,
            monthlyOverrides: {},
          },
        });

        onSeed(txs, { isFiller: false });
      }
    } finally {
      setGenerating(false);
    }
  }

  let hintText = '';
  if (!hasValidDates) {
    hintText = 'Enter statement start and end dates above to enable automatic transaction generation.';
  } else if (hasExisting) {
    hintText = `Statement has ${transactions.length} existing transactions (${creditsCount} salary credit${creditsCount === 1 ? '' : 's'}). Generates realistic daily filler debits (Tapri, Groceries, Dining, Fuel, ATM) for the gap days while preserving your salary.`;
  } else {
    hintText = `Automatically populates realistic daily Indian UPI debits (Tapri, Groceries, Dining, Fuel, ATM) & monthly salary credit from ${account.periodStart} to ${account.periodEnd}.`;
  }

  const btnLabel = generating
    ? 'Generating…'
    : hasExisting
    ? 'Generate Random Filler Data'
    : 'Generate Random Data';

  return (
    <button
      type="button"
      className="btn btn-sm inline-flex items-center gap-1.5"
      disabled={!hasValidDates || generating}
      onClick={handleGenerate}
      title={hasValidDates ? (hasExisting ? 'Fill empty days between salary payments with daily debits' : `Generate transactions from ${account.periodStart} to ${account.periodEnd}`) : 'Set statement dates first'}
    >
      <Icon d={ICONS.bolt} className="h-3.5 w-3.5" />
      <span>{btnLabel}</span>
    </button>
  );
}
