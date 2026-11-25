const DB_NAME = 'statement-pdf-cache-v1';
const STORE_NAME = 'blobs';
const MAX_MEMORY_ITEMS = 10;

const memoryCache = new Map(); // signature -> Blob
const inFlightCache = new Map(); // signature -> Promise<Blob>

/**
 * Computes a fast deterministic content signature for a statement.
 * Covers account details, period, transaction count, amounts, dates, and updatedAt timestamp.
 */
export function getStatementSignature(st) {
  if (!st) return '';
  const a = st.account || {};
  const tx = st.transactions || [];
  const accSig = `${a.bank || ''}|${a.holderName || ''}|${a.accountNumber || ''}|${a.accountType || ''}|${a.periodStart || ''}|${a.periodEnd || ''}|${a.openingBalance || ''}|${a.closingBalance || ''}|${a.currency || ''}|${a.branch || ''}|${a.crn || ''}|${a.ifsc || ''}|${a.micr || ''}|${a.pinCode || ''}|${(a.address || '').trim()}`;
  const count = tx.length;
  const firstTx = count > 0 ? `${tx[0].id}-${tx[0].date}-${tx[0].amount}-${tx[0].type}` : 'none';
  const lastTx = count > 0 ? `${tx[count - 1].id}-${tx[count - 1].date}-${tx[count - 1].amount}-${tx[count - 1].type}` : 'none';
  const sum = count > 0 ? tx.reduce((acc, t) => acc + (Math.round((Number(t.amount) || 0) * 100) % 100000), 0) : 0;
  return `${st.id || 'temp'}_${st.updatedAt || 0}_${count}_${sum}_${firstTx}_${lastTx}_${accSig}`;
}

export function hasCachedStatementBlob(st) {
  const sig = getStatementSignature(st);
  return Boolean(sig && memoryCache.has(sig));
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getIdbBlob(key) {
  try {
    const db = await openDb();
    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveIdbBlob(key, blob) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Returns the compiled statement PDF blob.
 * Hits the instant in-memory cache first, then IndexedDB, and compiles
 * only if no cached binary exists for this exact statement signature.
 */
export async function getCachedStatementBlob(statement, compileFn) {
  const sig = getStatementSignature(statement);
  if (!sig) return compileFn(statement);

  // 1. Tier 1: In-memory cache (0ms instant)
  if (memoryCache.has(sig)) {
    return memoryCache.get(sig);
  }

  // 2. In-flight promise deduplication
  if (inFlightCache.has(sig)) {
    return inFlightCache.get(sig);
  }

  // 3. Tier 2: IndexedDB persistent disk cache (<20ms)
  try {
    const idbBlob = await getIdbBlob(sig);
    if (idbBlob) {
      memoryCache.set(sig, idbBlob);
      return idbBlob;
    }
  } catch {}

  // 4. Compile via compileFn
  const compilePromise = (async () => {
    try {
      const blob = await compileFn(statement);
      memoryCache.set(sig, blob);
      if (memoryCache.size > MAX_MEMORY_ITEMS) {
        const oldest = memoryCache.keys().next().value;
        memoryCache.delete(oldest);
      }
      saveIdbBlob(sig, blob).catch(() => {});
      return blob;
    } finally {
      inFlightCache.delete(sig);
    }
  })();

  inFlightCache.set(sig, compilePromise);
  return compilePromise;
}

export function clearStatementCache() {
  memoryCache.clear();
  inFlightCache.clear();
}
