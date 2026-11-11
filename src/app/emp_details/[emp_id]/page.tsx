
import { useEffect, useMemo, useState } from 'react';
import { useParams } from '@/lib/navigation';

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
        // Server returns only name / employment id / company; the browser can't read employee records.
        const res = await fetch(`/api/emp-details/${encodeURIComponent(empIdFromUrl)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json?.error || 'Employee details not found.');
          return;
        }
        setDetails(json as PublicEmployeeDetails);
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
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
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

