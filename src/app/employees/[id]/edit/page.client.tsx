'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getEmployee, updateEmployee } from '@/utils/firebaseUtils';
import { Employee } from '@/types';
import { use } from 'react';

// Define API error type
type ApiError = Error | unknown;

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function EditEmployeePageContent({ params }: PageParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { id } = use(params);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Omit<Employee, 'id'>>();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const employeeData = await getEmployee(id);
        // Reset form with all employee data except id
        const { id: _, ...rest } = employeeData;
        reset(rest);
      } catch (error: ApiError) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employee data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, reset]);

  const onSubmit = async (data: Omit<Employee, 'id'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateEmployee(id, data);
      router.push(`/employees/${id}`);
    } catch (error: ApiError) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading employee data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center">
        <Link href={`/employees/${id}`} className="text-blue-600 hover:underline flex items-center gap-1 mr-4">
          <FiArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Edit Employee</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form fields go here - copied from original component */}
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
            >
              <FiSave size={16} /> {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 