import React, { forwardRef } from 'react';

export type EmployeeIdCardData = {
  name: string;
  employeeId: string;
  companyName: string;
  position: string;
  phone: string;
  joinDate: string;
  address: string;
  website: string;
  profileImage: string;
  companyLogo: string;
};

type Props = {
  data: EmployeeIdCardData;
};

const splitLastName = (fullName: string) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: fullName || '', last: '' };
  return {
    first: parts.slice(0, -1).join(' '),
    last: parts[parts.length - 1],
  };
};

const IdCardFront = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { first, last } = splitLastName(data.name);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      style={{ width: 340, height: 540 }}
    >
      <div className="h-20 bg-slate-900 px-4 py-3 text-white flex items-center gap-3">
        {data.companyLogo ? (
          <img src={data.companyLogo} alt="Company logo" className="h-10 w-10 rounded-md object-cover bg-white" />
        ) : (
          <div className="h-10 w-10 rounded-md bg-white/20" />
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-300">Company</p>
          <p className="text-sm font-semibold truncate">{data.companyName || 'Company Name'}</p>
        </div>
      </div>

      {/* Red V shape */}
      <div className="absolute top-20 left-0 right-0 h-0">
        <div className="mx-auto w-0 h-0 border-l-[170px] border-r-[170px] border-t-[85px] border-l-transparent border-r-transparent border-t-red-600" />
      </div>

      <div className="relative z-10 mt-24 flex flex-col items-center px-5">
        <div className="h-28 w-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
          {data.profileImage ? (
            <img src={data.profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">Avatar</div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-gray-900">
            {first} {last ? <span className="text-red-600">{last}</span> : null}
          </p>
          <p className="text-sm text-gray-600">{data.position || 'Position'}</p>
        </div>

        <div className="mt-6 w-full space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Employee ID</span>
            <span className="font-medium text-gray-900">{data.employeeId || '-'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Join Date</span>
            <span className="font-medium text-gray-900">{data.joinDate || '-'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-gray-900">{data.phone || '-'}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-red-600" />
    </div>
  );
});

IdCardFront.displayName = 'IdCardFront';

export default IdCardFront;

