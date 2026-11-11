import { auth } from '@/firebase/config';

/** POST JSON to one of our /api routes, sending the signed-in user's Firebase ID token. */
export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

/** True when the Firebase session carries the admin claim (admins may read Firestore directly). */
export const isAdminSession = async () => (await auth.currentUser?.getIdTokenResult())?.claims.role === 'admin';
