import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployments, getEmployment, addEmployment, updateEmployment, deleteEmployment, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { Employment } from '@/types';

// Employment hooks
export const useEmployments = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.employments.list(filters),
    queryFn: getEmployments,
  });
};

export const useEmployment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employments.detail(id),
    queryFn: () => getEmployment(id),
    enabled: !!id,
  });
};

export const useEmploymentsByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.employments.byEmployee(employeeId),
    queryFn: () => getEmploymentsByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

// Employment mutations
export const useCreateEmployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addEmployment,
    onSuccess: (newEmployment) => {
      // Invalidate all employment lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
      // Invalidate employee-specific employments if we have employeeId
      if (newEmployment.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.employments.byEmployee(newEmployment.employeeId) 
        });
      }
      // Also invalidate dashboard stats since employment count changed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onError: (error) => {
      console.error('Error creating employment:', error);
    },
  });
};

export const useUpdateEmployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employment> }) =>
      updateEmployment(id, data),
    onSuccess: (_, { id, data }) => {
      // Invalidate specific employment detail
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.detail(id) });
      // Invalidate all employment lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
      // Invalidate employee-specific employments if employeeId changed
      if (data.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.employments.byEmployee(data.employeeId) 
        });
      }
    },
    onError: (error) => {
      console.error('Error updating employment:', error);
    },
  });
};

export const useDeleteEmployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployment,
    onSuccess: () => {
      // Invalidate all employment lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
      // Also invalidate dashboard stats since employment count changed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onError: (error) => {
      console.error('Error deleting employment:', error);
    },
  });
};

// Optimistic updates for better UX
export const useOptimisticEmploymentUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employment> }) =>
      updateEmployment(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.employments.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.employments.lists() });
      
      // Snapshot the previous value
      const previousEmployment = queryClient.getQueryData(queryKeys.employments.detail(id));
      const previousEmployments = queryClient.getQueryData(queryKeys.employments.lists());
      
      // Optimistically update the cache
      if (previousEmployment) {
        queryClient.setQueryData(queryKeys.employments.detail(id), {
          ...previousEmployment,
          ...data,
        });
      }
      
      if (previousEmployments) {
        queryClient.setQueryData(queryKeys.employments.lists(), (old: any) => {
          if (!old) return old;
          return old.map((employment: Employment) =>
            employment.id === id ? { ...employment, ...data } : employment
          );
        });
      }
      
      return { previousEmployment, previousEmployments };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousEmployment) {
        queryClient.setQueryData(queryKeys.employments.detail(id), context.previousEmployment);
      }
      if (context?.previousEmployments) {
        queryClient.setQueryData(queryKeys.employments.lists(), context.previousEmployments);
      }
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
    },
  });
}; 