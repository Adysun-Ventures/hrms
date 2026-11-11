import { Navigate } from 'react-router-dom';
import { useParams } from '@/lib/navigation';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

// One route for every employee document: a single page bundle, so opening any card
// after the first doesn't rebuild/download a separate route.
const DOCS: Record<string, { type: string; title: string }> = {
  'offer-letter': { type: 'v2/offer-letter', title: 'Offer Letter' },
  'appointment-letter': { type: 'v2/appointment-letter', title: 'Appointment Letter' },
  'resignation-mail': { type: 'v2/resignation-mail', title: 'Resignation Mail' },
  'lwd-confirmation-mail': { type: 'v2/lwd-confirmation-mail', title: 'LWD Confirmation Mail' },
  'salary-slips': { type: 'v2/salary-slip', title: 'Salary Slip' },
  'relieving-letter': { type: 'v2/relieving-letter', title: 'Relieving Letter' },
  'increment-letter': { type: 'v2/increment-letter', title: 'Increment Letter' },
  'experience-letter': { type: 'v2/experience-letter', title: 'Experience Letter' },
  'fnf-certificate': { type: 'v2/fnf-certificate', title: 'FNF Certificate' },
  'form-16': { type: 'v2/form-16', title: 'Form 16' },
};

export default function EmployeeDocumentPage() {
  const doc = useParams<{ doc: string }>()?.doc ?? '';
  const entry = DOCS[doc];
  if (!entry) return <Navigate to="/" replace />;

  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType={entry.type}
      title={entry.title}
      description={`Generate and download your ${entry.title.toLowerCase()}`}
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: entry.title, isCurrent: true },
      ]}
    />
  );
}
