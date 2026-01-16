import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, getAuth } from '../../core/middleware';
import { getSupabaseAdmin, createAuditTrailEntry } from '../../core/database';
import { logger } from '../../core/logging';
import { getAuditTrailForApplication } from './audit.service';

const router = Router();

/**
 * Frontend justification reasons (from JustificationModal)
 */
const FRONTEND_JUSTIFICATIONS = [
  'ai_extraction_error',
  'document_ambiguity',
  'farmer_provided_correction',
  'data_missing_illegible',
] as const;

/**
 * Database justification reasons (from audit_trail table constraint)
 * Note: Used for reference and mapping validation
 */
// const DB_JUSTIFICATIONS = [
//   'data_quality_issue',
//   'document_illegible',
//   'farmer_provided_correction',
//   'regulatory_requirement',
// ] as const;

/**
 * Map frontend justification to database justification
 */
function mapJustificationToDB(frontend: string): string {
  const mapping: Record<string, string> = {
    'ai_extraction_error': 'data_quality_issue',
    'document_ambiguity': 'document_illegible',
    'farmer_provided_correction': 'farmer_provided_correction',
    'data_missing_illegible': 'document_illegible',
  };
  return mapping[frontend] || frontend;
}

/**
 * Validation schema for field override request
 */
const FieldOverrideSchema = z.object({
  field_id: z.string().min(1, 'Field ID is required'),
  old_value: z.any(),
  new_value: z.any(),
  justification: z.enum(FRONTEND_JUSTIFICATIONS),
  notes: z.string().optional(),
});

/**
 * Validation middleware factory
 */
function validate<T>(schema: z.ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: result.error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    next();
  };
}

/**
 * POST /api/audit/:documentId/override
 * Record field override with justification
 *
 * Creates immutable audit trail entry and updates module_data field
 */
router.post(
  '/:documentId/override',
  requireAuth(),
  validate(FieldOverrideSchema, 'body'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const documentId = String(req.params.documentId);
      const { field_id, old_value, new_value, justification, notes } = req.body;

      logger.info('Field override requested', {
        documentId,
        fieldId: field_id,
        userId,
        justification,
      });

      const supabase = getSupabaseAdmin();

      // Get document to find application_id
      const { data: document, error: docError } = await (supabase
        .from('documents') as any)
        .select('application_id')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        res.status(404).json({
          error: 'Document not found',
          message: `Document with ID ${documentId} does not exist`,
        });
        return;
      }

      const applicationId = document.application_id;

      // Map justification to database format
      const dbJustification = mapJustificationToDB(justification);

      // Create audit trail entry
      const auditEntry = await createAuditTrailEntry({
        application_id: applicationId,
        user_id: userId,
        field_id,
        old_value: old_value !== null && old_value !== undefined ? String(old_value) : null,
        new_value: new_value !== null && new_value !== undefined ? String(new_value) : null,
        justification: dbJustification as any,
        action: notes ? `field_override: ${notes}` : 'field_override',
      });

      logger.info('Audit trail entry created', {
        auditEntryId: auditEntry.id,
        applicationId,
        fieldId: field_id,
      });

      // Update module_data field value
      // Find the module_data record containing this field
      const { data: moduleDataRecords, error: moduleError } = await (supabase
        .from('module_data') as any)
        .select('*')
        .eq('application_id', applicationId);

      if (moduleError) {
        logger.error('Error fetching module data', { error: moduleError });
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch module data',
        });
        return;
      }

      // Find which module_data record contains this field
      let updatedRecord = null;
      for (const record of moduleDataRecords || []) {
        // Check if this record's field_id matches
        if (record.field_id === field_id) {
          // Update the record with new value and source
          const { data: updated, error: updateError } = await (supabase
            .from('module_data') as any)
            .update({
              value: new_value,
              source: 'proxy_edited',
              updated_at: new Date().toISOString(),
            })
            .eq('id', record.id)
            .select()
            .single();

          if (updateError) {
            logger.error('Error updating module data', { error: updateError });
            res.status(500).json({
              error: 'Database error',
              message: 'Failed to update field value',
            });
            return;
          }

          updatedRecord = updated;
          logger.info('Module data updated', {
            moduleDataId: record.id,
            fieldId: field_id,
            newValue: new_value,
          });
          break;
        }
      }

      if (!updatedRecord) {
        logger.warn('Field not found in module data', {
          fieldId: field_id,
          applicationId,
        });
        res.status(404).json({
          error: 'Field not found',
          message: `Field ${field_id} not found in any module data`,
        });
        return;
      }

      // Return success confirmation
      res.json({
        success: true,
        message: 'Field override recorded successfully',
        audit_entry_id: auditEntry.id,
        field_id,
        new_value,
        updated_at: auditEntry.created_at,
      });
    } catch (error) {
      logger.error('Error processing field override', { error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process field override',
      });
    }
  }
);

/**
 * POST /api/audit/:documentId/mark-audited
 * Mark document as audited after all flagged fields reviewed
 *
 * Validates all low-confidence fields have been reviewed before allowing status change
 */
router.post(
  '/:documentId/mark-audited',
  requireAuth(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const documentId = String(req.params.documentId);

      logger.info('Mark document as audited requested', {
        documentId,
        userId,
      });

      const supabase = getSupabaseAdmin();

      // Get document with application_id
      const { data: document, error: docError } = await (supabase
        .from('documents') as any)
        .select('id, application_id, extraction_status, confidence_score')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        res.status(404).json({
          error: 'Document not found',
          message: `Document with ID ${documentId} does not exist`,
        });
        return;
      }

      // Check if already audited
      if (document.extraction_status === 'audited') {
        res.status(400).json({
          error: 'Already audited',
          message: 'Document has already been marked as audited',
        });
        return;
      }

      const applicationId = document.application_id;

      // Get all module_data fields for this application that came from this document
      const { data: moduleDataRecords, error: moduleError } = await (supabase
        .from('module_data') as any)
        .select('*')
        .eq('application_id', applicationId)
        .eq('source_document_id', documentId);

      if (moduleError) {
        logger.error('Error fetching module data', { error: moduleError });
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch module data',
        });
        return;
      }

      // Check for any low-confidence fields (<0.9) that haven't been reviewed
      const unreviewedFields: string[] = [];
      const CONFIDENCE_THRESHOLD = 0.9;

      for (const record of moduleDataRecords || []) {
        const confidenceScore = record.confidence_score;
        const source = record.source;

        // If field has low confidence and hasn't been reviewed/edited
        if (
          confidenceScore !== null &&
          confidenceScore < CONFIDENCE_THRESHOLD &&
          source === 'ai_extracted'
        ) {
          unreviewedFields.push(record.field_id);
        }
      }

      // Prevent marking as audited if unreviewed low-confidence fields exist
      if (unreviewedFields.length > 0) {
        logger.warn('Cannot mark as audited - unreviewed fields exist', {
          documentId,
          unreviewedFields,
        });
        res.status(400).json({
          error: 'Unreviewed fields',
          message: `Cannot mark as audited. ${unreviewedFields.length} field(s) with confidence below 90% have not been reviewed.`,
          unreviewed_fields: unreviewedFields,
        });
        return;
      }

      // Update document status to 'audited'
      const { data: updatedDocument, error: updateError } = await (supabase
        .from('documents') as any)
        .update({
          extraction_status: 'audited',
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating document status', { error: updateError });
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to update document status',
        });
        return;
      }

      // Log audit completion in audit_trail
      const auditEntry = await createAuditTrailEntry({
        application_id: applicationId,
        user_id: userId,
        field_id: null,
        old_value: document.extraction_status,
        new_value: 'audited',
        justification: null,
        action: 'document_audited',
      });

      logger.info('Document marked as audited', {
        documentId,
        applicationId,
        auditEntryId: auditEntry.id,
      });

      // Return updated document status
      res.json({
        success: true,
        message: 'Document marked as audited successfully',
        document: {
          id: updatedDocument.id,
          extraction_status: updatedDocument.extraction_status,
          audited_at: auditEntry.created_at,
          audited_by: userId,
        },
      });
    } catch (error) {
      logger.error('Error marking document as audited', { error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark document as audited',
      });
    }
  }
);

/**
 * GET /api/audit/:applicationId
 * Retrieve complete audit trail for an application
 *
 * Query params:
 * - limit: number (optional, default 50) - Max entries per page
 * - offset: number (optional, default 0) - Pagination offset
 *
 * Returns all audit entries sorted by timestamp (newest first)
 */
router.get(
  '/:applicationId',
  requireAuth(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const applicationId = String(req.params.applicationId);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

      // Validate pagination params
      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Invalid pagination',
          message: 'Limit must be between 1 and 100'
        });
        return;
      }

      if (isNaN(offset) || offset < 0) {
        res.status(400).json({
          error: 'Invalid pagination',
          message: 'Offset must be 0 or greater'
        });
        return;
      }

      logger.info('Fetching audit trail', {
        applicationId,
        userId,
        limit,
        offset,
      });

      // Get audit trail from service
      const result = await getAuditTrailForApplication(applicationId, {
        limit,
        offset,
      });

      // Return paginated results
      res.json({
        success: true,
        data: {
          entries: result.entries,
          pagination: {
            total: result.total,
            limit,
            offset,
            has_more: offset + limit < result.total,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching audit trail', { error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch audit trail',
      });
    }
  }
);

export default router;
