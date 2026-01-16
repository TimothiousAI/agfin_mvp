import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../../core/database';
import { requireAuth, getAuth } from '../../core/middleware';
import { z } from 'zod';
import { getDoclingService } from './docling.service';
import { getExtractionService } from './extraction.service';
import { logger } from '../../core/logging';

const router = Router();

// Valid document types for AgFin MVP
const DOCUMENT_TYPES = [
  'drivers_license',
  'schedule_f',
  'organization_docs',
  'balance_sheet',
  'fsa_578',
  'crop_insurance_current',
  'crop_insurance_prior',
  'lease_agreement',
  'equipment_list'
] as const;

// Validation schema for upload URL request
const uploadUrlSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES),
  application_id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  content_type: z.string().regex(/^(application\/pdf|image\/(png|jpeg|jpg))$/i)
});

/**
 * POST /api/documents/upload-url
 * Generate presigned URL for document upload to Supabase Storage
 */
router.post('/upload-url', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth - works with both Clerk and mock auth in development
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate request body
    const validation = uploadUrlSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: validation.error.issues
      });
      return;
    }

    const { document_type, application_id, filename, content_type } = validation.data;

    const supabase = getSupabaseAdmin();

    // Verify application exists and user has access
    const { data: application, error: appError } = await (supabase.from('applications') as any)
      .select('id, analyst_id')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Verify user owns this application
    if (application.analyst_id !== auth.userId) {
      res.status(403).json({ error: 'Access denied to this application' });
      return;
    }

    // Generate unique storage path: applications/{application_id}/{document_type}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `applications/${application_id}/${document_type}/${timestamp}_${sanitizedFilename}`;

    // Create pending document record
    const { data: document, error: docError } = await (supabase.from('documents') as any)
      .insert({
        application_id,
        document_type: 'other', // Map to existing enum until migration updates
        storage_path: storagePath,
        extraction_status: 'pending',
        metadata: {
          original_filename: filename,
          content_type,
          agfin_document_type: document_type, // Store the actual type in metadata
          upload_initiated_at: new Date().toISOString(),
          uploaded_by: auth.userId
        }
      })
      .select()
      .single();

    if (docError || !document) {
      console.error('Failed to create document record:', docError);
      res.status(500).json({ error: 'Failed to create document record' });
      return;
    }

    // Generate presigned URL for upload (15 minutes expiry)
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .createSignedUploadUrl(storagePath, {
        upsert: false // Don't allow overwriting existing files
      });

    if (uploadError || !uploadData) {
      console.error('Failed to generate upload URL:', uploadError);

      // Clean up the document record we just created
      await (supabase.from('documents') as any)
        .delete()
        .eq('id', document.id);

      res.status(500).json({ error: 'Failed to generate upload URL' });
      return;
    }

    res.status(200).json({
      document_id: document.id,
      upload_url: uploadData.signedUrl,
      storage_path: storagePath,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      token: uploadData.token
    });

  } catch (error) {
    console.error('Upload URL generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/documents/:id
 * Retrieve document metadata and status
 */
router.get('/:id', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = String(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      res.status(400).json({ error: 'Invalid document ID format' });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch document with application info
    const { data: document, error: docError } = await (supabase.from('documents') as any)
      .select(`
        id,
        application_id,
        document_type,
        storage_path,
        extraction_status,
        confidence_score,
        extracted_data,
        metadata,
        created_at,
        updated_at,
        applications!inner (
          id,
          analyst_id
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Verify user has access to this document's application
    // @ts-ignore - TypeScript doesn't know about the joined applications table
    if (document.applications.analyst_id !== auth.userId) {
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    // Generate signed URL for viewing (1 hour expiry)
    let viewUrl: string | null = null;
    if (document.storage_path && document.extraction_status !== 'pending') {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(document.storage_path, 3600); // 1 hour

      if (!urlError && urlData) {
        viewUrl = urlData.signedUrl;
      }
    }

    // Build response
    const response = {
      id: document.id,
      application_id: document.application_id,
      document_type: document.document_type,
      agfin_document_type: document.metadata?.agfin_document_type || null,
      original_filename: document.metadata?.original_filename || null,
      storage_path: document.storage_path,
      view_url: viewUrl,
      extraction_status: document.extraction_status,
      confidence_score: document.confidence_score,
      has_extracted_data: !!document.extracted_data,
      metadata: {
        content_type: document.metadata?.content_type,
        upload_initiated_at: document.metadata?.upload_initiated_at,
        uploaded_by: document.metadata?.uploaded_by,
        file_size: document.metadata?.file_size,
      },
      created_at: document.created_at,
      updated_at: document.updated_at,
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/documents/:id/process
 * Trigger document processing with Docling OCR service
 */
router.post('/:id/process', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = String(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      res.status(400).json({ error: 'Invalid document ID format' });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch document with application info
    const { data: document, error: docError } = await (supabase.from('documents') as any)
      .select(`
        id,
        application_id,
        document_type,
        storage_path,
        extraction_status,
        metadata,
        applications!inner (
          id,
          analyst_id
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      logger.warn('Document not found for processing', { document_id: documentId });
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Verify user has access to this document's application
    // @ts-ignore
    if (document.applications.analyst_id !== auth.userId) {
      logger.warn('Access denied to document', {
        document_id: documentId,
        user_id: auth.userId,
      });
      res.status(403).json({ error: 'Access denied to this document' });
      return;
    }

    // Verify document is uploaded (not pending)
    if (document.extraction_status === 'pending') {
      logger.warn('Document not yet uploaded', { document_id: documentId });
      res.status(400).json({
        error: 'Document upload not complete',
        message: 'Please complete the upload before processing',
      });
      return;
    }

    // Verify document is not already processing
    if (document.extraction_status === 'processing') {
      logger.info('Document already processing', { document_id: documentId });
      res.status(409).json({
        error: 'Document already processing',
        message: 'This document is currently being processed',
      });
      return;
    }

    // Update status to processing
    const { error: updateError } = await (supabase.from('documents') as any)
      .update({
        extraction_status: 'processing',
        metadata: {
          ...document.metadata,
          processing_started_at: new Date().toISOString(),
        },
      })
      .eq('id', documentId);

    if (updateError) {
      logger.error('Failed to update document status', {
        document_id: documentId,
        error: updateError,
      });
      res.status(500).json({ error: 'Failed to start processing' });
      return;
    }

    // Generate signed URL for Docling to access the document
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(document.storage_path, 7200); // 2 hours for processing

    if (urlError || !urlData) {
      logger.error('Failed to generate document URL for processing', {
        document_id: documentId,
        error: urlError,
      });

      // Revert status back
      await (supabase.from('documents') as any)
        .update({ extraction_status: 'uploaded' })
        .eq('id', documentId);

      res.status(500).json({ error: 'Failed to generate document URL' });
      return;
    }

    logger.info('Starting document processing', {
      document_id: documentId,
      storage_path: document.storage_path,
      document_type: document.metadata?.agfin_document_type,
    });

    // Start async processing (don't await - fire and forget)
    processDocumentAsync(documentId, urlData.signedUrl, document.metadata?.agfin_document_type)
      .catch((error) => {
        logger.error('Async document processing failed', {
          document_id: documentId,
          error: error.message,
        });
      });

    // Return immediately with processing started status
    res.status(202).json({
      message: 'Document processing started',
      document_id: documentId,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 120000).toISOString(), // ~2 minutes
    });

  } catch (error) {
    logger.error('Document processing endpoint error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Async function to process document with Docling service
 */
async function processDocumentAsync(
  documentId: string,
  documentUrl: string,
  documentType?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const doclingService = getDoclingService();

  try {
    logger.info('Processing document with Docling', {
      document_id: documentId,
      document_type: documentType,
    });

    // Process document with Docling
    const result = await doclingService.processDocument({
      document_url: documentUrl,
      document_type: documentType,
      options: {
        extract_text: true,
        extract_tables: true,
        extract_images: false, // Can be enabled if needed
      },
    });

    // Update document with extracted data
    const { error: updateError } = await (supabase.from('documents') as any)
      .update({
        extraction_status: 'completed',
        extracted_data: result.result,
        confidence_score: result.result?.metadata?.confidence || null,
        metadata: {
          ...((await (supabase.from('documents') as any).select('metadata').eq('id', documentId).single()).data?.metadata || {}),
          processing_completed_at: new Date().toISOString(),
          docling_job_id: result.job_id,
        },
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    logger.info('Document processing completed successfully', {
      document_id: documentId,
      job_id: result.job_id,
    });

  } catch (error) {
    logger.error('Document processing failed', {
      document_id: documentId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Update document status to failed
    await (supabase.from('documents') as any)
      .update({
        extraction_status: 'failed',
        metadata: {
          ...((await (supabase.from('documents') as any).select('metadata').eq('id', documentId).single()).data?.metadata || {}),
          processing_failed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .eq('id', documentId);
  }
}

/**
 * GET /api/documents/:id/extraction
 * Get extracted fields from a processed document
 */
router.get('/:id/extraction', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = String(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      res.status(400).json({ error: 'Invalid document ID format' });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch document with application info to verify ownership
    const { data: document, error: docError } = await (supabase.from('documents') as any)
      .select(`
        id,
        application_id,
        document_type,
        extraction_status,
        extracted_data,
        confidence_score,
        metadata,
        created_at,
        updated_at,
        applications!inner(analyst_id)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      logger.warn('Document not found for extraction', {
        document_id: documentId,
        error: docError,
      });
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Verify ownership
    // @ts-ignore
    if (document.applications.analyst_id !== auth.userId) {
      logger.warn('Unauthorized extraction access attempt', {
        document_id: documentId,
        user_id: auth.userId,
      });
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Validate document is processed
    if (document.extraction_status !== 'completed' && document.extraction_status !== 'processed') {
      res.status(400).json({
        error: 'Document has not been processed yet',
        status: document.extraction_status,
        message:
          document.extraction_status === 'processing'
            ? 'Document is currently being processed. Please try again later.'
            : document.extraction_status === 'failed'
            ? 'Document processing failed. Please retry processing.'
            : 'Please process the document first.',
      });
      return;
    }

    // Check if extracted_data exists
    if (!document.extracted_data) {
      res.status(404).json({
        error: 'No extracted data available',
        message: 'Document was processed but no extraction data is available.',
      });
      return;
    }

    logger.info('Retrieving document extraction', {
      document_id: documentId,
      document_type: document.document_type,
    });

    // Build extraction response
    const response = {
      document_id: document.id,
      application_id: document.application_id,
      document_type: document.document_type,
      agfin_document_type: document.metadata?.agfin_document_type || null,
      extraction_status: document.extraction_status,

      // Extracted fields
      extracted_fields: document.extracted_data,

      // Confidence scores
      overall_confidence: document.confidence_score,

      // Source document reference
      source_document: {
        id: document.id,
        original_filename: document.metadata?.original_filename || null,
        storage_path: null, // Don't expose storage path
      },

      // Timestamps
      extraction_metadata: {
        extracted_at: document.metadata?.processing_completed_at || document.updated_at,
        document_uploaded_at: document.created_at,
        last_updated: document.updated_at,
      },
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Document extraction retrieval error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/documents/:id/extraction-failures
 * Get extraction failure information for a document
 */
router.get('/:id/extraction-failures', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = String(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      res.status(400).json({ error: 'Invalid document ID format' });
      return;
    }

    const extractionService = getExtractionService();
    const failureInfo = extractionService.getFailureInfo(documentId);

    if (!failureInfo) {
      res.status(404).json({
        error: 'No failure information found',
        message: 'This document has no recorded extraction failures.'
      });
      return;
    }

    res.status(200).json({
      document_id: failureInfo.document_id,
      attempt_count: failureInfo.attempt_count,
      last_attempt_at: failureInfo.last_attempt_at,
      error_messages: failureInfo.error_messages,
      can_bypass: failureInfo.can_bypass,
      bypass_message: failureInfo.can_bypass
        ? 'Manual entry is now available as a fallback option.'
        : `${3 - failureInfo.attempt_count} more attempt(s) before manual entry becomes available.`,
    });

  } catch (error) {
    logger.error('Extraction failure retrieval error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/documents/:id/bypass-extraction
 * Bypass extraction and enable manual data entry
 */
router.post('/:id/bypass-extraction', requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get auth
    // @ts-ignore
    const auth = req.auth || getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = String(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      res.status(400).json({ error: 'Invalid document ID format' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const extractionService = getExtractionService();

    // Check if bypass is allowed
    if (!extractionService.canBypass(documentId)) {
      const failureInfo = extractionService.getFailureInfo(documentId);
      const remainingAttempts = failureInfo ? 3 - failureInfo.attempt_count : 3;

      res.status(403).json({
        error: 'Bypass not allowed yet',
        message: `You must attempt extraction ${remainingAttempts} more time(s) before bypass is allowed.`,
        attempt_count: failureInfo?.attempt_count || 0,
        required_attempts: 3,
      });
      return;
    }

    // Fetch document to verify ownership
    const { data: document, error: docError } = await (supabase.from('documents') as any)
      .select(`
        id,
        application_id,
        applications!inner(analyst_id)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Verify ownership
    // @ts-ignore
    if (document.applications.analyst_id !== auth.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Update document to manual entry mode
    const { error: updateError } = await (supabase.from('documents') as any)
      .update({
        extraction_status: 'manual_entry',
        metadata: {
          ...((await (supabase.from('documents') as any).select('metadata').eq('id', documentId).single()).data?.metadata || {}),
          bypassed_at: new Date().toISOString(),
          bypassed_by: auth.userId,
        },
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    // Clear failure tracking
    extractionService.resetFailureTracking(documentId);

    logger.info('Extraction bypassed - manual entry enabled', {
      document_id: documentId,
      user_id: auth.userId,
    });

    res.status(200).json({
      message: 'Extraction bypassed successfully',
      document_id: documentId,
      status: 'manual_entry',
      next_step: 'Manual data entry is now enabled for this document.',
    });

  } catch (error) {
    logger.error('Bypass extraction error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
