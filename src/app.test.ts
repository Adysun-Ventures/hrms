import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { dirOf, toRoutePath } from '@/lib/routes';
import { isProtected } from '@/components/auth/SessionGate';
import { isExternal } from '@/lib/link';
import { trimTrailingSlash } from '@/lib/navigation';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const srcFiles = walk('src').filter((f) => /\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f));
const pageKeys = srcFiles.filter((f) => /\/page\.(tsx|jsx)$/.test(f)).map((f) => `./${relative('src', f)}`);

describe('route table (same keys main.tsx gets from import.meta.glob)', () => {
  const paths = pageKeys.map((k) => toRoutePath(dirOf(k)));

  it('maps folders to router paths', () => {
    expect(toRoutePath(dirOf('./app/page.tsx'))).toBe('/');
    expect(toRoutePath(dirOf('./app/employees/[id]/edit/page.tsx'))).toBe('/employees/:id/edit');
    expect(toRoutePath(dirOf('./app/emp_details/[emp_id]/page.tsx'))).toBe('/emp_details/:emp_id');
  });

  it('gives every page a unique path', () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has the 40 screens kept after the 2026-11-11 cleanup', () => {
    expect(paths.length).toBe(40);
    for (const p of ['/login', '/dashboard', '/employee-dashboard', '/employees/:id', '/employments/:id/edit', '/salaries/:id/edit', '/employee/documents/:doc', '/emp_details/:emp_id']) {
      expect(paths).toContain(p);
    }
  });
});

describe('no Next.js left', () => {
  it('no source file imports next/*, uses server-only, or styled-jsx', () => {
    const offenders = srcFiles.filter((f) => /from ['"]next(\/|['"])|['"]server-only['"]|<style jsx/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('no page reads params as a promise prop', () => {
    const offenders = pageKeys.filter((k) => /use\(params\)|await params/.test(readFileSync(join('src', k), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('session gate (was middleware.ts)', () => {
  it('protects the same routes', () => {
    for (const p of ['/dashboard', '/employees/x', '/employments', '/salaries/1', '/profile', '/employee-dashboard', '/employee/leaves', '/calculator'])
      expect(isProtected(p), p).toBe(true);
  });
  it('leaves public routes open', () => {
    for (const p of ['/login', '/', '/employee', '/emp_details/ADV001']) expect(isProtected(p), p).toBe(false);
  });
});

describe('Link / navigation helpers', () => {
  it('sends only external hrefs to a plain <a>', () => {
    for (const h of ['https://adysunventures.com', 'mailto:hr@x.com', 'tel:+911', '//cdn.x', '#top']) expect(isExternal(h), h).toBe(true);
    for (const h of ['/dashboard', '/employees/1?tab=a', 'relative']) expect(isExternal(h), h).toBe(false);
  });
  it('drops trailing slashes like Next usePathname', () => {
    expect(trimTrailingSlash('/employees/')).toBe('/employees');
    expect(trimTrailingSlash('/employees')).toBe('/employees');
    expect(trimTrailingSlash('/')).toBe('/');
  });
});
