import { getSupabaseAdmin } from '../../core/database';
import type {
  DataSource,
  UpdateFieldValue,
  BulkUpdateFields,
  ModuleDataQuery,
} from './modules.schemas';

/**
 * Module Data Service Layer
 * Contains business logic for module field data management
 */

export interface ModuleDataRow {
  id: string;
  application_id: string;
  module_number: number;
  field_id: string;
  value: any; // JSONB
  source: DataSource;
  source_document_id: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all module data for a specific application and module
 */
export async function getModuleData(
  applicationId: string,
  moduleNumber: number,
  analystId: string,
  filters?: ModuleDataQuery
): Promise<ModuleDataRow[]> {
  const supabase = getSupabaseAdmin();

  // First verify the application belongs to this analyst
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  // Build query for module data
  let query = supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId)
    .eq('module_number', moduleNumber)
    .order('field_id', { ascending: true });

  // Apply optional filters
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  if (filters?.min_confidence !== undefined) {
    query = query.gte('confidence_score', filters.min_confidence);
  }

  const { data: moduleData, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch module data: ${error.message}`);
  }

  return (moduleData || []) as ModuleDataRow[];
}

/**
 * Get a single field value
 */
export async function getFieldValue(
  applicationId: string,
  moduleNumber: number,
  fieldId: string,
  analystId: string
): Promise<ModuleDataRow | null> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  // Get field value
  const { data: fieldData, error } = await supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId)
    .eq('module_number', moduleNumber)
    .eq('field_id', fieldId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch field value: ${error.message}`);
  }

  return fieldData as ModuleDataRow | null;
}

/**
 * Update or create a field value with audit trail
 */
export async function updateFieldValue(
  applicationId: string,
  moduleNumber: number,
  fieldId: string,
  analystId: string,
  data: UpdateFieldValue
): Promise<ModuleDataRow> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await (supabase.from('applications') as any)
    .select('id, status')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  // Prevent updates to locked applications
  if ((application as any).status === 'locked') {
    throw new Error('Cannot update locked application');
  }

  // Check if field already exists
  const { data: existingField } = await (supabase.from('module_data') as any)
    .select('*')
    .eq('application_id', applicationId)
    .eq('module_number', moduleNumber)
    .eq('field_id', fieldId)
    .maybeSingle();

  const fieldData = {
    application_id: applicationId,
    module_number: moduleNumber,
    field_id: fieldId,
    value: data.value,
    source: data.source || 'proxy_edited',
    source_document_id: data.source_document_id || null,
    confidence_score: data.confidence_score || null,
  };

  let result;

  if (existingField) {
    // Update existing field
    const { data: updated, error: updateError } = await (supabase.from('module_data') as any)
      .update({
        value: fieldData.value,
        source: fieldData.source,
        source_document_id: fieldData.source_document_id,
        confidence_score: fieldData.confidence_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (existingField as any).id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update field: ${updateError.message}`);
    }

    result = updated;

    // Log audit trail for update
    await logAuditTrail(
      applicationId,
      analystId,
      'module_field_updated',
      {
        module_number: moduleNumber,
        field_id: fieldId,
        old_value: (existingField as any).value,
        new_value: fieldData.value,
        old_source: (existingField as any).source,
        new_source: fieldData.source,
      }
    );
  } else {
    // Create new field
    const { data: created, error: createError } = await (supabase.from('module_data') as any)
      .insert(fieldData)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create field: ${createError.message}`);
    }

    result = created;

    // Log audit trail for creation
    await logAuditTrail(
      applicationId,
      analystId,
      'module_field_created',
      {
        module_number: moduleNumber,
        field_id: fieldId,
        value: fieldData.value,
        source: fieldData.source,
      }
    );
  }

  return result as ModuleDataRow;
}

/**
 * Bulk update multiple fields in a module
 */
export async function bulkUpdateFields(
  applicationId: string,
  moduleNumber: number,
  analystId: string,
  data: BulkUpdateFields
): Promise<{ updated: number; fields: ModuleDataRow[] }> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  if ((application as any).status === 'locked') {
    throw new Error('Cannot update locked application');
  }

  const updatedFields: ModuleDataRow[] = [];

  // Process each field update
  for (const field of data.fields) {
    try {
      const updated = await updateFieldValue(
        applicationId,
        moduleNumber,
        field.field_id,
        analystId,
        {
          value: field.value,
          source: field.source,
          source_document_id: field.source_document_id,
          confidence_score: field.confidence_score,
        }
      );
      updatedFields.push(updated);
    } catch (error) {
      console.error(`Failed to update field ${field.field_id}:`, error);
      // Continue with other fields even if one fails
    }
  }

  return {
    updated: updatedFields.length,
    fields: updatedFields,
  };
}

/**
 * Delete a field value
 */
export async function deleteFieldValue(
  applicationId: string,
  moduleNumber: number,
  fieldId: string,
  analystId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  if ((application as any).status === 'locked') {
    throw new Error('Cannot delete from locked application');
  }

  // Delete the field
  const { error } = await supabase
    .from('module_data')
    .delete()
    .eq('application_id', applicationId)
    .eq('module_number', moduleNumber)
    .eq('field_id', fieldId);

  if (error) {
    throw new Error(`Failed to delete field: ${error.message}`);
  }

  // Log audit trail
  await logAuditTrail(
    applicationId,
    analystId,
    'module_field_deleted',
    {
      module_number: moduleNumber,
      field_id: fieldId,
    }
  );
}

/**
 * Calculate derived fields for an application
 * This function recalculates computed fields based on input data
 * Examples: totals in M5, debt service coverage ratio (DSCR), etc.
 */
export async function calculateDerivedFields(
  applicationId: string,
  analystId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  // Get all module data for calculations
  const { data: allModuleData, error: dataError } = await supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId);

  if (dataError) {
    throw new Error(`Failed to fetch module data: ${dataError.message}`);
  }

  // Convert to map for easier access
  const fieldMap = new Map<string, any>();
  (allModuleData || []).forEach((row: any) => {
    fieldMap.set(`${row.module_number}:${row.field_id}`, row.value);
  });

  // Calculate M5 totals from M3 assets (example)
  // M3 contains asset details, M5 contains financial summaries
  const m3Assets = (allModuleData || []).filter((row: any) =>
    row.module_number === 3 && row.field_id.startsWith('asset_')
  );

  let totalAssetValue = 0;
  m3Assets.forEach((asset: any) => {
    if (asset.value && typeof asset.value === 'object' && asset.value.value) {
      totalAssetValue += Number(asset.value.value) || 0;
    }
  });

  // Update M5 total assets field
  if (totalAssetValue > 0) {
    await updateFieldValue(
      applicationId,
      5,
      'm5_total_assets',
      analystId,
      {
        value: totalAssetValue,
        source: 'proxy_edited', // Derived fields are system-calculated
        confidence_score: 1.0,
      }
    );
  }

  // Calculate DSCR (Debt Service Coverage Ratio) if we have necessary fields
  const annualIncome = fieldMap.get('5:m5_annual_income');
  const annualDebtPayment = fieldMap.get('5:m5_annual_debt_payment');

  if (annualIncome && annualDebtPayment && annualDebtPayment !== 0) {
    const dscr = annualIncome / annualDebtPayment;
    await updateFieldValue(
      applicationId,
      5,
      'm5_dscr',
      analystId,
      {
        value: dscr.toFixed(2),
        source: 'proxy_edited',
        confidence_score: 1.0,
      }
    );
  }

  // Log calculation
  await logAuditTrail(
    applicationId,
    analystId,
    'derived_fields_calculated',
    {
      total_asset_value: totalAssetValue,
      fields_calculated: ['m5_total_assets', 'm5_dscr'],
    }
  );
}

/**
 * Validate if a module is complete
 * Checks if all required fields for a module are filled
 */
export async function validateModuleCompletion(
  applicationId: string,
  moduleNumber: number,
  analystId: string
): Promise<{ complete: boolean; missing_fields: string[]; total_fields: number; completed_fields: number }> {
  const supabase = getSupabaseAdmin();

  // Verify application access
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('analyst_id', analystId)
    .single();

  if (appError || !application) {
    throw new Error('Application not found or access denied');
  }

  // Define required fields for each module
  // In a real app, this would come from a config or database
  const requiredFields: Record<number, string[]> = {
    1: ['m1_farmer_name', 'm1_farmer_id', 'm1_farm_location'],
    2: ['m2_land_parcel_id', 'm2_land_size_ha', 'm2_land_ownership'],
    3: ['m3_primary_crop', 'm3_secondary_crop', 'm3_cultivation_method'],
    4: ['m4_annual_revenue', 'm4_annual_costs', 'm4_net_income'],
    5: ['m5_loan_amount', 'm5_loan_purpose', 'm5_collateral'],
  };

  const required = requiredFields[moduleNumber] || [];

  // Get current module data
  const moduleData = await getModuleData(applicationId, moduleNumber, analystId);
  const filledFields = new Set(moduleData.map(row => row.field_id));

  // Check which required fields are missing
  const missingFields = required.filter(field => !filledFields.has(field));

  return {
    complete: missingFields.length === 0,
    missing_fields: missingFields,
    total_fields: required.length,
    completed_fields: required.length - missingFields.length,
  };
}

/**
 * Get completion status for all modules in an application
 */
export async function getCompletionStatus(
  applicationId: string,
  analystId: string
): Promise<{
  application_id: string;
  overall_completion: number;
  modules: Array<{
    module_number: number;
    complete: boolean;
    completion_percentage: number;
    missing_fields: string[];
  }>;
}> {
  const moduleResults = [];

  // Check completion for all 5 modules
  for (let moduleNumber = 1; moduleNumber <= 5; moduleNumber++) {
    const validation = await validateModuleCompletion(
      applicationId,
      moduleNumber,
      analystId
    );

    const completionPercentage =
      validation.total_fields > 0
        ? Math.round((validation.completed_fields / validation.total_fields) * 100)
        : 0;

    moduleResults.push({
      module_number: moduleNumber,
      complete: validation.complete,
      completion_percentage: completionPercentage,
      missing_fields: validation.missing_fields,
    });
  }

  // Calculate overall completion
  const overallCompletion = Math.round(
    moduleResults.reduce((sum, m) => sum + m.completion_percentage, 0) / 5
  );

  return {
    application_id: applicationId,
    overall_completion: overallCompletion,
    modules: moduleResults,
  };
}

/**
 * Helper: Log audit trail entry
 */
async function logAuditTrail(
  applicationId: string,
  analystId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseAdmin();

  try {
    await (supabase.from('audit_trail') as any).insert({
      application_id: applicationId,
      analyst_id: analystId,
      action,
      details,
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log audit trail:', error);
  }
}
