import { adminAuth, adminDb } from '../lib/firebaseAdmin';
import { verifyPassword } from '../lib/password';

const INVALID = 'Invalid mobile number or password.';

const toMs = (v: any) => {
  if (!v) return 0;
  if (typeof v?.toDate === 'function') return v.toDate().getTime() || 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Mobile + password login. The password is checked here (never in the browser) against
 * `credentials/{uid}` and the response carries a Firebase custom token whose claims
 * (`role`, `employeeId`) are what firestore.rules check.
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  try {
    const body = await req.json().catch(() => ({}));
    const digits = String(body?.phone || '').replace(/\D/g, '');
    const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    const password = String(body?.password || '');
    if (phone.length !== 10 || !password) return Response.json({ error: INVALID }, { status: 401 });

    const db = adminDb();
    let role: 'admin' | 'employee';
    let snap = await db.collection('admins').where('mobile', '==', phone).limit(1).get();
    let userDoc = snap.docs[0];
    if (userDoc && userDoc.data().active) {
      role = 'admin';
    } else {
      snap = await db.collection('employees').where('phone', 'in', [phone, `+91${phone}`]).limit(1).get();
      userDoc = snap.docs[0];
      if (!userDoc) return Response.json({ error: INVALID }, { status: 401 });
      role = 'employee';
    }

    const uid = userDoc.id;
    const data = userDoc.data();
    const cred = await db.collection('credentials').doc(uid).get();

    // Passwords live only as scrypt hashes in credentials/{uid} (all users migrated 2026-11-11).
    if (!cred.exists || !(await verifyPassword(password, cred.data()?.hash))) {
      return Response.json({ error: INVALID }, { status: 401 });
    }

    if (role === 'employee') {
      const emps = await db.collection('employments').where('employeeId', '==', uid).get();
      const latest = emps.docs
        .map((d) => d.data())
        .sort((a, b) => (toMs(b.updatedAt) || toMs(b.startDate || b.joiningDate)) - (toMs(a.updatedAt) || toMs(a.startDate || a.joiningDate)))[0];
      if (String(latest?.employeeStatus || '').trim().toLowerCase() === 'terminated') {
        return Response.json(
          { error: 'Your account is locked because your employment status is Terminated.' },
          { status: 403 }
        );
      }
    }

    const token = await adminAuth().createCustomToken(uid, { role, employeeId: role === 'employee' ? uid : null });

    const user =
      role === 'admin'
        ? {
            id: uid,
            name: data.name || '',
            email: data.email || '',
            mobile: data.mobile || '',
            active: Boolean(data.active),
            isAdmin: true,
            userType: 'admin',
          }
        : {
            id: uid,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            status: data.status || 'inactive',
            employmentStatus: data.employmentStatus || '',
            is_resigned: data.is_resigned === true || data.is_resigned === 'true' || data.is_resigned === 1,
            isEmployee: true,
            isAdmin: false,
            userType: 'employee',
          };

    return Response.json({ token, user });
  } catch (error) {
    console.error('Login failed:', error);
    return Response.json({ error: 'Login is unavailable right now. Please try again.' }, { status: 500 });
  }
}

export const config = { path: '/api/auth/login' };
