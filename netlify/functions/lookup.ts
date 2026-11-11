import { adminDb, getCaller } from '../lib/firebaseAdmin';

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Narrow server-side lookups for checks the browser can no longer do itself once
 * Firestore only lets employees read their own records. Each answer is the minimum needed:
 *  - pan   (signed in): { exists }  (PAN already used by an employee or an old enquiry)
 *  - phone (signed in): { user: { id, userType } | null }
 *  - name  (signed in): { name }
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind || '');
  const value = String(body?.value || '').trim();
  const db = adminDb();

  const caller = await getCaller(req);
  if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 });

  if (kind === 'pan') {
    if (!value) return Response.json({ exists: false });
    const [enq, emp] = await Promise.all([
      db.collection('enquiries').where('pan', '==', value).limit(1).get(),
      db.collection('employees').where('panCard', '==', value).limit(1).get(),
    ]);
    return Response.json({ exists: !enq.empty || !emp.empty });
  }

  if (kind === 'phone') {
    const phone = value.replace(/^\+91/, '');
    const admin = await db.collection('admins').where('mobile', '==', phone).limit(1).get();
    if (!admin.empty && admin.docs[0].data().active) {
      return Response.json({ user: { id: admin.docs[0].id, userType: 'admin' } });
    }
    const emp = await db.collection('employees').where('phone', 'in', [phone, `+91${phone}`]).limit(1).get();
    return Response.json({ user: emp.empty ? null : { id: emp.docs[0].id, userType: 'employee' } });
  }

  if (kind === 'name') {
    const col = body?.collection === 'admins' ? 'admins' : 'employees';
    if (!value) return Response.json({ name: '' });
    const snap = await db.collection(col).doc(value).get();
    const name = String(snap.data()?.name || '');
    return Response.json({ name: col === 'employees' ? titleCase(name) : name });
  }

  return Response.json({ error: 'Unknown lookup' }, { status: 400 });
}

export const config = { path: '/api/lookup' };
