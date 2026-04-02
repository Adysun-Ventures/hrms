'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getDocumentTemplatesForRole } from '@/utils/document';
import type { DocumentRole } from '@/templates/documents';

export default function CommonDocumentGenerator({ role }: { role: DocumentRole }) {
  const { currentUserData } = useAuth();

  const templates = useMemo(() => getDocumentTemplatesForRole(role), [role]);

  // For employees, pass employeeId context (optional; templates may ignore it today)
  const decorateHref = (href: string) => {
    if (role !== 'employee') return href;
    const employeeId = currentUserData?.userType === 'employee' ? currentUserData.id : '';
    if (!employeeId) return href;
    const join = href.includes('?') ? '&' : '?';
    return `${href}${join}employeeId=${encodeURIComponent(employeeId)}`;
  };

  const resolveHref = (adminHref: string, employeeHref: string) => {
    const base = role === 'admin' ? adminHref : employeeHref;
    return decorateHref(base);
  };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((doc) => (
          <Link
            key={doc.key}
            href={resolveHref(doc.adminHref, doc.employeeHref)}
            className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
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

