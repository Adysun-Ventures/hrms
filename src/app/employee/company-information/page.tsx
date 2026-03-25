'use client';

import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeSelfEmployment } from '@/hooks/useEmployees';
import { FiArrowLeft } from 'react-icons/fi';

export default function EmployeeCompanyInformationPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();

  // Used for "Designation" in the Contact Reference section.
  const employeeId = currentUserData?.id || '';
  const { data: employmentData } = useEmployeeSelfEmployment(employeeId);

  const primaryEmployment = employmentData?.[0];

  // Static company info currently used across the app.
  const company = {
    name: 'Adysun Ventures Pvt. Ltd.',
    website: 'adysunventures.com',
    mobile: '9579537523',
    email: 'info@adysunventures.com',
    establishmentDate: '-', // Not available in codebase as a structured field yet.
    cin: 'U72900PN2020PTC196380',
    hrName: 'Prachi Jadhav',
    hrEmail: 'hr@adysunventures.com',
    puneAddress: `Adysun Ventures Pvt. Ltd.
Workplex, S no 47, Near Bhapkar Petrol Pump, Pune, Maharashtra - 411009`,
    mumbaiAddress: `Adysun Ventures Pvt. Ltd.
A2, 704, Kanchanpushp Society Kavesar, Thane West, Thane, Maharashtra - 400607`,
  };

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Company Information', isCurrent: true },
      ]}
    >
      <div className="pt-6 md:pt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="grid grid-cols-[auto_1fr_auto] items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </button>

              <h1 className="text-center text-2xl font-bold text-gray-800">Company Information</h1>

              {/* Keeps title centered without shifting */}
              <div />
            </div>
          </div>

          <div className="px-6 py-6 space-y-10">
            {/* Section 1: Company Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.name}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Company Name</p>
                </div>

                <div className="flex flex-col">
                  <a
                    href={`https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="order-1 text-lg font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    {company.website}
                  </a>
                  <p className="order-2 text-sm text-gray-500 mb-1">Website</p>
                </div>

                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.mobile}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Mobile No</p>
                </div>

                <div className="flex flex-col">
                  <a
                    href={`mailto:${company.email}`}
                    className="order-1 text-lg font-medium text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {company.email}
                  </a>
                  <p className="order-2 text-sm text-gray-500 mb-1">Email id</p>
                </div>

                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.establishmentDate}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Establishment Date</p>
                </div>

                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.cin}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">CIN</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200" />

            {/* Section 2: HR */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-green-500 pl-2">
                HR
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.hrName}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Name</p>
                </div>
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{company.mobile}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Mobile No</p>
                </div>
                <div className="flex flex-col">
                  <a
                    href={`mailto:${company.hrEmail}`}
                    className="order-1 text-lg font-medium text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {company.hrEmail}
                  </a>
                  <p className="order-2 text-sm text-gray-500 mb-1">Email</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200" />

            {/* Section 3: Company Address */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">
                Company Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <address className="order-1 not-italic text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {company.puneAddress}
                  </address>
                  <p className="order-2 font-semibold text-gray-900 mb-3">Pune Office (Head Office)</p>
                </div>

                <div className="flex flex-col">
                  <address className="order-1 not-italic text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {company.mumbaiAddress}
                  </address>
                  <p className="order-2 font-semibold text-gray-900 mb-3">Mumbai Office</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200" />

            {/* Section 4: Contact Reference */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-orange-500 pl-2">
                Contact Reference
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{currentUserData?.name || '-'}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Name</p>
                </div>
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{currentUserData?.id || '-'}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Employee id</p>
                </div>
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">{currentUserData?.email || '-'}</p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Email</p>
                </div>
                <div className="flex flex-col">
                  <p className="order-1 text-lg font-medium text-gray-900">
                    {primaryEmployment?.jobTitle || primaryEmployment?.designation || '-'}
                  </p>
                  <p className="order-2 text-sm text-gray-500 mb-1">Designation</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
