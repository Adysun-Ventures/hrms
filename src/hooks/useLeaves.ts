import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEmployeeLeaves, 
  updateEmployeeLeaveEndDate,
  createEmployeeLeaveRequest,
  updateEmployeeLeaveRequest,
  cancelEmployeeLeaveRequest
} from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { getQueryClient } from '@/lib/queryClient';

interface LeaveRecord {
  id: string;
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  totalDays: number;
  employmentId?: string;
  employeeId?: string;
  wasEdited?: boolean;
}

interface RawLeaveRecord {
  id: string;
  type?: LeaveRecord['type'];
  startDate: string;
  endDate: string;
  reason?: string;
  status?: LeaveRecord['status'];
  appliedDate: string;
  totalDays?: number;
  employmentId?: string;
  employeeId?: string;
  wasEdited?: boolean;
}

// Transform raw leave data to typed format
const transformLeaveData = (rawData: RawLeaveRecord[]): LeaveRecord[] => {
  return rawData.map((record) => ({
    id: record.id,
    type: (record.type as LeaveRecord['type']) || 'casual',
    startDate: record.startDate,
    endDate: record.endDate,
    reason: record.reason || 'Personal leave',
    status: (record.status as LeaveRecord['status']) || 'pending',
    appliedDate: record.appliedDate,
    totalDays: record.totalDays || 1,
    employmentId: record.employmentId,
    employeeId: record.employeeId,
    wasEdited: record.wasEdited || false,
  }));
};

// Hook to fetch employee leaves with caching
export const useEmployeeLeaves = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.leaves.byEmployee(employeeId),
    queryFn: async () => {
      const rawData = await getEmployeeLeaves(employeeId);
      return transformLeaveData(rawData as RawLeaveRecord[]);
    },
    enabled: !!employeeId,
    staleTime: 1 * 60 * 1000, // 1 minute - matches queryClient settings
    gcTime: 10 * 60 * 1000, // 10 minutes - matches queryClient settings
    retry: 3, // matches queryClient settings
    refetchOnMount: true, // matches queryClient settings
    notifyOnChangeProps: ['data', 'error'], // matches queryClient settings
    placeholderData: (previousData: LeaveRecord[] | undefined) => previousData, // optimistic updates
  });
};

// Hook to update leave end date with optimistic updates
export const useUpdateLeaveEndDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employmentId,
      leaveId,
      employeeId,
      newEndDate,
    }: {
      employmentId: string;
      leaveId: string;
      employeeId: string;
      newEndDate: string;
    }) => {
      return await updateEmployeeLeaveEndDate(employmentId, leaveId, employeeId, newEndDate);
    },
    onMutate: async ({ employmentId, leaveId, employeeId, newEndDate }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leaves.byEmployee(employeeId) });

      // Snapshot the previous value
      const previousLeaves = queryClient.getQueryData<LeaveRecord[]>(
        queryKeys.leaves.byEmployee(employeeId)
      );

      // Optimistically update the cache
      if (previousLeaves) {
        queryClient.setQueryData<LeaveRecord[]>(
          queryKeys.leaves.byEmployee(employeeId),
          previousLeaves.map((leave) =>
            leave.id === leaveId
              ? {
                  ...leave,
                  endDate: newEndDate,
                  wasEdited: true,
                  // Calculate new totalDays
                  totalDays: Math.ceil(
                    (new Date(newEndDate).getTime() - new Date(leave.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1,
                }
              : leave
          )
        );
      }

      // Return context for rollback
      return { previousLeaves, employeeId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeaves && context?.employeeId) {
        queryClient.setQueryData(
          queryKeys.leaves.byEmployee(context.employeeId),
          context.previousLeaves
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.byEmployee(variables.employeeId),
      });
    },
  });
};

/**
 * Custom hook for creating leave requests with automatic cache invalidation
 */
export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEmployeeLeaveRequest,
    onSuccess: (data, variables) => {
      // Invalidate the leaves query for this employee
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.byEmployee(variables.employeeId)
      });
    },
    onError: (error) => {
      console.error('Error creating leave request:', error);
    }
  });
};

/**
 * Custom hook for updating leave requests with automatic cache invalidation
 */
export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateEmployeeLeaveRequest,
    onSuccess: (data, variables) => {
      // Invalidate the leaves query for this employee
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.byEmployee(variables.employeeId)
      });
    },
    onError: (error) => {
      console.error('Error updating leave request:', error);
    }
  });
};

/**
 * Custom hook for cancelling leave requests with automatic cache invalidation
 */
export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, leaveId }: { employeeId: string, leaveId: string }) => {
      return await cancelEmployeeLeaveRequest(employeeId, leaveId);
    },
    onSuccess: (data, variables) => {
      // Invalidate the leaves query for this employee
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.byEmployee(variables.employeeId)
      });
    },
    onError: (error) => {
      console.error('Error cancelling leave request:', error);
    }
  });
};
