import React from 'react';

const TestBreadcrumbPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Test Breadcrumb Page</h1>
      <p className="text-gray-600">
        This page demonstrates the dynamic breadcrumb functionality. 
        The breadcrumb above should show: Home / Test Breadcrumb
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Breadcrumb Features:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>✅ Dynamic construction from file-based routing</li>
          <li>✅ Automatic path parsing and label generation</li>
          <li>✅ Proper navigation with Next.js Link component</li>
          <li>✅ Accessible with proper ARIA attributes</li>
          <li>✅ Responsive design with Tailwind CSS</li>
          <li>✅ Optional display with show prop</li>
        </ul>
      </div>
    </div>
  );
};

export default TestBreadcrumbPage; 