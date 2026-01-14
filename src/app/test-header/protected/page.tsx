'use client';

import EmployeeLayout from '@/components/layout/EmployeeLayout';

export default function TestProtectedHeaderPage() {
  return (
    <EmployeeLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-6">Protected Header Test</h1>
        <p className="text-lg mb-4">
          This page is using the EmployeeLayout with a solid white background header.
        </p>
        <p className="mb-6">
          Notice how the header maintains consistent text visibility regardless of the content below it.
        </p>
        
        <div className="mt-8 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-3">Section {i + 1}</h2>
              <p className="text-gray-700">
                This is an example of content in a protected route. The header above has a solid white 
                background to ensure text visibility and consistency across the admin/employee sections.
              </p>
            </div>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
}
