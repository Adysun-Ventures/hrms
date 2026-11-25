import { useMemo, useRef, useState } from 'react';
import { compute } from '../lib/calc.js';
import { demoStatement } from '../lib/demo.js';
import { fmtLongDate, money } from '../lib/format.js';
import { blankStatement, maskAccount, newId, normalizeStatement, statementTitle } from '../lib/model.js';
import { validateAccount } from '../lib/validate.js';
import { downloadStatementPdf } from '../pdf/generate.jsx';
import { go } from '../route.js';
import { Button, Card, CardHeader } from '../shared/ui.jsx';
import { ICONS } from '../shared/icons.jsx';
import { confirmAsk, toast } from '../shared/toast.jsx';

export default function Dashboard({ list, onSave, onDelete, persistent }) {
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const rows = useMemo(
    () => [...list].sort((x, y) => y.updatedAt - x.updatedAt).map(st => ({ st, c: compute(st) })),
    [list],
  );

  const create = st => { onSave(st); go(st.id); };

  function duplicate(st) {
    const now = Date.now();
    onSave({
      ...st,
      id: newId(),
      createdAt: now,
      account: { ...st.account, holderName: `${st.account.holderName || 'Untitled'} (copy)` },
      transactions: st.transactions.map(t => ({ ...t, id: newId() })),
    });
    setMsg({ tone: 'ok', text: `Duplicated “${statementTitle(st)}”.` });
  }

  async function remove(st) {
    const ok = await confirmAsk({
      title: `Delete “${statementTitle(st)}”?`,
      message: `Delete this statement and its ${st.transactions.length} transactions? This cannot be undone.`,
      ok: 'Delete',
      danger: true,
    });
    if (!ok) return;
    onDelete(st.id);
    const text = `Deleted “${statementTitle(st)}”.`;
    setMsg({ tone: 'ok', text });
    toast(text);
  }

  async function download(st) {
    const problems = Object.keys(validateAccount(st.account)).length;
    if (problems) return setMsg({ tone: 'danger', text: `“${statementTitle(st)}” has ${problems} account field${problems > 1 ? 's' : ''} to fix before it can be downloaded. Open it with Edit.` });
    setBusyId(st.id);
    try {
      await downloadStatementPdf(st, {
        encrypted: Boolean(st.account?.encryptPdf),
        password: st.account?.pdfPassword,
      });
      if (st.account?.encryptPdf && st.account?.pdfPassword) {
        setMsg({ tone: 'ok', text: `Downloaded encrypted PDF for “${statementTitle(st)}”. Password: "${st.account.pdfPassword}".` });
      }
    } catch (e) {
      setMsg({ tone: 'danger', text: `PDF generation failed: ${e.message}` });
    } finally {
      setBusyId(null);
    }
  }

  async function openFile(file) {
    fileRef.current.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('file is larger than 5 MB');
      const st = normalizeStatement(JSON.parse(await file.text()));
      if (!st) throw new Error('this is not a Statement Builder file');
      create({ ...st, id: newId(), transactions: st.transactions.map(t => ({ ...t, id: newId() })) });
    } catch (e) {
      setMsg({ tone: 'danger', text: `Could not open ${file.name}: ${e.message}` });
    }
  }

  return (
    <Card>
      <CardHeader
        onBack={() => (history.length > 1 ? history.back() : (window.location.hash = '#/'))}
        title="Statement Builder"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" variant="primary" icon={ICONS.plus} onClick={() => create(blankStatement())}>New statement</Button>
            <Button size="sm" variant="plain" onClick={() => create(demoStatement())}>New from demo</Button>
            <Button size="sm" variant="plain" onClick={() => fileRef.current.click()}>Open .json file</Button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e => openFile(e.target.files[0])} />
          </div>
        }
      />

      {msg && (
        <div className={`mt-3 flex items-center justify-between rounded-xl p-3 text-xs ${msg.tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`} role="status">
          <span>{msg.text}</span>
          <button type="button" className="underline font-bold" onClick={() => setMsg(null)}>Dismiss</button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <p className="text-xs text-gray-500">
          <b className="text-sm font-bold text-gray-900">{rows.length}</b> {rows.length === 1 ? 'statement' : 'statements'}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="my-8 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          No statements yet. Start a new one, or begin from demo data to see how it works.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px] text-gray-800">
            <thead className="bg-gray-50 border-y border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="px-3.5 py-2.5">Account holder</th>
                <th className="px-3.5 py-2.5">Period</th>
                <th className="px-3.5 py-2.5 text-right">Transactions</th>
                <th className="px-3.5 py-2.5 text-right">Closing balance</th>
                <th className="px-3.5 py-2.5">Last edited</th>
                <th className="px-3.5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ st, c }) => (
                <tr key={st.id} className="hover:bg-brand-50/40">
                  <td className="px-3.5 py-3">
                    <a href={`#/statements/edit/${encodeURIComponent(st.id)}`} className="font-bold text-brand-600 hover:underline">
                      {statementTitle(st)}
                    </a>
                    <small className="block text-xs text-gray-400">
                      {[st.account.accountType, maskAccount(st.account.accountNumber)].filter(Boolean).join(' · ')}
                    </small>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap text-xs text-gray-600">
                    {st.account.periodStart ? `${fmtLongDate(st.account.periodStart)} – ${fmtLongDate(st.account.periodEnd)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-xs text-gray-700">{c.count}</td>
                  <td className={`px-3.5 py-3 text-right font-mono font-bold text-xs ${c.closing < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {st.account.currency} {money(c.closing, st.account.currency)}
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(st.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="primary" onClick={() => go(st.id)}>Open</Button>
                      <Button size="sm" variant="plain" onClick={() => download(st)} disabled={busyId === st.id}>
                        {busyId === st.id ? 'PDF…' : 'PDF'}
                      </Button>
                      <Button size="sm" variant="plain" onClick={() => duplicate(st)}>Duplicate</Button>
                      <Button size="sm" variant="danger" onClick={() => remove(st)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
