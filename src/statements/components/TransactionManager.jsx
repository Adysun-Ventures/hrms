import { useRef, useState } from 'react';
import { isISODate, plainAmount, todayISO, toPaise } from '../lib/format.js';
import { newId } from '../lib/model.js';
import { parseTransactionsFromJson } from '../lib/seeder.js';
import { ICONS, Icon } from '../shared/icons.jsx';
import { Button, Card } from '../shared/ui.jsx';
import { ask } from '../shared/toast.jsx';
import DatePicker from './DatePicker.jsx';

export default function TransactionManager({ statement, onTransactions, onAccount, onUpdateStatement }) {
  const txns = statement.transactions || [];
  const cur = statement.account?.currency || 'INR';

  // Manual transaction editor is strictly for Salary Transactions (Credits only).
  // Daily debit transactions (generated via "Generate Random Filler Data" or seeder)
  // are retained in statement.transactions for calculation & PDF preview, but never displayed in manual entry.
  const salaryTxns = txns.filter(t => t.type === 'credit');

  const [msg, setMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Appends a new empty salary credit transaction form at the end of the salary ledger
  function handleAddSalaryTransaction() {
    let nextDate = statement.account?.periodStart || todayISO();
    if (salaryTxns.length > 0) {
      const last = salaryTxns[salaryTxns.length - 1];
      if (last.date && isISODate(last.date)) {
        const [y, mo, d] = last.date.split('-').map(Number);
        if (y && mo && d) {
          const nextM = mo === 12 ? 1 : mo + 1;
          const nextY = mo === 12 ? y + 1 : y;
          const lastDay = new Date(nextY, nextM, 0).getDate();
          const targetDay = Math.min(d, lastDay);
          nextDate = `${nextY}-${String(nextM).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        } else {
          nextDate = last.date;
        }
      } else if (last.date) {
        nextDate = last.date;
      }
    }

    const newTx = {
      id: newId(),
      date: nextDate,
      valueDate: '',
      description: 'Salary credit - ' + (statement.account?.holderName ? 'Employer Pvt Ltd' : 'Tech Corp Pvt Ltd'),
      reference: '',
      amount: '',
      type: 'credit',
    };

    onTransactions(list => [...list, newTx]);
    setMsg({ tone: 'ok', text: `Created salary transaction #${salaryTxns.length + 1}.` });
  }

  // Removes a salary transaction record by unique ID
  function handleRemove(targetId) {
    const removed = txns.find(t => t.id === targetId);
    onTransactions(list => list.filter(t => t.id !== targetId));
    setMsg({
      tone: 'ok',
      text: `Removed salary transaction${removed?.description ? ` (${removed.description})` : ''}.`,
    });
  }

  // Live in-place field updater for any salary transaction
  function updateField(targetId, key, val) {
    onTransactions(list =>
      list.map(t => (t.id === targetId ? { ...t, [key]: val, type: 'credit' } : t))
    );
  }

  // Formats amount to standard two-decimal paise representation on blur
  function handleAmountBlur(targetId, rawVal) {
    const p = toPaise(rawVal);
    if (!isNaN(p) && p > 0) {
      updateField(targetId, 'amount', plainAmount(p));
    }
  }

  async function handleJsonFile(e) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    try {
      if (file.size > 5_000_000) throw new Error('File is larger than 5 MB.');
      const text = await file.text();
      const parsed = parseTransactionsFromJson(text, statement.account);

      let replace = false;
      if (salaryTxns.length > 0) {
        const choice = await ask({
          title: 'Import salary transactions',
          message: `Imported ${parsed.transactions.length} salary transactions.\n\nChoose whether to replace existing ${salaryTxns.length} salary transactions or append them.`,
          buttons: [
            { label: 'Replace existing', value: 'replace', tone: 'danger' },
            { label: 'Append to existing', value: 'append', tone: 'primary' },
            { label: 'Cancel', value: null, tone: 'plain' },
          ],
        });
        if (!choice) return;
        replace = choice === 'replace';
      }

      const debits = txns.filter(t => t.type !== 'credit');
      const nextList = replace ? [...debits, ...parsed.transactions] : [...txns, ...parsed.transactions];

      const patch = {};
      if (parsed.minDate && parsed.maxDate) {
        const acc = statement.account;
        if (!acc.periodStart || acc.periodStart > parsed.minDate) {
          const [y, mo] = parsed.minDate.split('-');
          patch.periodStart = `${y}-${mo}-01`;
        }
        if (!acc.periodEnd || acc.periodEnd < parsed.maxDate) {
          const [y, mo] = parsed.maxDate.split('-');
          const lastDay = new Date(Number(y), Number(mo), 0).getDate();
          patch.periodEnd = `${y}-${mo}-${String(lastDay).padStart(2, '0')}`;
        }
      }

      if (onUpdateStatement) {
        onUpdateStatement({
          transactions: nextList,
          account: Object.keys(patch).length > 0 ? patch : undefined,
        });
      } else {
        onTransactions(nextList);
        if (onAccount && Object.keys(patch).length > 0) onAccount(patch);
      }

      setMsg({
        tone: 'ok',
        text: `Imported ${parsed.transactions.length} salary transactions from “${file.name}”. Click “Generate Random Filler Data” above to fill daily expenses.`,
      });
    } catch (err) {
      setMsg({ tone: 'danger', text: `Failed to import JSON: ${err.message}` });
    }
  }

  return (
    <Card className="mt-4">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">Salary Transactions</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {salaryTxns.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="plain"
            icon={ICONS.plus}
            onClick={handleAddSalaryTransaction}
            title="Add a new salary transaction form"
            className="h-8 px-2.5 font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Add transaction
          </Button>
          <Button
            size="sm"
            variant="plain"
            icon={ICONS.import}
            onClick={() => fileInputRef.current?.click()}
            title="Import salary credits or transactions from a JSON file"
            className="h-8 px-2.5"
          >
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleJsonFile}
          />
        </div>
      </div>

      {/* Salary Transactions Multi-Record Form List */}
      <div className="mt-4">
        {salaryTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
            <p className="text-xs text-gray-500 mb-3">No salary transactions added yet.</p>
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon={ICONS.plus}
              onClick={handleAddSalaryTransaction}
            >
              + Add first salary transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
            {salaryTxns.map((tx, idx) => (
              <div
                key={tx.id || idx}
                className="relative rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 transition-all hover:border-gray-300 hover:bg-white shadow-2xs"
              >
                {/* Form Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 border-b border-gray-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Salary Transaction #{idx + 1}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Credit
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(tx.id)}
                    title="Remove this salary transaction"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    aria-label={`Remove salary transaction ${idx + 1}`}
                  >
                    <Icon d={ICONS.trash} className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Form Grid */}
                <div className="st-form-grid">
                  <div className="field">
                    <label htmlFor={`tx-${tx.id}-date`}>
                      Transaction date <span className="req">*</span>
                    </label>
                    <DatePicker
                      id={`tx-${tx.id}-date`}
                      value={tx.date}
                      onChange={val => updateField(tx.id, 'date', val)}
                      placeholder="dd-mmm-yyyy"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`tx-${tx.id}-amt`}>
                      Amount ({cur}) <span className="req">*</span>
                    </label>
                    <input
                      id={`tx-${tx.id}-amt`}
                      type="text"
                      inputMode="decimal"
                      value={tx.amount || ''}
                      onChange={e => updateField(tx.id, 'amount', e.target.value)}
                      onBlur={e => handleAmountBlur(tx.id, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor={`tx-${tx.id}-desc`}>
                      Description <span className="req">*</span>
                    </label>
                    <input
                      id={`tx-${tx.id}-desc`}
                      type="text"
                      maxLength={160}
                      value={tx.description || ''}
                      onChange={e => updateField(tx.id, 'description', e.target.value)}
                      placeholder="e.g. Salary credit - Demo Technologies Pvt Ltd"
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor={`tx-${tx.id}-ref`}>Chq/Ref. No.</label>
                    <input
                      id={`tx-${tx.id}-ref`}
                      type="text"
                      maxLength={30}
                      value={tx.reference || ''}
                      onChange={e => updateField(tx.id, 'reference', e.target.value)}
                      placeholder="Demo reference"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={ICONS.plus}
              onClick={handleAddSalaryTransaction}
              className="w-full mt-3 font-semibold"
            >
              + Add next salary transaction
            </Button>
          </div>
        )}
      </div>

      {/* Informational / Status Notice */}
      {msg && (
        <div className={`mt-3 alert ${msg.tone}`} role="status">
          <div className="alert-row">
            <span>{msg.text}</span>
            <button
              type="button"
              className="link"
              onClick={() => setMsg(null)}
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
