import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllAttendance, 
  getAttendanceByEmployee, 
  getTodayAttendance,
  markAttendanceCheckIn,
  markAttendanceCheckOut
} from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';
import { Attendance } from '@/types';

// Attendance hooks
export const useAllAttendance = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.list(filters),
    queryFn: getAllAttendance,
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  });
};

export const useAttendanceByEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.byEmployee(employeeId),
    queryFn: () => getAttendanceByEmployee(employeeId),
    enabled: !!employeeId,
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  });
};

export const useTodayAttendance = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.today(employeeId),
    queryFn: () => getTodayAttendance(employeeId),
    enabled: !!employeeId,
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  });
};

// Attendance mutations
export const useMarkAttendanceCheckIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, employmentId }: { employeeId: string; employmentId: string }) =>
      markAttendanceCheckIn(employeeId, employmentId),
    onSuccess: (_, { employeeId }) => {
      // Invalidate today's attendance
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(employeeId) });
      // Invalidate employee's attendance list
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byEmployee(employeeId) });
      // Invalidate all attendance lists
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() });
    },
    onError: (error) => {
      console.error('Error marking attendance check-in:', error);
    },
  });
};

export const useMarkAttendanceCheckOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeId: string) => markAttendanceCheckOut(employeeId),
    onSuccess: (_, employeeId) => {
      // Invalidate today's attendance
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(employeeId) });
      // Invalidate employee's attendance list
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byEmployee(employeeId) });
      // Invalidate all attendance lists
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() });
    },
    onError: (error) => {
      console.error('Error marking attendance check-out:', error);
    },
  });
};

// Optimistic updates for better UX
export const useOptimisticAttendanceUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, employmentId }: { employeeId: string; employmentId: string }) =>
      markAttendanceCheckIn(employeeId, employmentId),
    onMutate: async ({ employeeId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance.today(employeeId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance.byEmployee(employeeId) });
      
      // Snapshot the previous value
      const previousTodayAttendance = queryClient.getQueryData(queryKeys.attendance.today(employeeId));
      const previousEmployeeAttendance = queryClient.getQueryData(queryKeys.attendance.byEmployee(employeeId));
      
      // Optimistically update the cache
      if (previousTodayAttendance) {
        queryClient.setQueryData(queryKeys.attendance.today(employeeId), {
          isCheckedIn: true,
          isCheckedOut: false,
          checkInTime: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          checkOutTime: null,
          status: 'present'
        });
      }
      
      return { previousTodayAttendance, previousEmployeeAttendance };
    },
    onError: (err, { employeeId }, context) => {
      // Rollback on error
      if (context?.previousTodayAttendance) {
        queryClient.setQueryData(queryKeys.attendance.today(employeeId), context.previousTodayAttendance);
      }
      if (context?.previousEmployeeAttendance) {
        queryClient.setQueryData(queryKeys.attendance.byEmployee(employeeId), context.previousEmployeeAttendance);
      }
    },
    onSettled: (_, __, { employeeId }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byEmployee(employeeId) });
    },
  });
}; 