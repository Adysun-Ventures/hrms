import { useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ACCOUNT_STATUSES, BANK_OPTIONS, NOMINATION_OPTIONS, TITLES, normalizeStatement } from '../lib/model.js';
import { parseStatementPdf } from '../lib/pdfParser.js';
import { Button } from '../shared/ui.jsx';
import { ICONS } from '../shared/icons.jsx';
import DatePicker from './DatePicker.jsx';

if (typeof window !== 'undefined' && pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
}

const getGroups = account => [
  {
    title: 'Bank & Account',
    fields: [
      { k: 'bank', label: 'Bank Name', select: BANK_OPTIONS, required: true, full: true },
      { k: 'accountNumber', label: 'Account number', required: true, inputMode: 'numeric', placeholder: 'e.g. 00001234567890', hint: 'Use a demo number.' },
      { k: 'accountStatus', label: 'Account status', select: ACCOUNT_STATUSES },
      { k: 'branch', label: 'Branch', placeholder: 'e.g. Baner, Pune' },
      { k: 'nomination', label: 'Nominee registered', select: NOMINATION_OPTIONS },
    ],
  },
  {
    title: 'Customer',
    fields: [
      ...(account.bank === 'HDFC Bank' ? [
        { k: 'title', label: 'Title', select: TITLES, placeholder: 'Mr / Ms / Dr' },
        { k: 'holderName', label: 'Customer name', required: true, placeholder: 'Full name' },
        { k: 'customerId', label: 'Customer ID', placeholder: 'e.g. 104582731', hint: 'Demo value', full: true },
      ] : [
        { k: 'holderName', label: 'Customer name', required: true, placeholder: 'Full name' },
        { k: 'customerId', label: 'CRN', placeholder: 'e.g. 104582731', hint: 'Demo value' },
      ]),
      { k: 'address', label: 'Street name', full: true, placeholder: 'e.g. Flat No, Street / Area' },
      { k: 'city', label: 'City', placeholder: 'e.g. Pune' },
      { k: 'pinCode', label: 'PIN code', inputMode: 'numeric', placeholder: '6 digits' },
      { k: 'state', label: 'State', full: true, placeholder: 'e.g. Maharashtra' },
      { divider: true },
      { k: 'micr', label: 'MICR', inputMode: 'numeric', placeholder: '9 digits', hint: 'Demo value' },
      { k: 'ifsc', label: 'IFSC code', upper: true, placeholder: 'DEMO0000123', hint: 'Demo value' },
    ],
  },
  {
    title: 'Statement period & opening balance',
    fields: [
      { k: 'periodStart', label: 'Start date', date: true, required: true, placeholder: 'dd-mmm-yyyy' },
      { k: 'periodEnd', label: 'End date', date: true, required: true, placeholder: 'dd-mmm-yyyy' },
      { k: 'openingBalance', label: 'Opening balance', required: true, inputMode: 'decimal', placeholder: '0.00', hint: 'Balance at the start of the period. Can be negative for an overdraft.' },
    ],
  },
  {
    title: 'PDF Security & Password Protection',
    fields: [
      {
        k: 'encryptPdf',
        label: 'Password Protect PDF',
        type: 'checkbox',
        hint: 'When enabled, the downloaded PDF will be encrypted with AES-256 and will require a password to open.',
        full: true,
      },
      ...(account.encryptPdf ? [
        {
          k: 'pdfPassword',
          label: 'PDF Password',
          placeholder: 'Enter password (e.g. DDMMYYYY, PAN, or custom)',
          hint: 'This exact password will be required to open the PDF.',
          full: true,
        },
      ] : []),
    ],
  },
];

export default function AccountForm({ account, errors, showAllErrors, onChange, onImportStatement, setNotice }) {
  const [touched, setTouched] = useState({});
  const [importingPdf, setImportingPdf] = useState(false);
  const pdfInputRef = useRef(null);
  const touch = k => setTouched(t => (t[k] ? t : { ...t, [k]: true }));

  async function handlePdfFileChange(e) {
    const file = e.target.files?.[0];
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (!file) return;

    setImportingPdf(true);
    try {
      if (file.size > 20_000_000) throw new Error('File exceeds 20 MB limit.');
      const parsed = await parseStatementPdf(file, { workerUrl });
      if (!parsed || !parsed.account) throw new Error('No valid account details found in the PDF.');

      const normalized = normalizeStatement({
        account: parsed.account,
        transactions: parsed.transactions,
      });

      if (onImportStatement) {
        onImportStatement({
          bank: normalized.bank,
          account: normalized.account,
          transactions: normalized.transactions,
        });
      }

      if (setNotice) {
        setNotice({
          tone: 'ok',
          text: `Imported ${parsed.detectedBank} statement for ${parsed.account.holderName || 'customer'} (${parsed.transactions.length} transactions).`,
        });
      }
    } catch (err) {
      const isPassword = err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password');
      const errorMsg = isPassword
        ? 'This PDF is password-protected. Please unlock it before importing.'
        : `PDF import failed: ${err.message || 'Unable to parse statement'}`;
      if (setNotice) {
        setNotice({ tone: 'danger', text: errorMsg });
      }
    } finally {
      setImportingPdf(false);
    }
  }

  const groups = getGroups(account);

  return (
    <form className="panel" noValidate onSubmit={e => e.preventDefault()} aria-label="Account details">
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handlePdfFileChange}
      />
      {groups.map(group => (
        <fieldset key={group.title} className="group">
          {/* <legend className="st-group-legend">
            <span>{group.title}</span>
            {group.title === 'Bank & Account' && onImportStatement && (
              <div className="flex items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="plain"
                  icon={ICONS.import}
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={importingPdf}
                  title="Import statement details and transactions from a Kotak or HDFC PDF"
                  className="h-7 px-2 text-xs font-semibold normal-case tracking-normal text-emerald-700 hover:bg-emerald-50"
                >
                  {importingPdf ? 'Importing...' : 'Import PDF'}
                </Button>
              </div>
            )}
          </legend> */}
          <div className="st-form-grid">
            {group.fields.map((f, idx) => {
              if (f.divider) {
                return <div key={`div-${idx}`} className="st-form-divider" role="separator" />;
              }
              const id = `acc-${f.k}`;
              const err = (touched[f.k] || showAllErrors) && errors[f.k];
              const common = {
                id,
                name: f.k,
                value: account[f.k] ?? '',
                onBlur: () => touch(f.k),
                onChange: e => onChange({ [f.k]: f.upper ? e.target.value.toUpperCase() : e.target.value }),
                'aria-invalid': err ? 'true' : undefined,
                'aria-describedby': err || f.hint ? `${id}-msg` : undefined,
                required: f.required,
                placeholder: f.placeholder,
              };
              return (
                <div className={`field ${f.full ? 'full' : ''}`} key={f.k}>
                  {f.type === 'checkbox' ? (
                    <label className="checkbox-label" style={{ marginTop: 6, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        id={id}
                        name={f.k}
                        checked={Boolean(account[f.k])}
                        onChange={e => onChange({ [f.k]: e.target.checked })}
                      />
                      <span>{f.label}</span>
                    </label>
                  ) : f.type === 'toggle' ? (
                    <>
                      <label htmlFor={id} className="label">{f.label}</label>
                      <div className="seg" role="group" aria-label={f.label}>
                        {(f.options || ['Yes', 'No']).map(opt => {
                          const active = (account[f.k] || 'Yes') === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`seg-opt ${active ? 'on' : ''}`}
                              onClick={() => onChange({ [f.k]: opt })}
                              aria-pressed={active}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor={id}>
                        {f.label}
                        {f.required && <span className="req" aria-hidden="true"> *</span>}
                      </label>
                      {f.textarea ? (
                        <textarea rows={2} {...common} />
                      ) : f.select ? (
                        <select {...common}>
                          {f.select.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : f.date ? (
                        <DatePicker
                          id={id}
                          name={f.k}
                          value={account[f.k]}
                          onChange={val => onChange({ [f.k]: val })}
                          onBlur={() => touch(f.k)}
                          required={f.required}
                          placeholder={f.placeholder}
                          aria-invalid={err ? 'true' : undefined}
                          aria-describedby={err || f.hint ? `${id}-msg` : undefined}
                        />
                      ) : (
                        <input
                          type={f.type || 'text'}
                          inputMode={f.inputMode}
                          autoComplete={f.autoComplete || 'off'}
                          list={f.datalist ? `${id}-list` : undefined}
                          {...common}
                        />
                      )}
                    </>
                  )}
                  {f.datalist && (
                    <datalist id={`${id}-list`}>
                      {f.datalist.map(o => <option key={o} value={o} />)}
                    </datalist>
                  )}
                  {(err || f.hint) && (
                    <small id={`${id}-msg`} className={err ? 'error' : 'hint'}>
                      {err || f.hint}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </form>
  );
}
