
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const queryClient = getQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider; 