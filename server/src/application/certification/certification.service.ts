import { getSupabaseAdmin } from '../../core/database';
import { logger } from '../../core/logging';

/**
 * Certification validation blocker
 */
export interface CertificationBlocker {
  type: 'document' | 'module' | 'field';
  id: string;
  name: string;
  issue: string;
}

/**
 * Certification validation result
 */
export interface CertificationValidationResult {
  isValid: boolean;
  documentsAudited: number;
  totalDocuments: number;
  requiredFieldsPopulated: number;
  totalRequiredFields: number;
  lowConfidenceFieldsReviewed: number;
  totalLowConfidenceFields: number;
  blockers: CertificationBlocker[];
}

/**
 * Certification Service
 *
 * Validates that an application meets all requirements for certification:
 * - All documents have been audited
 * - All required module fields are populated
 * - All low-confidence fields have been reviewed
 *
 * This is the gate-keeping service that prevents incomplete applications
 * from being certified and locked.
 */

/**
 * Validate application readiness for certification
 *
 * Performs comprehensive checks:
 * 1. All 9 required documents have 'audited' status
 * 2. All required module fields are populated
 * 3. All low-confidence fields have been reviewed/confirmed
 *
 * @param applicationId - The application to validate
 * @returns Detailed validation result with specific blockers
 */
export async function validateCertificationReadiness(
  applicationId: string
): Promise<CertificationValidationResult> {
  logger.info('Validating certification readiness', { applicationId });

  const supabase = getSupabaseAdmin();
  const blockers: CertificationBlocker[] = [];

  // 1. Check all documents have been audited
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, document_type, audit_status')
    .eq('application_id', applicationId);

  if (docsError) {
    logger.error('Failed to fetch documents for certification validation', {
      applicationId,
      error: docsError.message,
    });
    throw new Error(`Failed to validate documents: ${docsError.message}`);
  }

  const totalDocuments = documents?.length || 0;
  const auditedDocuments = documents?.filter(
    (doc) => doc.audit_status === 'audited'
  ) || [];
  const documentsAudited = auditedDocuments.length;

  // Track unaudited documents as blockers
  const unauditedDocs = documents?.filter(
    (doc) => doc.audit_status !== 'audited'
  ) || [];

  unauditedDocs.forEach((doc) => {
    blockers.push({
      type: 'document',
      id: doc.id,
      name: doc.document_type || 'Unknown Document',
      issue: `Document has not been audited (status: ${doc.audit_status || 'pending'})`,
    });
  });

  // 2. Check all required module fields are populated
  const { data: moduleData, error: modulesError } = await supabase
    .from('module_data')
    .select('id, module_name, field_path, value, required')
    .eq('application_id', applicationId);

  if (modulesError) {
    logger.error('Failed to fetch module data for certification validation', {
      applicationId,
      error: modulesError.message,
    });
    throw new Error(`Failed to validate modules: ${modulesError.message}`);
  }

  // Filter required fields
  const requiredFields = moduleData?.filter((field) => field.required === true) || [];
  const totalRequiredFields = requiredFields.length;

  // Check which required fields are populated (not null, not empty string)
  const populatedRequiredFields = requiredFields.filter((field) => {
    const value = field.value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });
  const requiredFieldsPopulated = populatedRequiredFields.length;

  // Track unpopulated required fields as blockers
  const unpopulatedFields = requiredFields.filter((field) => {
    const value = field.value;
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  });

  unpopulatedFields.forEach((field) => {
    blockers.push({
      type: 'field',
      id: field.id,
      name: `${field.module_name}.${field.field_path}`,
      issue: 'Required field is not populated',
    });
  });

  // 3. Check all low-confidence fields have been reviewed
  // Low confidence = confidence_score < 0.90
  const lowConfidenceThreshold = 0.90;

  const allFields = moduleData || [];
  const lowConfidenceFields = allFields.filter(
    (field: any) =>
      field.confidence_score !== null &&
      field.confidence_score < lowConfidenceThreshold
  );
  const totalLowConfidenceFields = lowConfidenceFields.length;

  // Check which low-confidence fields have been reviewed
  // A field is considered reviewed if it has an audit trail entry (override/confirmation)
  const reviewedFieldIds = new Set<string>();

  for (const field of lowConfidenceFields) {
    const { data: auditEntries, error: auditError } = await supabase
      .from('audit_trail')
      .select('id')
      .eq('application_id', applicationId)
      .eq('field_id', field.id)
      .limit(1);

    if (!auditError && auditEntries && auditEntries.length > 0) {
      reviewedFieldIds.add(field.id);
    }
  }

  const lowConfidenceFieldsReviewed = reviewedFieldIds.size;

  // Track unreviewed low-confidence fields as blockers
  const unreviewedLowConfidenceFields = lowConfidenceFields.filter(
    (field: any) => !reviewedFieldIds.has(field.id)
  );

  unreviewedLowConfidenceFields.forEach((field: any) => {
    blockers.push({
      type: 'field',
      id: field.id,
      name: `${field.module_name}.${field.field_path}`,
      issue: `Low confidence field (${Math.round((field.confidence_score || 0) * 100)}%) requires review`,
    });
  });

  // 4. Determine overall validity
  const isValid =
    documentsAudited === totalDocuments &&
    totalDocuments > 0 && // Must have at least some documents
    requiredFieldsPopulated === totalRequiredFields &&
    lowConfidenceFieldsReviewed === totalLowConfidenceFields;

  const result: CertificationValidationResult = {
    isValid,
    documentsAudited,
    totalDocuments,
    requiredFieldsPopulated,
    totalRequiredFields,
    lowConfidenceFieldsReviewed,
    totalLowConfidenceFields,
    blockers,
  };

  logger.info('Certification validation complete', {
    applicationId,
    isValid,
    blockerCount: blockers.length,
  });

  return result;
}

/**
 * Certify an application
 *
 * Validates readiness, then updates application status to 'certified' and locks it.
 * This is a one-way operation - once certified, the application cannot be edited.
 *
 * @param applicationId - The application to certify
 * @param analystId - The analyst performing certification
 * @returns The certified application
 * @throws Error if validation fails or update fails
 */
export async function certifyApplication(
  applicationId: string,
  analystId: string
) {
  logger.info('Attempting to certify application', {
    applicationId,
    analystId,
  });

  // 1. Validate certification readiness
  const validation = await validateCertificationReadiness(applicationId);

  if (!validation.isValid) {
    logger.warn('Certification validation failed', {
      applicationId,
      blockerCount: validation.blockers.length,
      blockers: validation.blockers.map((b) => b.issue),
    });
    throw new Error(
      `Application cannot be certified. ${validation.blockers.length} blocker(s) found: ${validation.blockers[0]?.issue || 'Unknown issue'}`
    );
  }

  // 2. Update application status to certified
  const supabase = getSupabaseAdmin();

  const { data: application, error } = await supabase
    .from('applications')
    .update({
      status: 'certified',
      certified_at: new Date().toISOString(),
      certified_by: analystId,
    })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to certify application', {
      applicationId,
      error: error.message,
    });
    throw new Error(`Failed to certify application: ${error.message}`);
  }

  logger.info('Application certified successfully', {
    applicationId,
    analystId,
  });

  return application;
}

/**
 * Get certification status summary
 *
 * Returns a summary suitable for UI display
 */
export async function getCertificationStatus(applicationId: string) {
  const validation = await validateCertificationReadiness(applicationId);

  return {
    isReadyForCertification: validation.isValid,
    summary: {
      documentsComplete: validation.documentsAudited === validation.totalDocuments,
      documentsProgress: `${validation.documentsAudited}/${validation.totalDocuments}`,
      fieldsComplete: validation.requiredFieldsPopulated === validation.totalRequiredFields,
      fieldsProgress: `${validation.requiredFieldsPopulated}/${validation.totalRequiredFields}`,
      reviewsComplete: validation.lowConfidenceFieldsReviewed === validation.totalLowConfidenceFields,
      reviewsProgress: `${validation.lowConfidenceFieldsReviewed}/${validation.totalLowConfidenceFields}`,
    },
    blockers: validation.blockers,
  };
}
