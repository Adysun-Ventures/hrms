import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSalaries, getSalary, addSalary, updateSalary, deleteSalary, getSalariesByEmployee } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { Salary } from '@/types';
import { getQueryClient } from '@/lib/queryClient';

// Salary hooks
export const useSalaries = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.salaries.list(filters),
    queryFn: getSalaries,
  });
};

export const useSalary = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salaries.detail(id),
    queryFn: () => getSalary(id),
    enabled: !!id,
  });
};

export const useSalariesByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.salaries.byEmployee(employeeId),
    queryFn: () => getSalariesByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

// Salary mutations
export const useCreateSalary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addSalary,
    onSuccess: async (_, variables) => {
      console.log('✅ Salary created successfully, invalidating cache...');
      
      // Invalidate all salary-related queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.salaries.lists() });
      
      // If salary is created for a specific employee, invalidate employee-specific cache
      if (variables.employeeId) {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.salaries.byEmployee(variables.employeeId) 
        });
        console.log('✅ Invalidated employee-specific salary cache for:', variables.employeeId);
      }
      
      // Invalidate employee cache to refresh employee data
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      if (variables.employeeId) {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.employees.detail(variables.employeeId) 
        });
      }
      
      console.log('✅ Cache invalidation completed');
    },
    onError: (error) => {
      console.error('❌ Error creating salary:', error);
    },
  });
};

export const useUpdateSalary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Salary> }) =>
      updateSalary(id, data),
    onSuccess: (_, { id, data }) => {
      // Invalidate specific salary detail
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.detail(id) });
      // Invalidate all salary lists
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.lists() });
      
      // If salary is updated for a specific employee, invalidate employee-specific cache
      if (data.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.salaries.byEmployee(data.employeeId) 
        });
      }
      
      // Invalidate employee cache to refresh employee data
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      if (data.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.employees.detail(data.employeeId) 
        });
      }
    },
    onError: (error) => {
      console.error('Error updating salary:', error);
    },
  });
};

export const useDeleteSalary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSalary,
    onSuccess: (_, deletedSalaryId) => {
      // Invalidate all salary lists
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.lists() });
      
      // Get the deleted salary to invalidate employee-specific cache
      const deletedSalary = queryClient.getQueryData(queryKeys.salaries.detail(deletedSalaryId));
      if (deletedSalary && (deletedSalary as Salary).employeeId) {
        const employeeId = (deletedSalary as Salary).employeeId;
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.salaries.byEmployee(employeeId) 
        });
        
        // Invalidate employee cache to refresh employee data
        queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.employees.detail(employeeId) 
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting salary:', error);
    },
  });
};

// Optimistic updates for better UX
export const useOptimisticSalaryUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Salary> }) =>
      updateSalary(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.salaries.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.salaries.lists() });
      
      // Snapshot the previous value
      const previousSalary = queryClient.getQueryData(queryKeys.salaries.detail(id));
      const previousSalaries = queryClient.getQueryData(queryKeys.salaries.lists());
      
      // Optimistically update the cache
      if (previousSalary) {
        queryClient.setQueryData(queryKeys.salaries.detail(id), {
          ...previousSalary,
          ...data,
        });
      }
      
      if (previousSalaries) {
        queryClient.setQueryData(queryKeys.salaries.lists(), (old: any) => {
          if (!old) return old;
          return old.map((salary: Salary) =>
            salary.id === id ? { ...salary, ...data } : salary
          );
        });
      }
      
      return { previousSalary, previousSalaries };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSalary) {
        queryClient.setQueryData(queryKeys.salaries.detail(variables.id), context.previousSalary);
      }
      if (context?.previousSalaries) {
        queryClient.setQueryData(queryKeys.salaries.lists(), context.previousSalaries);
      }
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.lists() });
    },
  });
}; 