import React from 'react';
import type { EmployeeIdCardData } from './IdCardFront';

type Props = {
  data: EmployeeIdCardData;
  onChange: (field: keyof EmployeeIdCardData, value: string) => void;
  onUploadImage: (file: File, field: 'profileImage' | 'companyLogo') => void;
};

const textInputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function EmployeeForm({ data, onChange, onUploadImage }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className={textInputClass} value={data.name} onChange={(e) => onChange('name', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input className={textInputClass} value={data.employeeId} onChange={(e) => onChange('employeeId', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input className={textInputClass} value={data.companyName} onChange={(e) => onChange('companyName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input className={textInputClass} value={data.position} onChange={(e) => onChange('position', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input className={textInputClass} value={data.phone} onChange={(e) => onChange('phone', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
          <input type="date" className={textInputClass} value={data.joinDate} onChange={(e) => onChange('joinDate', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input className={textInputClass} value={data.address} onChange={(e) => onChange('address', e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input className={textInputClass} value={data.website} onChange={(e) => onChange('website', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            className={textInputClass}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file, 'profileImage');
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
          <input
            type="file"
            accept="image/*"
            className={textInputClass}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file, 'companyLogo');
            }}
          />
        </div>
      </div>
    </div>
  );
}

