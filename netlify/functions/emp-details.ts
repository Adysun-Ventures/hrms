import { adminDb } from '../lib/firebaseAdmin';

/**
 * Public ID-card QR lookup. Returns only what the card's verification page shows:
 * name, employment id, company. `id` may be an employee code (ADV979), an employment
 * code (EMPLOY001) or an employment document id.
 */
export default async function handler(req: Request, context: { params: Record<string, string> }) {
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const id = decodeURIComponent(context.params.id || '').trim();
  if (!id) return Response.json({ error: 'Invalid employee id in URL.' }, { status: 400 });

  try {
    const db = adminDb();
    let employee: FirebaseFirestore.DocumentSnapshot | undefined;
    let employment: FirebaseFirestore.DocumentSnapshot | undefined;

    const empByCode = await db.collection('employees').where('employeeId', '==', id).limit(1).get();
    if (!empByCode.empty) {
      employee = empByCode.docs[0];
      const e = await db.collection('employments').where('employeeId', '==', employee.id).limit(1).get();
      employment = e.docs[0];
    }
    if (!employment) {
      const e = await db.collection('employments').where('employmentId', '==', id).limit(1).get();
      employment = e.docs[0];
    }
    if (!employment) {
      const byDocId = await db.collection('employments').doc(id).get();
      if (byDocId.exists) employment = byDocId;
    }
    if (!employment) return Response.json({ error: 'Employee details not found.' }, { status: 404 });

    const emp = employment.data() || {};
    if (!employee && emp.employeeId) {
      const e = await db.collection('employees').doc(String(emp.employeeId)).get();
      if (e.exists) employee = e;
    }
    const person = employee?.data() || {};

    return Response.json({
      name: String(person.name || emp.employeeName || 'Unknown Employee').trim(),
      employmentId: String(emp.employmentId || employment.id || id).trim(),
      companyName: String(emp.companyName || person.companyName || 'Adysun Ventures Pvt. Ltd.').trim(),
    });
  } catch (e) {
    console.error('emp-details lookup failed:', e);
    return Response.json({ error: 'Failed to load employee details.' }, { status: 500 });
  }
}

export const config = { path: '/api/emp-details/:id' };
