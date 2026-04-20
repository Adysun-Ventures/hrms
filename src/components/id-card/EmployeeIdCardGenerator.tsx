import React, { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import EmployeeForm from './EmployeeForm';
import IdCardFront, { type EmployeeIdCardData } from './IdCardFront';
import IdCardBack from './IdCardBack';

type Props = {
  initialData?: Partial<EmployeeIdCardData>;
};

const defaultData: EmployeeIdCardData = {
  name: '',
  employeeId: '',
  companyName: 'Adysun Ventures Pvt Ltd',
  position: '',
  phone: '',
  joinDate: '',
  profileImage: '',
  companyLogo: '',
  address: 'Pune, India',
  website: 'www.adysunventures.com',
};

export async function waitForImages(node: HTMLElement) {
  const images = node.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          })
    )
  );
}

export function handleImageUpload(
  file: File,
  setState: React.Dispatch<React.SetStateAction<EmployeeIdCardData>>,
  field: 'profileImage' | 'companyLogo'
) {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = String(reader.result || '');
    setState((prev) => ({ ...prev, [field]: base64 }));
  };
  reader.readAsDataURL(file);
}

export default function EmployeeIdCardGenerator({ initialData }: Props) {
  const [employeeData, setEmployeeData] = useState<EmployeeIdCardData>({
    ...defaultData,
    ...initialData,
  });

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const mergedData = useMemo(() => employeeData, [employeeData]);

  const setField = (field: keyof EmployeeIdCardData, value: string) => {
    setEmployeeData((prev) => ({ ...prev, [field]: value }));
  };

  const onUploadImage = (file: File, field: 'profileImage' | 'companyLogo') => {
    handleImageUpload(file, setEmployeeData, field);
  };

  const downloadCards = async () => {
    try {
      if (!frontRef.current || !backRef.current) return;
      setIsDownloading(true);

      await waitForImages(frontRef.current);
      await waitForImages(backRef.current);

      const frontPng = await toPng(frontRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const backPng = await toPng(backRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });

      const triggerDownload = (href: string, filename: string) => {
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      const safeId = (mergedData.employeeId || 'employee-id').replace(/[^A-Za-z0-9_-]/g, '');
      triggerDownload(frontPng, `${safeId}-front.png`);
      triggerDownload(backPng, `${safeId}-back.png`);
    } catch (error) {
      console.error('Failed to export ID cards:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Employee ID Card Generator</h3>
        <button
          type="button"
          onClick={downloadCards}
          disabled={isDownloading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? 'Downloading...' : 'Download Front + Back (PNG)'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <EmployeeForm data={mergedData} onChange={setField} onUploadImage={onUploadImage} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IdCardFront ref={frontRef} data={mergedData} />
          <IdCardBack ref={backRef} data={mergedData} />
        </div>
      </div>
    </div>
  );
}

