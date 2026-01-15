import { getSupabaseAdmin, createAuditTrailEntry as coreCreateAuditTrailEntry } from '../../core/database';
import { logger } from '../../core/logging';
import type { Database } from '../../../../shared/types/database';

/**
 * Audit Trail Service
 *
 * Immutable logging service for tracking all changes to application data.
 * Implements append-only design for compliance requirements.
 *
 * Design principles:
 * - No update operations (enforced by database trigger)
 * - No delete operations (enforced by database trigger, except CASCADE)
 * - All entries include user_id and timestamp
 * - All operations are logged for audit purposes
 */

type AuditTrailInsert = Database['public']['Tables']['audit_trail']['Insert'];
type AuditTrailRow = Database['public']['Tables']['audit_trail']['Row'];

/**
 * Log a field value change
 * Used when a proxy or auditor modifies an extracted field value
 */
export async function logFieldChange(params: {
  application_id: string;
  user_id: string;
  field_id: string;
  old_value: any;
  new_value: any;
  justification: 'data_quality_issue' | 'document_illegible' | 'farmer_provided_correction' | 'regulatory_requirement';
  notes?: string;
}): Promise<AuditTrailRow> {
  logger.info('Logging field change', {
    applicationId: params.application_id,
    fieldId: params.field_id,
    justification: params.justification,
  });

  const entry: AuditTrailInsert = {
    application_id: params.application_id,
    user_id: params.user_id,
    field_id: params.field_id,
    old_value: params.old_value !== null && params.old_value !== undefined ? String(params.old_value) : null,
    new_value: params.new_value !== null && params.new_value !== undefined ? String(params.new_value) : null,
    justification: params.justification,
    action: params.notes ? `field_override: ${params.notes}` : 'field_override',
  };

  return await coreCreateAuditTrailEntry(entry);
}

/**
 * Log an application status transition
 * Used when application moves through workflow stages
 */
export async function logStatusTransition(params: {
  application_id: string;
  user_id: string;
  old_status: string;
  new_status: string;
}): Promise<AuditTrailRow> {
  logger.info('Logging status transition', {
    applicationId: params.application_id,
    oldStatus: params.old_status,
    newStatus: params.new_status,
  });

  const entry: AuditTrailInsert = {
    application_id: params.application_id,
    user_id: params.user_id,
    field_id: null,
    old_value: params.old_status,
    new_value: params.new_status,
    justification: null,
    action: 'status_changed',
  };

  return await coreCreateAuditTrailEntry(entry);
}

/**
 * Log document audit completion
 * Used when a document is marked as audited after review
 */
export async function logAuditCompletion(params: {
  application_id: string;
  user_id: string;
  document_id?: string;
}): Promise<AuditTrailRow> {
  logger.info('Logging audit completion', {
    applicationId: params.application_id,
    documentId: params.document_id,
  });

  const entry: AuditTrailInsert = {
    application_id: params.application_id,
    user_id: params.user_id,
    field_id: params.document_id || null,
    old_value: null,
    new_value: 'audited',
    justification: null,
    action: 'document_audited',
  };

  return await coreCreateAuditTrailEntry(entry);
}

/**
 * Log document upload
 * Used when a new document is added to an application
 */
export async function logDocumentUpload(params: {
  application_id: string;
  user_id: string;
  document_id: string;
  document_type: string;
}): Promise<AuditTrailRow> {
  logger.info('Logging document upload', {
    applicationId: params.application_id,
    documentId: params.document_id,
    documentType: params.document_type,
  });

  const entry: AuditTrailInsert = {
    application_id: params.application_id,
    user_id: params.user_id,
    field_id: params.document_id,
    old_value: null,
    new_value: params.document_type,
    justification: null,
    action: 'document_uploaded',
  };

  return await coreCreateAuditTrailEntry(entry);
}

/**
 * Log certification approval
 * Used when an application is certified
 */
export async function logCertificationApproval(params: {
  application_id: string;
  user_id: string;
  notes?: string;
}): Promise<AuditTrailRow> {
  logger.info('Logging certification approval', {
    applicationId: params.application_id,
  });

  const entry: AuditTrailInsert = {
    application_id: params.application_id,
    user_id: params.user_id,
    field_id: null,
    old_value: null,
    new_value: 'certified',
    justification: null,
    action: params.notes ? `certification_approved: ${params.notes}` : 'certification_approved',
  };

  return await coreCreateAuditTrailEntry(entry);
}

/**
 * Get audit trail for an application
 * Returns all audit entries sorted by timestamp (newest first)
 */
export async function getAuditTrailForApplication(
  applicationId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ entries: AuditTrailRow[]; total: number }> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('audit_trail')
    .select('*', { count: 'exact' })
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 50) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error fetching audit trail', { error, applicationId });
    throw error;
  }

  return {
    entries: (data as AuditTrailRow[]) || [],
    total: count || 0,
  };
}

/**
 * Get audit trail entries for a specific field
 * Returns all changes to a particular field
 */
export async function getAuditTrailForField(
  applicationId: string,
  fieldId: string
): Promise<AuditTrailRow[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('application_id', applicationId)
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching field audit trail', { error, applicationId, fieldId });
    throw error;
  }

  return (data as AuditTrailRow[]) || [];
}

/**
 * Get recent audit activity across all applications
 * Used for admin dashboards and monitoring
 */
export async function getRecentAuditActivity(
  limit: number = 50
): Promise<AuditTrailRow[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching recent audit activity', { error });
    throw error;
  }

  return (data as AuditTrailRow[]) || [];
}

/**
 * Note: Update and delete operations are intentionally NOT provided
 * The audit_trail table has database triggers that prevent modifications
 * This enforces the append-only immutability requirement for compliance
 */
