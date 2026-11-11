import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { hashPassword, verifyPassword } from './lib/password';
import login from './functions/auth-login';

const post = (body: unknown) =>
  new Request('http://x/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('functions', () => {
  it('each declares a unique /api path', async () => {
    const files = readdirSync('netlify/functions').filter((f) => f.endsWith('.ts'));
    const paths = await Promise.all(files.map(async (f) => (await import(`./functions/${f}`)).config.path as string));
    expect(paths.every((p) => p.startsWith('/api/'))).toBe(true);
    expect(new Set(paths).size).toBe(files.length);
  });

  it('rejects wrong methods with 405', async () => {
    const res = await login(new Request('http://x/api/auth/login'));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });

  it('rejects malformed login input before touching the database', async () => {
    for (const body of [{}, { phone: '123', password: 'x' }, { phone: '9876543210', password: '' }]) {
      const res = await login(post(body));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Invalid mobile number or password.' });
    }
  });
});

describe('password hashing', () => {
  it('verifies the right password only', async () => {
    const h = await hashPassword('s3cret');
    expect(h).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(await verifyPassword('s3cret', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
    expect(await verifyPassword('s3cret', 'plain')).toBe(false);
  });
});
