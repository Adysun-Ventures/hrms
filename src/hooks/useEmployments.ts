import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployments, getEmployment, deleteEmployment, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';

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

export const useDeleteEmployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployment,
    onSuccess: () => {
      // Invalidate all employment lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
      // Also invalidate dashboard stats since employment count changed
    },
    onError: (error) => {
      console.error('Error deleting employment:', error);
    },
  });
}; 