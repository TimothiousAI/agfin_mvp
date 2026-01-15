import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * Centralized TanStack Query configuration with optimized caching strategies
 *
 * Features:
 * - Intelligent cache management with appropriate stale times
 * - Automatic request deduplication
 * - Background refetching
 * - Retry logic with exponential backoff
 * - Error handling and logging
 * - Optimistic updates support
 */

// Custom error handler for queries
const handleQueryError = (error: Error) => {
  console.error('[Query Error]', error.message);
  // In production, you could send to error tracking service
  // reportErrorToService(error);
};

// Custom error handler for mutations
const handleMutationError = (error: Error) => {
  console.error('[Mutation Error]', error.message);
  // In production, you could send to error tracking service
  // reportErrorToService(error);
};

/**
 * Global Query Client with optimized defaults
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      // Prevents unnecessary refetches for data that doesn't change often
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: Keep unused data in cache for 10 minutes
      // Allows instant navigation back to previously viewed data
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts if data is stale

      // Network mode: Fetch even when offline (will use cache)
      networkMode: 'online',

      // Dedupe concurrent requests
      // TanStack Query automatically dedupes identical requests
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

/**
 * Query key factories for consistent key generation
 * Helps with cache invalidation and prefetching
 */
export const queryKeys = {
  // Application queries
  applications: {
    all: ['applications'] as const,
    lists: () => [...queryKeys.applications.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.applications.lists(), filters] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
  },

  // Document queries
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (applicationId: string) => [...queryKeys.documents.lists(), applicationId] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },

  // Module data queries
  modules: {
    all: ['modules'] as const,
    data: (applicationId: string, moduleNumber: number) =>
      [...queryKeys.modules.all, 'data', applicationId, moduleNumber] as const,
  },

  // Chat/conversation queries
  chat: {
    all: ['chat'] as const,
    sessions: {
      all: () => [...queryKeys.chat.all, 'sessions'] as const,
      list: () => [...queryKeys.chat.sessions.all(), 'list'] as const,
      detail: (id: string) => [...queryKeys.chat.sessions.all(), 'detail', id] as const,
    },
    messages: (sessionId: string) => [...queryKeys.chat.all, 'messages', sessionId] as const,
    history: (sessionId: string) => [...queryKeys.chat.all, 'history', sessionId] as const,
  },
};

/**
 * Prefetch utilities for hover/navigation optimization
 */
export const prefetchQueries = {
  /**
   * Prefetch application details on hover
   */
  applicationDetail: async (applicationId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.applications.detail(applicationId),
      queryFn: async () => {
        const response = await fetch(`/api/applications/${applicationId}`);
        if (!response.ok) throw new Error('Failed to fetch application');
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  /**
   * Prefetch chat session on hover
   */
  chatSession: async (sessionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.chat.sessions.detail(sessionId),
      queryFn: async () => {
        const response = await fetch(`/api/chat/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session');
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};

/**
 * Cache invalidation utilities
 */
export const invalidateQueries = {
  /**
   * Invalidate all application queries (after create/update/delete)
   */
  applications: () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.applications.all,
    });
  },

  /**
   * Invalidate specific application
   */
  application: (applicationId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.applications.detail(applicationId),
    });
  },

  /**
   * Invalidate document queries
   */
  documents: (applicationId?: string) => {
    if (applicationId) {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.documents.list(applicationId),
      });
    }
    return queryClient.invalidateQueries({
      queryKey: queryKeys.documents.all,
    });
  },

  /**
   * Invalidate chat sessions
   */
  chatSessions: () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.chat.sessions.all(),
    });
  },
};

/**
 * Optimistic update utilities
 */
export const optimisticUpdates = {
  /**
   * Optimistically update application data
   */
  updateApplication: <T = any>(applicationId: string, updater: (old: T) => T) => {
    const queryKey = queryKeys.applications.detail(applicationId);

    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData(queryKey);

    // Optimistically update to the new value
    queryClient.setQueryData(queryKey, updater);

    // Return context with previous data for rollback
    return { previousData, queryKey };
  },

  /**
   * Rollback optimistic update on error
   */
  rollback: (context: { previousData: any; queryKey: any }) => {
    queryClient.setQueryData(context.queryKey, context.previousData);
  },
};

/**
 * Development helpers
 */
if (import.meta.env.DEV) {
  // Make queryClient available in console for debugging
  (window as any).queryClient = queryClient;
  console.log('[TanStack Query] Query client initialized with optimized caching');
}
