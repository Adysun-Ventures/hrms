import React, { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { EmployeeIdCardData } from './IdCardFront';

type Props = {
  data: EmployeeIdCardData;
  publicBaseUrl?: string;
};

const IdCardBack = forwardRef<HTMLDivElement, Props>(({ data, publicBaseUrl = 'http://hrms.adysunventures.com' }, ref) => {
  const qrValue = `${publicBaseUrl}/emp_details/${encodeURIComponent(data.employeeId || '')}`;

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

      <div className="relative z-10 mt-24 px-5">
        <h3 className="text-base font-semibold text-gray-900">Terms & Conditions</h3>
        <ul className="mt-2 list-disc pl-5 text-xs text-gray-700 space-y-1">
          <li>This card is property of the company.</li>
          <li>Carry this card during office hours.</li>
          <li>Return this card on exit/termination.</li>
        </ul>

        <div className="mt-4 rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-800">Contact Info</p>
          <p className="mt-2 text-xs text-gray-700">{data.companyName || '-'}</p>
          <p className="text-xs text-gray-700">{data.phone || '-'}</p>
          <p className="text-xs text-gray-700">{data.website || '-'}</p>
          <p className="text-xs text-gray-700">{data.address || '-'}</p>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="rounded-md border border-gray-200 bg-white p-2">
            <QRCodeCanvas value={qrValue} size={110} includeMargin />
          </div>
          <p className="mt-2 text-[11px] text-gray-500 text-center break-all">
            {qrValue}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-red-600" />
    </div>
  );
});

IdCardBack.displayName = 'IdCardBack';

export default IdCardBack;

