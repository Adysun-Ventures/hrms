'use client';

import EmployeeLayout from '@/components/layout/EmployeeLayout';

export default function EmployeeCompanyInformationPage() {
  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Company Information', isCurrent: true },
      ]}
    >
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Company Information</h1>
          </div>

          <div className="px-6 py-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="text-lg font-medium text-gray-900">Adysun Ventures Pvt. Ltd.</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a
                  href="https://adysunventures.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  adysunventures.com
                </a>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Email</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                    <p className="text-sm text-gray-500 mb-1">General Inquiries</p>
                    <a
                      href="mailto:info@adysunventures.com"
                      className="text-lg font-medium text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      info@adysunventures.com
                    </a>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                    <p className="text-sm text-gray-500 mb-1">HR &amp; Recruitment</p>
                    <a
                      href="mailto:hr@adysunventures.com"
                      className="text-lg font-medium text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      hr@adysunventures.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Location</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-gray-200 p-5 bg-gray-50/50">
                  <p className="font-semibold text-gray-900 mb-3">Pune Office (Head Office)</p>
                  <address className="not-italic text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {`Adysun Ventures Pvt. Ltd.
Workplex, S no 47,
Near Bhapkar Petrol Pump,
Pune, Maharashtra - 411009`}
                  </address>
                </div>

                <div className="rounded-lg border border-gray-200 p-5 bg-gray-50/50">
                  <p className="font-semibold text-gray-900 mb-3">Thane Office (Mumbai Division)</p>
                  <address className="not-italic text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {`Adysun Ventures Pvt. Ltd.
A2, 704, Kanchanpushp Society
Kavesar, Thane West,
Thane, Maharashtra - 400607`}
                  </address>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
