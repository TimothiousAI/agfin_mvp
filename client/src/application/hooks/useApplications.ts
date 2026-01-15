import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Application API Types
 */
export interface Application {
  id: string;
  analyst_id: string;
  farmer_name: string;
  farmer_email: string;
  farmer_phone: string | null;
  status: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
  created_at: string;
  updated_at: string;
  document_count?: number;
  completion_stats?: {
    completed_modules: number;
    total_modules: number;
    completion_percentage: number;
  };
}

export interface ApplicationWithDetails extends Application {
  documents: any[];
  module_data: any[];
  module_completion: Array<{
    module_number: number;
    field_count: number;
    has_data: boolean;
    completion_percentage: number;
  }>;
}

export interface ApplicationFilters {
  status?: Application['status'];
  limit?: number;
  offset?: number;
}

export interface CreateApplicationInput {
  farmer_name: string;
  farmer_email: string;
  farmer_phone?: string | null;
  status?: Application['status'];
}

export interface UpdateStatusInput {
  status: Application['status'];
}

/**
 * API Helper Functions
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchApplications(filters: ApplicationFilters = {}): Promise<{
  applications: Application[];
  count: number;
}> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/applications?${params}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }

  const data = await response.json();
  return {
    applications: data.applications,
    count: data.count,
  };
}

async function fetchApplication(id: string): Promise<ApplicationWithDetails> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch application');
  }

  const data = await response.json();
  return data.application;
}

async function createApplication(input: CreateApplicationInput): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create application');
  }

  const data = await response.json();
  return data.application;
}

async function updateApplicationStatus(
  id: string,
  input: UpdateStatusInput
): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update application status');
  }

  const data = await response.json();
  return data.application;
}

/**
 * React Query Hooks
 */

/**
 * Fetch list of applications with optional filters
 */
export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () => fetchApplications(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch single application by ID with full details
 */
export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => fetchApplication(id!),
    enabled: !!id, // Only run query if ID is provided
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

/**
 * Update application status with workflow validation
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Application['status'] }) =>
      updateApplicationStatus(id, { status }),
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific application
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', variables.id] });
    },
  });
}

/**
 * Update application details (name, email, phone)
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateApplicationInput>;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }

      const result = await response.json();
      return result.application;
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific application
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', variables.id] });
    },
  });
}

/**
 * Delete (lock) an application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete application');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate applications list
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
