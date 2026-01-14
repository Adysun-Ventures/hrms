import { QueryClient } from '@tanstack/react-query';

// Create a singleton instance for the client side
let queryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server side - return a new instance
    return new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 10 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes in milliseconds
          // Consider data stale after 1 minute
          staleTime: 1 * 60 * 1000, // 1 minute in milliseconds
          // Retry failed requests 3 times
          retry: 3,
          // Refetch on window focus - DISABLED to prevent unnecessary API calls
          // refetchOnWindowFocus: false,
          // Refetch on reconnect - DISABLED to prevent unnecessary API calls
          // refetchOnReconnect: true,
          // Background fetching - refetch in background when data is stale
          refetchOnMount: true,
          // Silent API calls - don't show loading states for background refetches
          notifyOnChangeProps: ['data', 'error'],
          // Optimistic updates for better UX
          placeholderData: (previousData: any) => previousData,
        },
        mutations: {
          // Retry failed mutations 1 time
          retry: 1,
        },
      },
    });
  }
  
  // Client side - return singleton
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 10 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes in milliseconds
          // Consider data stale after 1 minute
          staleTime: 1 * 60 * 1000, // 1 minute in milliseconds
          // Retry failed requests 3 times
          retry: 3,
          // Refetch on window focus - DISABLED to prevent unnecessary API calls
          // refetchOnWindowFocus: false,
          // Refetch on reconnect - DISABLED to prevent unnecessary API calls
          // refetchOnReconnect: true,
          // Background fetching - refetch in background when data is stale
          refetchOnMount: true,
          // Silent API calls - don't show loading states for background refetches
          notifyOnChangeProps: ['data', 'error'],
          // Optimistic updates for better UX
          placeholderData: (previousData: any) => previousData,
        },
        mutations: {
          // Retry failed mutations 1 time
          retry: 1,
        },
      },
    });
  }
  
  return queryClient;
};

// Helper functions for silent API calls
export const silentQueryOptions = {
  // Silent query options - no loading states, background only
  // refetchOnWindowFocus: false, // DISABLED
  refetchOnMount: false,
  // refetchOnReconnect: false, // DISABLED
  notifyOnChangeProps: ['data', 'error'],
  // Don't show loading states
  placeholderData: (previousData: any) => previousData,
};

// Helper functions for background fetching
export const backgroundQueryOptions = {
  // Background fetching - only when cache is missing or stale
  // refetchOnWindowFocus: true, // DISABLED
  refetchOnMount: true,
  // refetchOnReconnect: true, // DISABLED
  // Show loading states only for initial load
  notifyOnChangeProps: ['data', 'error'],
  // Keep previous data while fetching
  placeholderData: (previousData: any) => previousData,
};

// Helper functions for optimistic mutations
export const createOptimisticMutationOptions = (queryKey: string[]) => ({
  onMutate: async (variables: any) => {
    const client = getQueryClient();
    // Cancel any outgoing refetches
    await client.cancelQueries({ queryKey });
    
    // Snapshot the previous value
    const previousData = client.getQueryData(queryKey);
    
    // Return context for rollback
    return { previousData, queryKey };
  },
  onError: (err: any, variables: any, context: any) => {
    const client = getQueryClient();
    // Rollback on error
    if (context?.previousData && context?.queryKey) {
      client.setQueryData(context.queryKey, context.previousData);
    }
  },
  onSettled: () => {
    const client = getQueryClient();
    // Always refetch after mutation
    client.invalidateQueries({ queryKey });
  },
}); 