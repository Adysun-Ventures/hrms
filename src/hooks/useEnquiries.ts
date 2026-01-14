import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnquiries, getEnquiry, addEnquiry, updateEnquiry, deleteEnquiry } from '@/utils/firebaseUtils';
import { queryKeys } from '@/lib/queryKeys';

// List all enquiries
export const useEnquiries = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.enquiries.list(filters),
    queryFn: getEnquiries,
  });
};

// Get a single enquiry by ID
export const useEnquiry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.enquiries.detail(id),
    queryFn: () => getEnquiry(id),
    enabled: !!id,
  });
};

// Create a new enquiry
export const useCreateEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.lists() });
    },
  });
};

// Update an enquiry
export const useUpdateEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => updateEnquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.lists() });
    },
  });
};

// Delete an enquiry
export const useDeleteEnquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.lists() });
    },
  });
}; 