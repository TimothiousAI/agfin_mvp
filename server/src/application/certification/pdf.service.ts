import PDFDocument from 'pdfkit';
import { getSupabaseAdmin } from '../../core/database';
import { logger } from '../../core/logging';

/**
 * PDF Generation Service
 *
 * Generates certification PDFs that include:
 * - Application metadata
 * - All module data formatted by module
 * - Certification statement
 * - Analyst information and timestamp
 *
 * PDFs are stored in Supabase Storage for permanent record keeping.
 */

interface ModuleField {
  id: string;
  module_name: string;
  module_number: number;
  field_path: string;
  field_label: string;
  value: any;
  required: boolean;
  confidence_score: number | null;
}

interface ApplicationData {
  id: string;
  analyst_id: string;
  farmer_name: string;
  farmer_email: string;
  farmer_phone: string | null;
  status: string;
  created_at: string;
  certified_at: string | null;
  certified_by: string | null;
}

/**
 * Get or generate a certification PDF for an application
 *
 * Checks if a PDF already exists in storage. If it does, returns the existing URL.
 * If not, generates a new PDF.
 *
 * @param applicationId - The application to get/generate PDF for
 * @param forceRegenerate - If true, generates a new PDF even if one exists
 * @returns URL to the PDF in Supabase Storage
 */
export async function getCertificationPDF(
  applicationId: string,
  forceRegenerate: boolean = false
): Promise<string> {
  logger.info('Getting certification PDF', { applicationId, forceRegenerate });

  const supabase = getSupabaseAdmin();

  // Check if PDF already exists (unless force regeneration requested)
  if (!forceRegenerate) {
    const { data: files, error: listError } = await supabase.storage
      .from('application-documents')
      .list(`certifications`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (!listError && files) {
      // Find the most recent PDF for this application
      const existingPdf = files.find((file) =>
        file.name.startsWith(`${applicationId}_`)
      );

      if (existingPdf) {
        const { data: urlData } = supabase.storage
          .from('application-documents')
          .getPublicUrl(`certifications/${existingPdf.name}`);

        logger.info('Found existing PDF', {
          applicationId,
          pdfUrl: urlData.publicUrl,
        });

        return urlData.publicUrl;
      }
    }
  }

  // Generate new PDF
  return await generateCertificationPDF(applicationId);
}

/**
 * Generate a certification PDF for an application
 *
 * @param applicationId - The application to generate PDF for
 * @returns URL to the generated PDF in Supabase Storage
 */
export async function generateCertificationPDF(
  applicationId: string
): Promise<string> {
  logger.info('Generating certification PDF', { applicationId });

  const supabase = getSupabaseAdmin();

  // 1. Fetch application data
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    logger.error('Failed to fetch application for PDF', {
      applicationId,
      error: appError?.message,
    });
    throw new Error(`Application not found: ${appError?.message}`);
  }

  const appData = application as ApplicationData;

  // 2. Fetch all module data
  const { data: moduleFields, error: moduleError } = await supabase
    .from('module_data')
    .select('*')
    .eq('application_id', applicationId)
    .order('module_number', { ascending: true })
    .order('field_path', { ascending: true });

  if (moduleError) {
    logger.error('Failed to fetch module data for PDF', {
      applicationId,
      error: moduleError.message,
    });
    throw new Error(`Failed to fetch module data: ${moduleError.message}`);
  }

  const fields = (moduleFields || []) as ModuleField[];

  // 3. Group fields by module
  const moduleGroups = new Map<number, ModuleField[]>();
  fields.forEach((field) => {
    if (!moduleGroups.has(field.module_number)) {
      moduleGroups.set(field.module_number, []);
    }
    moduleGroups.get(field.module_number)!.push(field);
  });

  // 4. Generate PDF
  const pdfBuffer = await createPDFDocument(appData, moduleGroups);

  // 5. Upload to Supabase Storage
  const fileName = `certifications/${applicationId}_${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('application-documents')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    logger.error('Failed to upload PDF to storage', {
      applicationId,
      error: uploadError.message,
    });
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // 6. Get public URL
  const { data: urlData } = supabase.storage
    .from('application-documents')
    .getPublicUrl(fileName);

  const pdfUrl = urlData.publicUrl;

  logger.info('Certification PDF generated successfully', {
    applicationId,
    pdfUrl,
  });

  return pdfUrl;
}

/**
 * Create PDF document with application data
 */
async function createPDFDocument(
  application: ApplicationData,
  moduleGroups: Map<number, ModuleField[]>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Agricultural Certification Report', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        { align: 'center' }
      );

    doc.moveDown(2);

    // Application Information Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Application Information');

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    addField(doc, 'Application ID', application.id);
    addField(doc, 'Farmer Name', application.farmer_name);
    addField(doc, 'Farmer Email', application.farmer_email);
    if (application.farmer_phone) {
      addField(doc, 'Farmer Phone', application.farmer_phone);
    }
    addField(doc, 'Status', application.status.toUpperCase());
    addField(
      doc,
      'Created',
      new Date(application.created_at).toLocaleDateString()
    );

    if (application.certified_at) {
      addField(
        doc,
        'Certified',
        new Date(application.certified_at).toLocaleDateString()
      );
    }

    doc.moveDown(2);

    // Module Data Sections
    doc.fontSize(14).font('Helvetica-Bold').text('Module Data');
    doc.moveDown(1);

    const sortedModules = Array.from(moduleGroups.keys()).sort((a, b) => a - b);

    for (const moduleNumber of sortedModules) {
      const moduleFields = moduleGroups.get(moduleNumber)!;
      const moduleName = moduleFields[0]?.module_name || `Module ${moduleNumber}`;

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold').text(`${moduleName}`);
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica');

      for (const field of moduleFields) {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        const label = field.field_label || field.field_path;
        const value = formatFieldValue(field.value);
        const isRequired = field.required ? ' *' : '';

        doc.font('Helvetica-Bold').text(`${label}${isRequired}:`, {
          continued: false,
        });

        doc.font('Helvetica').text(`  ${value}`, {
          indent: 20,
        });

        // Show confidence score if available and low
        if (field.confidence_score !== null && field.confidence_score < 0.9) {
          doc
            .fontSize(8)
            .fillColor('#666666')
            .text(
              `  (Confidence: ${Math.round(field.confidence_score * 100)}%)`,
              {
                indent: 20,
              }
            );
          doc.fillColor('#000000').fontSize(9);
        }

        doc.moveDown(0.3);
      }

      doc.moveDown(1);
    }

    // Certification Statement
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.moveDown(2);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Certification Statement', { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');

    const certificationText = `This document certifies that all required information for this agricultural certification application has been collected, verified, and audited according to established protocols. All required documents have been reviewed, all mandatory fields have been populated, and all low-confidence extractions have been manually reviewed and confirmed.

This certification is issued by the authorized analyst and represents that the application meets all requirements for agricultural certification as of the date specified above.`;

    doc.text(certificationText, {
      align: 'justify',
      indent: 30,
    });

    doc.moveDown(2);

    // Analyst Information
    if (application.certified_by) {
      doc.fontSize(10).font('Helvetica');
      addField(doc, 'Certified By (Analyst ID)', application.certified_by);
      if (application.certified_at) {
        addField(
          doc,
          'Certification Date',
          new Date(application.certified_at).toLocaleString()
        );
      }
    }

    // Footer with page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 30,
          {
            align: 'center',
          }
        );
    }

    doc.end();
  });
}

/**
 * Helper to add a field to the PDF
 */
function addField(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.font('Helvetica-Bold').text(`${label}: `, {
    continued: true,
  });
  doc.font('Helvetica').text(value);
}

/**
 * Format field values for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '(Not provided)';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'string' && value.trim() === '') {
    return '(Empty)';
  }

  return String(value);
}
