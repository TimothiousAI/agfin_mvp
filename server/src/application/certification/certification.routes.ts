import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, getAuth } from '../../auth/middleware';
import { validateBody, validateParams } from '../../shared/middleware/validate';
import { logger } from '../../core/logging';
import {
  validateCertificationReadiness,
  certifyApplication,
  getCertificationStatus,
} from './certification.service';
import { logStatusTransition } from '../audit/audit.service';
import { generateCertificationPDF, getCertificationPDF } from './pdf.service';
import {
  exportAuditTrailCSV,
  exportModuleDataCSV,
  exportApplicationDataCSV,
  createExportPackage,
} from './export.service';

const router = Router();

/**
 * UUID parameter validation schema
 */
const UUIDParamSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID format'),
});

/**
 * Certification request body schema
 */
const CertificationRequestSchema = z.object({
  certification_confirmed: z.boolean().refine((val) => val === true, {
    message: 'Certification must be explicitly confirmed',
  }),
});

/**
 * GET /api/certification/:applicationId/status
 * Get certification readiness status for an application
 */
router.get(
  '/:applicationId/status',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Fetching certification status', { applicationId, userId });

      const status = await getCertificationStatus(applicationId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error fetching certification status', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to fetch certification status',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/validate
 * Validate certification readiness (detailed validation result)
 */
router.get(
  '/:applicationId/validate',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Validating certification readiness', { applicationId, userId });

      const validation = await validateCertificationReadiness(applicationId);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error('Error validating certification', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to validate certification',
      });
    }
  }
);

/**
 * POST /api/certification/:applicationId/certify
 * Certify an application (final step before locking)
 *
 * Flow:
 * 1. Validate certification gate (all documents audited, fields complete, etc.)
 * 2. Require explicit certification_confirmed: true in body
 * 3. Update application status to 'locked'
 * 4. Create audit trail entry for certification
 * 5. Trigger PDF generation (placeholder for now)
 * 6. Return certification confirmation
 */
router.post(
  '/:applicationId/certify',
  requireAuth(),
  validateParams(UUIDParamSchema),
  validateBody(CertificationRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { certification_confirmed } = req.body;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Certification request received', {
        applicationId,
        userId,
        confirmed: certification_confirmed,
      });

      // 1. Validate certification gate
      const validation = await validateCertificationReadiness(applicationId);

      if (!validation.isValid) {
        logger.warn('Certification validation failed', {
          applicationId,
          blockerCount: validation.blockers.length,
        });

        res.status(400).json({
          error: 'Validation failed',
          message: 'Application does not meet certification requirements',
          data: {
            isValid: false,
            blockers: validation.blockers,
            stats: {
              documentsAudited: validation.documentsAudited,
              totalDocuments: validation.totalDocuments,
              requiredFieldsPopulated: validation.requiredFieldsPopulated,
              totalRequiredFields: validation.totalRequiredFields,
              lowConfidenceFieldsReviewed: validation.lowConfidenceFieldsReviewed,
              totalLowConfidenceFields: validation.totalLowConfidenceFields,
            },
          },
        });
        return;
      }

      // 2. Certification confirmed check (already validated by schema)
      // certification_confirmed must be true to reach here

      // 3. Certify application (updates status to 'certified')
      const application = await certifyApplication(applicationId, userId);

      // 4. Create audit trail entry for certification
      await logStatusTransition({
        application_id: applicationId,
        user_id: userId,
        old_status: 'awaiting_audit', // or get from application
        new_status: 'certified',
      });

      // Additional audit entry for the certification action itself
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      await supabase.from('audit_trail').insert({
        application_id: applicationId,
        user_id: userId,
        field_id: null,
        old_value: null,
        new_value: null,
        justification: null,
        action: 'application_certified',
      });

      // 5. Generate certification PDF
      let pdfUrl: string | null = null;
      let pdfError: string | null = null;
      try {
        pdfUrl = await generateCertificationPDF(applicationId);
        logger.info('PDF generated successfully', { applicationId, pdfUrl });
      } catch (pdfGenerationError) {
        logger.error('PDF generation failed', {
          applicationId,
          error: pdfGenerationError instanceof Error ? pdfGenerationError.message : 'Unknown error',
        });
        pdfError = pdfGenerationError instanceof Error ? pdfGenerationError.message : 'PDF generation failed';
      }

      // 6. Return certification confirmation
      logger.info('Application certified successfully', {
        applicationId,
        userId,
        certifiedAt: application.certified_at,
      });

      res.json({
        success: true,
        message: 'Application certified successfully',
        data: {
          application,
          certificationTimestamp: application.certified_at,
          certifiedBy: application.certified_by,
          pdfGeneration: {
            status: pdfUrl ? 'completed' : 'failed',
            message: pdfUrl ? 'PDF generated successfully' : pdfError || 'PDF generation failed',
            url: pdfUrl,
          },
        },
      });
    } catch (error) {
      logger.error('Error certifying application', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's a validation error
      if (error instanceof Error && error.message.includes('cannot be certified')) {
        res.status(400).json({
          error: 'Certification failed',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to certify application',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/pdf
 * Get PDF for a certified application
 *
 * Returns a presigned download URL for the certification PDF.
 * If PDF doesn't exist, generates it automatically.
 * Supports optional ?regenerate=true to force regeneration.
 */
router.get(
  '/:applicationId/pdf',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;
      const regenerate = req.query.regenerate === 'true';

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('PDF retrieval requested', { applicationId, userId, regenerate });

      // Verify application is certified
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('status, certified_at')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      if (application.status !== 'certified' && application.status !== 'locked') {
        res.status(400).json({
          error: 'Invalid status',
          message: 'Application must be certified before retrieving PDF',
        });
        return;
      }

      // Get or generate PDF
      const pdfUrl = await getCertificationPDF(applicationId, regenerate);

      logger.info('PDF URL retrieved', { applicationId, pdfUrl });

      res.json({
        success: true,
        message: regenerate ? 'PDF regenerated successfully' : 'PDF retrieved successfully',
        data: {
          pdfUrl,
          applicationId,
          timestamp: new Date().toISOString(),
          cached: !regenerate,
        },
      });
    } catch (error) {
      logger.error('Error retrieving PDF', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to retrieve PDF',
      });
    }
  }
);

/**
 * POST /api/certification/:applicationId/generate-pdf
 * Generate PDF for a certified application
 *
 * This endpoint can be used to regenerate a PDF for an already certified application,
 * or to generate one if the initial generation failed.
 */
router.post(
  '/:applicationId/generate-pdf',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('PDF generation requested', { applicationId, userId });

      // Verify application is certified
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('status, certified_at')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      if (application.status !== 'certified' && application.status !== 'locked') {
        res.status(400).json({
          error: 'Invalid status',
          message: 'Application must be certified before generating PDF',
        });
        return;
      }

      // Generate PDF
      const pdfUrl = await generateCertificationPDF(applicationId);

      logger.info('PDF generated successfully', { applicationId, pdfUrl });

      res.json({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfUrl,
          applicationId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error generating PDF', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/export/audit-trail
 * Export audit trail as CSV
 *
 * Returns a CSV file containing all audit trail entries for the application.
 * Includes timestamps, user IDs, before/after values, and justifications.
 */
router.get(
  '/:applicationId/export/audit-trail',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Audit trail CSV export requested', { applicationId, userId });

      // Verify application exists
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('id, farmer_name')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      // Generate CSV
      const csv = await exportAuditTrailCSV(applicationId);

      // Set headers for CSV download
      const filename = `audit-trail-${applicationId}-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Audit trail CSV generated', { applicationId, filename });

      res.send(csv);
    } catch (error) {
      logger.error('Error exporting audit trail', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to export audit trail',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/export/module-data
 * Export module data as CSV
 *
 * Returns a CSV file containing all module field data for the application.
 */
router.get(
  '/:applicationId/export/module-data',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Module data CSV export requested', { applicationId, userId });

      // Verify application exists
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      // Generate CSV
      const csv = await exportModuleDataCSV(applicationId);

      // Set headers for CSV download
      const filename = `module-data-${applicationId}-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Module data CSV generated', { applicationId, filename });

      res.send(csv);
    } catch (error) {
      logger.error('Error exporting module data', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to export module data',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/export
 * Export complete application package as ZIP
 *
 * Returns a ZIP file containing:
 * - Certification PDF (if available)
 * - Audit trail CSV
 * - Module data CSV
 * - Application summary CSV
 * - README file
 */
router.get(
  '/:applicationId/export',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('ZIP export package requested', { applicationId, userId });

      // Verify application exists
      const { getSupabaseAdmin } = await import('../../core/database');
      const supabase = getSupabaseAdmin();
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('id, farmer_name')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      // Create ZIP package
      const archive = await createExportPackage(applicationId);

      // Set headers for ZIP download
      const filename = `application-${applicationId}-${Date.now()}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('ZIP export package created', { applicationId, filename });

      // Pipe the archive to response
      archive.pipe(res);
    } catch (error) {
      logger.error('Error creating export package', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to create export package',
      });
    }
  }
);

/**
 * GET /api/certification/:applicationId/export/complete
 * Export complete application data as CSV
 *
 * Returns a comprehensive CSV export with application metadata and all module data.
 */
router.get(
  '/:applicationId/export/complete',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found',
        });
        return;
      }

      logger.info('Complete data CSV export requested', { applicationId, userId });

      // Generate CSV
      const csv = await exportApplicationDataCSV(applicationId);

      // Set headers for CSV download
      const filename = `application-${applicationId}-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Complete data CSV generated', { applicationId, filename });

      res.send(csv);
    } catch (error) {
      logger.error('Error exporting complete data', {
        applicationId: req.params.applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to export application data',
      });
    }
  }
);

export default router;
