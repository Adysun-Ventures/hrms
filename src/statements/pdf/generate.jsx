import { nowStamp } from '../lib/format.js';
import { encryptPdfBlob, stripPdfMetadata } from '../lib/encrypt.js';
import { getCachedStatementBlob as cacheGet, hasCachedStatementBlob, clearStatementCache } from './cache.js';
import PdfWorker from './pdf.worker.js?worker';

let worker = null;
let seq = 0;
const waiting = new Map();

function initWorker() {
  if (typeof Worker === 'undefined') return null;
  try {
    const w = new PdfWorker();
    w.onmessage = ({ data }) => {
      const job = waiting.get(data.id);
      if (!job) return;
      waiting.delete(data.id);
      if (data.error) job.reject(new Error(data.error));
      else job.resolve(new Blob([data.buffer], { type: 'application/pdf' }));
    };
    w.onerror = e => {
      e.preventDefault?.();
      // Fail pending jobs cleanly with an error instead of locking the UI main thread
      for (const job of waiting.values()) {
        job.reject(new Error('PDF compilation failed or ran out of memory in background worker.'));
      }
      waiting.clear();
      try {
        w.terminate();
      } catch {}
      worker = null;
    };
    return w;
  } catch (err) {
    console.warn('Failed to initialize PDF worker:', err);
    return null;
  }
}

function getWorker() {
  if (!worker) {
    worker = initWorker();
  }
  return worker;
}

/** The same PDF is used for the on-screen preview and the download. */
export function statementBlob(statement) {
  const generatedAt = nowStamp();
  const w = getWorker();
  if (!w) {
    // Only used if Web Workers are genuinely not supported in environment
    return (async () => {
      const { renderOnMainThread } = await import('./mainThread.jsx');
      return renderOnMainThread(statement, generatedAt);
    })();
  }
  return new Promise((resolve, reject) => {
    const id = ++seq;
    waiting.set(id, { resolve, reject, statement, generatedAt });
    w.postMessage({ id, statement, generatedAt });
  });
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';

export const pdfFileName = st => `statement-${slug(st.account.holderName)}-${st.account.periodStart || 'start'}_${st.account.periodEnd || 'end'}.pdf`;

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export { encryptPdfBlob, stripPdfMetadata, hasCachedStatementBlob, clearStatementCache };

export const getCachedStatementBlob = st => cacheGet(st, statementBlob);

export const downloadStatementPdf = async (st, options = {}) => {
  let blob = await getCachedStatementBlob(st);
  const shouldEncrypt = options.encrypted !== undefined ? Boolean(options.encrypted) : Boolean(st.account?.encryptPdf);
  const password = options.password !== undefined ? String(options.password) : String(st.account?.pdfPassword || '');
  if (shouldEncrypt && password.trim()) {
    blob = await encryptPdfBlob(blob, password.trim());
  } else {
    blob = await stripPdfMetadata(blob);
  }
  saveBlob(blob, pdfFileName(st));
};
