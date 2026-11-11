
import { useEffect } from 'react';
import Link from '@/lib/link';
import { getDocumentTemplatesForRole } from '@/utils/document';
import type { DocumentRole } from '@/templates/documents';

export default function CommonDocumentGenerator({ role }: { role: DocumentRole }) {
  const templates = getDocumentTemplatesForRole(role);
  const hrefs = templates.map((t) => (role === 'admin' ? t.adminHref : t.employeeHref));

  // Dev only: `next dev` builds a route on first visit, which made the first card click slow.
  // Request each card route in the background (one at a time) so it's built before the click.
  // Production builds every route ahead of time and <Link> prefetches, so nothing to do there.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    (async () => {
      for (const href of Array.from(new Set(hrefs))) {
        if (cancelled) return;
        await fetch(href, { credentials: 'same-origin' }).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <div className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {templates.map((doc, i) => (
          <Link
            key={doc.key}
            href={hrefs[i]}
            className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md border border-gray-100"
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-3">{doc.icon}</div>
              <h2 className="text-lg font-semibold text-slate-800">{doc.title}</h2>
            </div>
            <p className="text-slate-800 text-sm">{doc.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
