import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../shared/types/database';
import { config } from './config';

/**
 * Server-side Supabase client with service role key
 * Has elevated privileges - bypasses RLS policies
 * Use only in backend code, never expose to client
 */
let supabaseAdmin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
    }
    supabaseAdmin = createClient<Database>(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'X-Client-Info': 'agfin-server',
          },
        },
      }
    );
  }
  return supabaseAdmin;
}

/**
 * Server-side Supabase client with user context
 * Respects RLS policies for the given user
 * Use when you want to enforce row-level security
 */
export function getSupabaseForUser(accessToken: string): SupabaseClient<Database> {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment');
  }
  return createClient<Database>(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Client-Info': 'agfin-server-user',
        },
      },
      db: {
        schema: 'public',
      },
    }
  );
}

/**
 * Query helper: Get application with related data
 */
export async function getApplicationWithDetails(applicationId: string) {
  const supabase = getSupabaseAdmin();

  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError) throw appError;
  if (!application) throw new Error('Application not found');

  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId);

  if (docsError) throw docsError;

  const { data: moduleData, error: moduleError } = await supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId);

  if (moduleError) throw moduleError;

  type ApplicationRow = Database['public']['Tables']['applications']['Row'];
  type DocumentRow = Database['public']['Tables']['documents']['Row'];
  type ModuleDataRow = Database['public']['Tables']['module_data']['Row'];

  return {
    ...(application as ApplicationRow),
    documents: (documents as DocumentRow[]) || [],
    moduleData: (moduleData as ModuleDataRow[]) || [],
  };
}

/**
 * Query helper: Search applications by analyst
 */
export async function getApplicationsByAnalyst(
  analystId: string,
  options?: {
    status?: Database['public']['Tables']['applications']['Row']['status'];
    limit?: number;
    offset?: number;
  }
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('applications')
    .select('*', { count: 'exact' })
    .eq('analyst_id', analystId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { data, count };
}

/**
 * Query helper: Get documents by application
 */
export async function getDocumentsByApplication(applicationId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Query helper: Get module data by application and module
 */
export async function getModuleData(
  applicationId: string,
  moduleNumber?: number
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId);

  if (moduleNumber) {
    query = query.eq('module_number', moduleNumber);
  }

  query = query.order('module_number', { ascending: true });

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

/**
 * Query helper: Record audit trail entry
 */
export async function createAuditTrailEntry(
  entry: Database['public']['Tables']['audit_trail']['Insert']
) {
  const supabase = getSupabaseAdmin();

  type AuditRow = Database['public']['Tables']['audit_trail']['Row'];

  // Note: TypeScript strict mode + Supabase generics have inference issues
  // The types are correct at runtime, but TS can't prove it statically
  const result = await supabase
    .from('audit_trail')
    // @ts-ignore - Known Supabase type inference limitation with strict mode
    .insert([entry])
    .select()
    .single();

  const { data, error } = result;

  if (error) throw error;
  if (!data) throw new Error('Failed to create audit trail entry');

  return data as AuditRow;
}

/**
 * Query helper: Get audit trail for application
 */
export async function getAuditTrail(applicationId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Query helper: Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: Database['public']['Tables']['applications']['Row']['status'],
  userId: string
) {
  const supabase = getSupabaseAdmin();

  type AppRow = Database['public']['Tables']['applications']['Row'];

  // Get current status
  const { data: current, error: fetchError } = await supabase
    .from('applications')
    .select('status')
    .eq('id', applicationId)
    .single();

  if (fetchError) throw fetchError;
  if (!current) throw new Error('Application not found');

  const currentStatus = (current as { status: string }).status;

  // Update status
  // Note: TypeScript strict mode + Supabase generics have inference issues
  const updateResult = await supabase
    .from('applications')
    // @ts-ignore - Known Supabase type inference limitation with strict mode
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single();

  const { data: updated, error: updateError } = updateResult;

  if (updateError) throw updateError;
  if (!updated) throw new Error('Failed to update application');

  // Log audit trail
  await createAuditTrailEntry({
    application_id: applicationId,
    user_id: userId,
    action: 'status_changed',
    old_value: currentStatus,
    new_value: status,
  });

  return updated as AppRow;
}
