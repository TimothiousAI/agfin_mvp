import { getSupabaseAdmin } from '../../core/database';
import { logger } from '../../core/logging';
import archiver from 'archiver';

/**
 * Export Service
 *
 * Handles data export functionality for certification:
 * - Audit trail CSV export
 * - Proper CSV formatting with escaping
 * - Complete audit history for compliance
 */

interface AuditTrailEntry {
  id: string;
  application_id: string;
  user_id: string;
  field_id: string | null;
  old_value: string | null;
  new_value: string | null;
  justification: string | null;
  action: string | null;
  created_at: string;
}

/**
 * Export audit trail as CSV
 *
 * Generates a CSV file containing all audit trail entries for an application.
 * Includes proper CSV escaping for special characters.
 *
 * @param applicationId - The application to export audit trail for
 * @returns CSV string with all audit entries
 */
export async function exportAuditTrailCSV(
  applicationId: string
): Promise<string> {
  logger.info('Exporting audit trail CSV', { applicationId });

  const supabase = getSupabaseAdmin();

  // Fetch all audit trail entries
  const { data: auditEntries, error } = await (supabase.from('audit_trail') as any)
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch audit trail', {
      applicationId,
      error: error.message,
    });
    throw new Error(`Failed to fetch audit trail: ${error.message}`);
  }

  const entries = (auditEntries || []) as AuditTrailEntry[];

  logger.info('Audit entries fetched', {
    applicationId,
    count: entries.length,
  });

  // Generate CSV
  const csv = generateAuditTrailCSV(entries);

  return csv;
}

/**
 * Generate CSV content from audit trail entries
 */
function generateAuditTrailCSV(entries: AuditTrailEntry[]): string {
  // CSV Header
  const headers = [
    'Timestamp',
    'Action',
    'User ID',
    'Field ID',
    'Old Value',
    'New Value',
    'Justification',
    'Audit Entry ID',
  ];

  const rows: string[] = [];

  // Add header row
  rows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  for (const entry of entries) {
    const row = [
      formatTimestamp(entry.created_at),
      entry.action || '',
      entry.user_id,
      entry.field_id || '',
      entry.old_value || '',
      entry.new_value || '',
      entry.justification || '',
      entry.id,
    ];

    rows.push(row.map(escapeCSVValue).join(','));
  }

  return rows.join('\n');
}

/**
 * Escape a value for CSV format
 *
 * Rules:
 * - Wrap in quotes if contains comma, quote, or newline
 * - Escape internal quotes by doubling them
 * - Preserve newlines within quoted values
 */
function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if value needs quoting
  const needsQuoting =
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (!needsQuoting) {
    return stringValue;
  }

  // Escape internal quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');

  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Format timestamp for CSV export
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    return timestamp;
  }
}

/**
 * Export module data as CSV
 *
 * Generates a CSV file containing all module field data for an application.
 *
 * @param applicationId - The application to export module data for
 * @returns CSV string with all module fields
 */
export async function exportModuleDataCSV(
  applicationId: string
): Promise<string> {
  logger.info('Exporting module data CSV', { applicationId });

  const supabase = getSupabaseAdmin();

  // Fetch all module data
  const { data: moduleData, error } = await (supabase.from('module_data') as any)
    .select('*')
    .eq('application_id', applicationId)
    .order('module_number', { ascending: true })
    .order('field_path', { ascending: true });

  if (error) {
    logger.error('Failed to fetch module data', {
      applicationId,
      error: error.message,
    });
    throw new Error(`Failed to fetch module data: ${error.message}`);
  }

  const fields = moduleData || [];

  logger.info('Module data fetched', {
    applicationId,
    count: fields.length,
  });

  // CSV Header
  const headers = [
    'Module Number',
    'Module Name',
    'Field Path',
    'Field Label',
    'Value',
    'Required',
    'Confidence Score',
    'Extracted At',
    'Field ID',
  ];

  const rows: string[] = [];

  // Add header row
  rows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  for (const field of fields) {
    const row = [
      String(field.module_number || ''),
      field.module_name || '',
      field.field_path || '',
      field.field_label || '',
      field.value !== null && field.value !== undefined ? String(field.value) : '',
      field.required ? 'Yes' : 'No',
      field.confidence_score !== null
        ? (field.confidence_score * 100).toFixed(1) + '%'
        : '',
      field.extracted_at ? formatTimestamp(field.extracted_at) : '',
      field.id,
    ];

    rows.push(row.map(escapeCSVValue).join(','));
  }

  return rows.join('\n');
}

/**
 * Export complete application data as CSV
 *
 * Generates a comprehensive CSV export including:
 * - Application metadata
 * - All module fields
 * - Document summary
 *
 * @param applicationId - The application to export
 * @returns CSV string with complete application data
 */
export async function exportApplicationDataCSV(
  applicationId: string
): Promise<string> {
  logger.info('Exporting complete application data CSV', { applicationId });

  const supabase = getSupabaseAdmin();

  // Fetch application
  const { data: application, error: appError } = await (supabase.from('applications') as any)
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    throw new Error(`Application not found: ${appError?.message}`);
  }

  // Fetch document count
  const { count: documentCount } = await (supabase.from('documents') as any)
    .select('*', { count: 'exact', head: true })
    .eq('application_id', applicationId);

  // Fetch audited document count
  const { count: auditedCount } = await (supabase.from('documents') as any)
    .select('*', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .eq('audit_status', 'audited');

  // Build CSV
  const rows: string[] = [];

  // Section 1: Application Summary
  rows.push('=== APPLICATION SUMMARY ===');
  rows.push(`Application ID,${escapeCSVValue(application.id)}`);
  rows.push(`Farmer Name,${escapeCSVValue(application.farmer_name)}`);
  rows.push(`Farmer Email,${escapeCSVValue(application.farmer_email)}`);
  rows.push(
    `Farmer Phone,${escapeCSVValue(application.farmer_phone || 'N/A')}`
  );
  rows.push(`Status,${escapeCSVValue(application.status)}`);
  rows.push(
    `Created,${escapeCSVValue(formatTimestamp(application.created_at))}`
  );
  rows.push(
    `Last Updated,${escapeCSVValue(formatTimestamp(application.updated_at))}`
  );
  if (application.certified_at) {
    rows.push(
      `Certified,${escapeCSVValue(formatTimestamp(application.certified_at))}`
    );
  }
  if (application.certified_by) {
    rows.push(
      `Certified By,${escapeCSVValue(application.certified_by)}`
    );
  }
  rows.push(`Total Documents,${documentCount || 0}`);
  rows.push(`Audited Documents,${auditedCount || 0}`);

  rows.push(''); // Blank line

  // Section 2: Module Data
  rows.push('=== MODULE DATA ===');
  const moduleCSV = await exportModuleDataCSV(applicationId);
  rows.push(moduleCSV);

  return rows.join('\n');
}

/**
 * Create a complete export package as ZIP
 *
 * Generates a ZIP file containing:
 * - Certification PDF
 * - Audit trail CSV
 * - Module data CSV
 * - README file
 *
 * @param applicationId - The application to export
 * @returns Stream of ZIP file
 */
export async function createExportPackage(
  applicationId: string
): Promise<archiver.Archiver> {
  logger.info('Creating export package', { applicationId });

  const supabase = getSupabaseAdmin();

  // Fetch application data
  const { data: application, error: appError } = await (supabase.from('applications') as any)
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    throw new Error(`Application not found: ${appError?.message}`);
  }

  // Create archive
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  // Handle archive errors
  archive.on('error', (err) => {
    logger.error('Archive error', { applicationId, error: err.message });
    throw err;
  });

  // 1. Add audit trail CSV
  try {
    const auditCSV = await exportAuditTrailCSV(applicationId);
    archive.append(auditCSV, { name: 'audit-trail.csv' });
    logger.info('Added audit trail to package', { applicationId });
  } catch (error) {
    logger.warn('Failed to add audit trail', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // 2. Add module data CSV
  try {
    const moduleCSV = await exportModuleDataCSV(applicationId);
    archive.append(moduleCSV, { name: 'module-data.csv' });
    logger.info('Added module data to package', { applicationId });
  } catch (error) {
    logger.warn('Failed to add module data', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // 3. Add application summary CSV
  try {
    const appCSV = await exportApplicationDataCSV(applicationId);
    archive.append(appCSV, { name: 'application-summary.csv' });
    logger.info('Added application summary to package', { applicationId });
  } catch (error) {
    logger.warn('Failed to add application summary', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // 4. Try to add PDF (may not exist if not yet generated)
  try {
    // Check if PDF exists in storage
    const { data: files } = await supabase.storage
      .from('application-documents')
      .list(`certifications`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    const pdfFile = files?.find((file) =>
      file.name.startsWith(`${applicationId}_`)
    );

    if (pdfFile) {
      // Download PDF from storage
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from('application-documents')
        .download(`certifications/${pdfFile.name}`);

      if (pdfData && !pdfError) {
        const buffer = Buffer.from(await pdfData.arrayBuffer());
        archive.append(buffer, { name: 'certification.pdf' });
        logger.info('Added PDF to package', { applicationId });
      }
    } else {
      logger.info('No PDF found for package', { applicationId });
    }
  } catch (error) {
    logger.warn('Failed to add PDF', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // 5. Add README
  const readme = generatePackageReadme(application);
  archive.append(readme, { name: 'README.txt' });

  // Finalize the archive
  archive.finalize();

  logger.info('Export package created', { applicationId });

  return archive;
}

/**
 * Generate README for export package
 */
function generatePackageReadme(application: any): string {
  const lines: string[] = [];

  lines.push('AGRICULTURAL CERTIFICATION EXPORT PACKAGE');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Application ID: ${application.id}`);
  lines.push(`Farmer: ${application.farmer_name}`);
  lines.push(`Status: ${application.status}`);
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('CONTENTS:');
  lines.push('-'.repeat(50));
  lines.push('');
  lines.push('1. certification.pdf (if available)');
  lines.push('   Official certification document with all application data');
  lines.push('');
  lines.push('2. audit-trail.csv');
  lines.push('   Complete audit history of all changes made to the application');
  lines.push('   Includes timestamps, user IDs, before/after values, and justifications');
  lines.push('');
  lines.push('3. module-data.csv');
  lines.push('   All extracted field data organized by module');
  lines.push('   Includes confidence scores and extraction metadata');
  lines.push('');
  lines.push('4. application-summary.csv');
  lines.push('   Application overview and metadata');
  lines.push('');
  lines.push('NOTES:');
  lines.push('-'.repeat(50));
  lines.push('');
  lines.push('- All CSV files use UTF-8 encoding');
  lines.push('- Special characters are properly escaped per CSV standards');
  lines.push('- Timestamps are in ISO 8601 format (UTC)');
  lines.push('- This package contains all data as of the export date above');
  lines.push('');
  lines.push('For questions or support, contact your system administrator.');
  lines.push('');

  return lines.join('\n');
}
