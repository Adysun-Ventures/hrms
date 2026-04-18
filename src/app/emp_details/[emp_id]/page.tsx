'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

type PublicEmployeeDetails = {
  name: string;
  employmentId: string;
  companyName: string;
};

export default function PublicEmployeeDetailsPage() {
  const params = useParams<{ emp_id: string }>();
  const empIdFromUrl = useMemo(() => decodeURIComponent(params?.emp_id || '').trim(), [params?.emp_id]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<PublicEmployeeDetails | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!empIdFromUrl) {
        setError('Invalid employee id in URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setDetails(null);

      try {
        let employmentDoc: any = null;
        let employmentData: any = null;
        let employeeDoc: any = null;
        let employeeData: any = null;

        // 1) Try employee lookup by public employeeId (e.g. ADV979)
        const employeeQ = query(collection(db, 'employees'), where('employeeId', '==', empIdFromUrl));
        const employeeSnap = await getDocs(employeeQ);
        if (!employeeSnap.empty) {
          employeeDoc = employeeSnap.docs[0];
          employeeData = employeeDoc.data();

          // Find latest employment for this employee doc id.
          const empDocId = employeeDoc.id;
          const employmentByEmployeeQ = query(
            collection(db, 'employments'),
            where('employeeId', '==', empDocId)
          );
          const employmentByEmployeeSnap = await getDocs(employmentByEmployeeQ);
          if (!employmentByEmployeeSnap.empty) {
            employmentDoc = employmentByEmployeeSnap.docs[0];
            employmentData = employmentDoc.data();
          }
        }

        // 2) Lookup by employmentId (e.g. EMPLOY001)
        const employmentQ = query(
          collection(db, 'employments'),
          where('employmentId', '==', empIdFromUrl)
        );
        const employmentSnap = await getDocs(employmentQ);

        if (!employmentSnap.empty && !employmentData) {
          employmentDoc = employmentSnap.docs[0];
          employmentData = employmentDoc.data();
        } else if (!employmentData) {
          // 3) Fallback: route param might be Firestore employment document id
          const byDocId = await getDoc(doc(db, 'employments', empIdFromUrl));
          if (byDocId.exists()) {
            employmentDoc = byDocId;
            employmentData = byDocId.data();
          }
        }

        if (!employmentData) {
          setError('Employee details not found.');
          return;
        }

        const employeeDocId = String(employmentData?.employeeId || employeeDoc?.id || '').trim();
        let employeeName = '';
        let employeeCompany = '';

        if (employeeData) {
          employeeName = String(employeeData?.name || '').trim();
          employeeCompany = String(employeeData?.companyName || '').trim();
        } else if (employeeDocId) {
          const empDoc = await getDoc(doc(db, 'employees', employeeDocId));
          if (empDoc.exists()) {
            const empData: any = empDoc.data();
            employeeName = String(empData?.name || '').trim();
            employeeCompany = String(empData?.companyName || '').trim();
          }
        }

        setDetails({
          name: employeeName || String(employmentData?.employeeName || 'Unknown Employee'),
          employmentId:
            String(employmentData?.employmentId || employmentDoc?.id || empIdFromUrl).trim(),
          companyName:
            String(
              employmentData?.companyName ||
              employeeCompany ||
              'Adysun Ventures Pvt. Ltd.'
            ).trim(),
        });
      } catch (e) {
        console.error('Failed to load public employee details:', e);
        setError('Failed to load employee details.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [empIdFromUrl]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Employee Details</h1>
        <p className="mt-1 text-sm text-gray-500">Public view</p>

        {isLoading && <p className="mt-6 text-sm text-gray-600">Loading...</p>}

        {!isLoading && error && (
          <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {!isLoading && !error && details && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{details.name}</p>
              <p className="text-xs text-gray-500">Name</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{details.employmentId}</p>
              <p className="text-xs text-gray-500">Employment ID</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{details.companyName}</p>
              <p className="text-xs text-gray-500">Company Name</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

