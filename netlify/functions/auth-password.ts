import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getCaller } from '../lib/firebaseAdmin';
import { hashPassword } from '../lib/password';

/** Set a password. Admins may set anyone's; an employee only their own. */
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const caller = await getCaller(req);
  if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const uid = String(body?.uid || '');
  const password = String(body?.password || '');
  if (!uid || password.length < 4) {
    return Response.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
  }
  if (caller.role !== 'admin' && caller.uid !== uid) {
    return Response.json({ error: 'You can only change your own password' }, { status: 403 });
  }

  await adminDb()
    .collection('credentials')
    .doc(uid)
    .set({ hash: await hashPassword(password), updatedAt: FieldValue.serverTimestamp(), updatedBy: caller.uid });
  return Response.json({ ok: true });
}

export const config = { path: '/api/auth/password' };
