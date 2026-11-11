import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';

/** Admin dashboard stat: the employee count (shares the employees list cache). */
export const useEmployeeCount = () => {
  const { data: employees = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.employees.list(),
    queryFn: getEmployees,
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    notifyOnChangeProps: ['data', 'error'], // Silent background updates
  });

  return { employeeCount: employees.length, isLoading, isError, error: error as Error | null, refetch };
};
