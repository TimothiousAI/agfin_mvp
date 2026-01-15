import { getSupabaseAdmin } from '../core/database';
import type {
  CreateApplicationInput,
  ApplicationListQuery,
  UpdateApplicationInput,
  ApplicationStatus,
} from './applications.schemas';

/**
 * Application Service Layer
 * Contains business logic for application management
 * Separates concerns from route handlers
 */

/**
 * Status transition validation
 * Validates that status transitions follow the allowed workflow
 */
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['awaiting_documents'],
  awaiting_documents: ['awaiting_audit'],
  awaiting_audit: ['certified'],
  certified: ['locked'],
  locked: [], // Cannot transition from locked
};

export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Create a new application
 */
export async function createApplication(
  analystId: string,
  data: CreateApplicationInput
) {
  const supabase = getSupabaseAdmin();

  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      ...data,
      analyst_id: analystId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return application;
}

/**
 * Get all applications for an analyst with optional filters
 */
export async function getApplications(
  analystId: string,
  filters: ApplicationListQuery
) {
  const supabase = getSupabaseAdmin();
  const { status, limit, offset } = filters;

  // Build query with RLS filter by analyst_id and optional status filter
  let query = supabase
    .from('applications')
    .select(
      `
      *,
      documents:documents(count)
    `,
      { count: 'exact' }
    )
    .eq('analyst_id', analystId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: applications, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Enhance each application with completion stats
  const enhancedApplications = await Promise.all(
    (applications || []).map(async (app: any) => {
      // Get module completion stats
      const { data: moduleData } = await supabase
        .from('module_data')
        .select('module_number')
        .eq('application_id', app.id);

      // Calculate unique modules with data (assuming 13 total modules)
      const completedModules = new Set(
        moduleData?.map((m) => m.module_number) || []
      );
      const totalModules = 13;
      const completionPercentage = Math.round(
        (completedModules.size / totalModules) * 100
      );

      return {
        ...app,
        document_count: app.documents?.[0]?.count || 0,
        completion_stats: {
          completed_modules: completedModules.size,
          total_modules: totalModules,
          completion_percentage: completionPercentage,
        },
      };
    })
  );

  return {
    applications: enhancedApplications,
    count: count || 0,
  };
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(id: string, analystId: string) {
  const supabase = getSupabaseAdmin();

  // Query application with RLS check (analyst_id must match analystId)
  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('analyst_id', analystId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Application not found or access denied');
    }
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  // Get all related documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  // Get all module_data entries grouped by module
  const { data: moduleData } = await supabase
    .from('module_data')
    .select('*')
    .eq('application_id', id)
    .order('module_number', { ascending: true });

  // Calculate completion status for each module (1-13)
  const moduleCompletion = Array.from({ length: 13 }, (_, i) => {
    const moduleNumber = i + 1;
    const fields = moduleData?.filter((m) => m.module_number === moduleNumber) || [];

    return {
      module_number: moduleNumber,
      field_count: fields.length,
      has_data: fields.length > 0,
      completion_percentage: fields.length > 0 ? 100 : 0, // Simplified - could be more granular
    };
  });

  return {
    ...application,
    documents: documents || [],
    module_data: moduleData || [],
    module_completion: moduleCompletion,
  };
}

/**
 * Update an existing application
 */
export async function updateApplication(
  id: string,
  analystId: string,
  data: UpdateApplicationInput
) {
  const supabase = getSupabaseAdmin();

  const { data: application, error } = await supabase
    .from('applications')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('analyst_id', analystId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Application not found');
    }
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return application;
}

/**
 * Update application status with transition validation
 */
export async function updateApplicationStatus(
  id: string,
  analystId: string,
  newStatus: ApplicationStatus
) {
  const supabase = getSupabaseAdmin();

  // First, get current application to check current status
  const { data: currentApp, error: fetchError } = await supabase
    .from('applications')
    .select('status, analyst_id')
    .eq('id', id)
    .eq('analyst_id', analystId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Application not found or access denied');
    }
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentStatus = currentApp.status as ApplicationStatus;

  // Validate status transition
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    );
  }

  // Update status
  const { data: application, error: updateError } = await supabase
    .from('applications')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('analyst_id', analystId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update application status: ${updateError.message}`);
  }

  return {
    application,
    previousStatus: currentStatus,
    newStatus,
  };
}

/**
 * Soft delete an application by setting status to 'locked'
 */
export async function deleteApplication(id: string, analystId: string) {
  const supabase = getSupabaseAdmin();

  const { data: application, error } = await supabase
    .from('applications')
    .update({
      status: 'locked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('analyst_id', analystId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Application not found');
    }
    throw new Error(`Failed to delete application: ${error.message}`);
  }

  return application;
}
