import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Server-only Firebase access. Needs FIREBASE_SERVICE_ACCOUNT (the service-account JSON, one line)
// in .env.local and on Netlify. With FIRESTORE_EMULATOR_HOST set it runs against the emulator instead.
function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'adysun-hrms' });
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) return initializeApp({ credential: cert(JSON.parse(raw)) });
  // Smaller alternative (Netlify functions cap all env vars at 4 KB): just the two fields we need.
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT, or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
  }
  return initializeApp({ credential: cert({ projectId: 'adysun-hrms', clientEmail, privateKey }) });
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());

export type Caller = { uid: string; role: 'admin' | 'employee'; employeeId: string | null };

/** Who is calling, from the `Authorization: Bearer <Firebase ID token>` header. Null if missing/invalid. */
export async function getCaller(req: Request): Promise<Caller | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  try {
    const t = await adminAuth().verifyIdToken(token);
    if (t.role !== 'admin' && t.role !== 'employee') return null;
    return { uid: t.uid, role: t.role, employeeId: (t.employeeId as string) || null };
  } catch {
    return null;
  }
}
