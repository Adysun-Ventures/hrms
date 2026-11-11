
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import CommonDocumentGenerator from '@/components/document/CommonDocumentGenerator';

export default function EmployeeDocumentsPage() {
  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', isCurrent: true },
      ]}
    >
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-slate-800">My Documents</h1>
        <p className="text-slate-800">Generate and download your HR documents</p>
        <CommonDocumentGenerator role="employee" />
      </div>
    </EmployeeLayout>
  );
}
