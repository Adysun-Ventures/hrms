import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | undefined;

export const getQueryClient = () => {
  queryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 10 * 60 * 1000,
        staleTime: 1 * 60 * 1000,
        retry: 3,
        refetchOnMount: true,
        // Each Firestore read is billed; tab switches shouldn't re-read every active query.
        refetchOnWindowFocus: false,
        notifyOnChangeProps: ['data', 'error'],
      },
      mutations: {
        retry: 1,
      },
    },
  });
  return queryClient;
};
