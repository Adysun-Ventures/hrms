import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getEmployee, updateEmployee, deleteEmployee, getEmployeeSelf } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { Employee } from '@/types';

// Employee hooks
export const useEmployees = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: getEmployees,
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific employee detail
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
      // Invalidate all employee lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      // Invalidate all employee lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      // Also invalidate dashboard stats since employee count changed
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
    },
  });
}; 

// Add these new hooks for employee self-access
export const useEmployeeSelf = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.self(id),
    queryFn: () => getEmployeeSelf(id),
    enabled: !!id,
  });
}; 