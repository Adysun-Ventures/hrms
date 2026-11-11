import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { DocumentRole, DocumentTemplate } from '@/templates/documents';
import { DOCUMENT_TEMPLATES } from '@/templates/documents';

export function getDocumentTemplatesForRole(role: DocumentRole): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.roles.includes(role));
}


/**
 * Employees a document generator may pick from.
 * Logged-in employee → only their own record (single doc read); admin → everyone.
 */
export async function fetchDocEmployees(selfEmployeeId?: string | null): Promise<any[]> {
  if (selfEmployeeId) {
    const snap = await getDoc(doc(db, 'employees', selfEmployeeId));
    return snap.exists() ? [{ ...snap.data(), id: snap.id }] : [];
  }
  const qs = await getDocs(collection(db, 'employees'));
  return qs.docs.map((d) => ({ ...d.data(), id: d.id }));
}
