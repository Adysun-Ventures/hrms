import type { DocumentRole, DocumentTemplate } from '@/templates/documents';
import { DOCUMENT_TEMPLATES } from '@/templates/documents';

export function getDocumentTemplatesForRole(role: DocumentRole): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.roles.includes(role));
}

