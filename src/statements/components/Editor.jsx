import { useMemo, useState } from 'react';
import { compute } from '../lib/calc.js';
import { demoStatement } from '../lib/demo.js';
import { blankAccount } from '../lib/model.js';
import { validateAccount } from '../lib/validate.js';
import { downloadStatementPdf } from '../pdf/generate.jsx';
import AccountForm from './AccountForm.jsx';
import PdfPreview from './PdfPreview.jsx';
import TransactionManager from './TransactionManager.jsx';
import TransactionSeeder from './TransactionSeeder.jsx';
import { Button, Card, CardHeader } from '../shared/ui.jsx';
import { Icon, ICONS } from '../shared/icons.jsx';
import { confirmAsk, toast } from '../shared/toast.jsx';

// Layout: responsive two-column grid inside Card. Left side scrolls naturally, right side PDF preview sticks to top.
export default function Editor({ statement, onChange, onSwitchBank, onBack }) {
  const computed = useMemo(() => compute(statement), [statement]);
  const errors = useMemo(() => validateAccount(statement.account), [statement.account]);
  const errorCount = Object.keys(errors).length;
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const a = statement.account;

  const setAccount = patch => {
    if (patch.bank && patch.bank !== (a.bank || statement.bank) && Object.keys(patch).length === 1 && onSwitchBank) {
      onSwitchBank(patch.bank);
      return;
    }
    onChange({ ...statement, account: { ...statement.account, ...patch } });
  };
  const setTransactions = next =>
    onChange({ ...statement, transactions: typeof next === 'function' ? next(statement.transactions) : next });
  const updateStatement = patch => {
    const nextBank = patch.bank || patch.account?.bank;
    const isBankSwitchOnly = nextBank && nextBank !== (a.bank || statement.bank) && !patch.transactions && Object.keys(patch.account || {}).length <= 1;

    if (isBankSwitchOnly && onSwitchBank) {
      onSwitchBank(nextBank);
      return;
    }

    const next = { ...statement };
    if (patch.bank) next.bank = patch.bank;
    if (patch.account) {
      next.account = { ...statement.account, ...patch.account };
      if (patch.account.bank) next.bank = patch.account.bank;
    }
    if (patch.transactions !== undefined) {
      next.transactions = typeof patch.transactions === 'function' ? patch.transactions(statement.transactions) : patch.transactions;
    }
    onChange(next, nextBank);
  };

  async function handleSeedReplace(txs, meta = {}) {
    if (!meta?.isFiller && statement.transactions.length > 0) {
      const ok = await confirmAsk({
        title: 'Replace transactions?',
        message: `Replace all existing ${statement.transactions.length} transactions with ${txs.length} newly generated transactions?`,
        ok: 'Replace',
        danger: true,
      });
      if (!ok) return;
    }
    setTransactions(txs);
    if (meta?.isFiller) {
      const text = `Generated ${meta.addedCount ?? (txs.length - statement.transactions.length)} daily filler transactions across empty dates. All existing transactions and salary credits were preserved.`;
      setNotice({ tone: 'ok', text });
      toast(text);
    } else {
      const text = `Generated and loaded ${txs.length} transactions matching Indian store categories & monthly salary.`;
      setNotice({ tone: 'ok', text });
      toast(text);
    }
  }

  function handleSeedAppend(txs) {
    setTransactions(list => [...list, ...txs]);
    const text = `Appended ${txs.length} generated transactions.`;
    setNotice({ tone: 'ok', text });
    toast(text);
  }

  async function downloadPdf() {
    if (errorCount) {
      setShowAllErrors(true);
      const text = `Fix ${errorCount} account field${errorCount > 1 ? 's' : ''} before downloading.`;
      setNotice({ tone: 'danger', fields: true, text });
      toast(text, { tone: 'error' });
      setTimeout(() => document.querySelector('.editor [aria-invalid="true"]')?.focus(), 0); // focus scrolls it into view
      return;
    }
    if (a.encryptPdf && !a.pdfPassword?.trim()) {
      const text = 'Please enter a password to encrypt the PDF before downloading.';
      setNotice({ tone: 'danger', text });
      toast(text, { tone: 'error' });
      setTimeout(() => document.querySelector('#acc-pdfPassword, .preview-pass-input')?.focus(), 0);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await downloadStatementPdf(statement, {
        encrypted: Boolean(a.encryptPdf),
        password: a.pdfPassword,
      });
      if (a.encryptPdf) {
        const text = `Downloaded password-protected PDF. Password: "${a.pdfPassword}".`;
        setNotice({ tone: 'ok', text });
        toast(text);
      } else {
        const text = 'Downloaded statement PDF.';
        setNotice({ tone: 'ok', text });
        toast(text);
      }
    } catch (e) {
      const text = `PDF generation failed: ${e.message}`;
      setNotice({ tone: 'danger', text });
      toast(text, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    if (statement.transactions.length || a.holderName) {
      const ok = await confirmAsk({
        title: 'Load demo statement?',
        message: 'Replace this statement’s details and transactions with demo data (~60 transactions)? Existing details will be overwritten.',
        ok: 'Load demo',
        danger: true,
      });
      if (!ok) return;
    }
    const currentBank = a.bank || statement.bank || 'Kotak Mahindra Bank';
    const demo = demoStatement(new Date(), currentBank);
    onChange({ ...statement, bank: demo.bank, account: demo.account, transactions: demo.transactions });
    const text = `${demo.bank} demo data loaded (~60 transactions).`;
    setNotice({ tone: 'ok', text });
    toast(text);
  }

  async function resetForm() {
    const ok = await confirmAsk({
      title: 'Clear statement?',
      message: 'All account details and transactions in this statement will be permanently cleared from this form.',
      ok: 'Clear form',
      danger: true,
    });
    if (!ok) return;
    const currentBank = a.bank || statement.bank || 'Kotak Mahindra Bank';
    const blank = blankAccount();
    blank.bank = currentBank;
    onChange({ ...statement, bank: currentBank, account: blank, transactions: [] });
    setShowAllErrors(false);
    const text = 'Statement form cleared.';
    setNotice({ tone: 'ok', text });
    toast(text);
  }

  const outCount = computed.outOfPeriodIds.size;
  const badCount = computed.invalidIds.size;
  const headerTitle = statement.account?.holderName?.trim()
    ? `Statement – ${statement.account.holderName.trim()}`
    : 'Create Statement';

  return (
    <Card className="print:border-0 print:p-0 print:shadow-none">
      <CardHeader
        onBack={onBack || null}
        title={headerTitle}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button size="sm" variant="plain" onClick={loadDemo}>Load demo</Button>
            <Button size="sm" variant="danger" onClick={resetForm}>Clear</Button>
          </div>
        }
      />

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(400px,480px)_minmax(0,1fr)] xl:grid-cols-[minmax(440px,500px)_minmax(0,1fr)]">
        {/* Left Column: Form Editor */}
        <div className="editor space-y-4 min-w-0">
          {/* <SummaryBar computed={computed} currency={a.currency} /> */}

          {notice && !(notice.fields && errorCount === 0) && (
            <div
              className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs shadow-2xs transition-all ${
                notice.tone === 'ok'
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                  : notice.tone === 'warn'
                  ? 'border-amber-200 bg-amber-50/90 text-amber-900'
                  : 'border-rose-200 bg-rose-50/90 text-rose-900'
              }`}
              role="status"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon
                  d={notice.tone === 'ok' ? ICONS.checkCircle : notice.tone === 'warn' ? ICONS.warning : ICONS.close}
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    notice.tone === 'ok' ? 'text-emerald-600' : notice.tone === 'warn' ? 'text-amber-600' : 'text-rose-600'
                  }`}
                />
                <span className="font-semibold leading-relaxed">{notice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="shrink-0 text-xs font-bold underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {((errorCount > 0 && showAllErrors) || outCount || badCount || computed.negativeCount > 0) && (
            <div className="space-y-2">
              {errorCount > 0 && showAllErrors && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-900 shadow-2xs">
                  <Icon d={ICONS.warning} className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>{errorCount} account field{errorCount > 1 ? 's need' : ' needs'} attention.</strong> PDF download is blocked until fixed.
                  </span>
                </div>
              )}
              {outCount > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs font-semibold text-amber-900 shadow-2xs">
                  <Icon d={ICONS.warning} className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>{outCount} transaction{outCount > 1 ? 's are' : ' is'} dated outside the statement period</strong> and not shown on the statement.
                  </span>
                </div>
              )}
              {badCount > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-900 shadow-2xs">
                  <Icon d={ICONS.close} className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>{badCount} transaction{badCount > 1 ? 's are' : ' is'} invalid</strong> and left out. Edit to fix.
                  </span>
                </div>
              )}
              {computed.negativeCount > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs font-semibold text-amber-900 shadow-2xs">
                  <Icon d={ICONS.warning} className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    The running balance goes below zero on <strong>{computed.negativeCount} transaction{computed.negativeCount > 1 ? 's' : ''}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          <AccountForm
            account={a}
            errors={errors}
            showAllErrors={showAllErrors}
            onChange={setAccount}
            onImportStatement={updateStatement}
            setNotice={setNotice}
          />
          <TransactionSeeder account={a} transactions={statement.transactions} onSeed={handleSeedReplace} onAppend={handleSeedAppend} />
          <TransactionManager statement={statement} onTransactions={setTransactions} onAccount={setAccount} onUpdateStatement={updateStatement} />
        </div>

        {/* Right Column: Sticky Live PDF Preview */}
        <div className="sticky top-4 min-w-0">
          <PdfPreview
            statement={statement}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 select-none whitespace-nowrap shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(a.encryptPdf)}
                    onChange={e => setAccount({ encryptPdf: e.target.checked })}
                    className="h-4 w-4 shrink-0 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <Icon d={ICONS.lock} className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  <span>Protect with password</span>
                </label>

                {a.encryptPdf && (
                  <input
                    type="text"
                    className="h-8 w-32 sm:w-36 shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-mono text-gray-800 placeholder-gray-400 shadow-2xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Enter password..."
                    value={a.pdfPassword || ''}
                    onChange={e => setAccount({ pdfPassword: e.target.value })}
                    title="Password required to open the PDF"
                  />
                )}

                <Button
                  variant="primary"
                  size="md"
                  icon={a.encryptPdf ? ICONS.lock : ICONS.document}
                  onClick={downloadPdf}
                  disabled={busy}
                  className="whitespace-nowrap shrink-0"
                >
                  {busy
                    ? (a.encryptPdf ? 'Encrypting…' : 'Generating…')
                    : (a.encryptPdf ? 'Download Protected PDF' : 'Download PDF')}
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </Card>
  );
}
