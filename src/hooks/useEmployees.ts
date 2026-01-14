import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getEmployee, addEmployee, updateEmployee, deleteEmployee } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { Employee } from '@/types';
import { getQueryClient } from '@/lib/queryClient';

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

// Employee mutations
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      // Invalidate all employee lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      // Also invalidate dashboard stats since employee count changed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
    },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
    },
  });
};

// Optimistic updates for better UX
export const useOptimisticEmployeeUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      updateEmployee(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.employees.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.employees.lists() });
      
      // Snapshot the previous value
      const previousEmployee = queryClient.getQueryData(queryKeys.employees.detail(id));
      const previousEmployees = queryClient.getQueryData(queryKeys.employees.lists());
      
      // Optimistically update the cache
      if (previousEmployee) {
        queryClient.setQueryData(queryKeys.employees.detail(id), {
          ...previousEmployee,
          ...data,
        });
      }
      
      if (previousEmployees) {
        queryClient.setQueryData(queryKeys.employees.lists(), (old: any) => {
          if (!old) return old;
          return old.map((employee: Employee) =>
            employee.id === id ? { ...employee, ...data } : employee
          );
        });
      }
      
      return { previousEmployee, previousEmployees };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousEmployee) {
        queryClient.setQueryData(queryKeys.employees.detail(id), context.previousEmployee);
      }
      if (context?.previousEmployees) {
        queryClient.setQueryData(queryKeys.employees.lists(), context.previousEmployees);
      }
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
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

export const useEmployeeSelfEmployment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.selfEmployment(id),
    queryFn: () => getEmployeeSelfEmployment(id),
    enabled: !!id,
  });
}; 