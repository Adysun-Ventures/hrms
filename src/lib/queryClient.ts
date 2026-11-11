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