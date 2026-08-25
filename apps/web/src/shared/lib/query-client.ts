import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

// Centralized TanStack Query defaults. Feature-level query keys live in
// each feature's `query-keys.ts`.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 15,
      retry: (failureCount, error: unknown) => {
        if (isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
