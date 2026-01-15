import { logger } from '../../core/logging';
import { getDatabase } from '../../core/database';
import { FieldConfidence, DocumentConfidence } from './confidence.service';

/**
 * Auto-accept configuration
 */
export interface AutoAcceptConfig {
  /** Confidence threshold for auto-accept (default: 0.90) */
  threshold: number;
  /** Enable/disable auto-accept globally */
  enabled: boolean;
  /** Field-specific overrides (field name -> threshold) */
  fieldOverrides: Record<string, number>;
}

/**
 * Auto-accept decision metadata
 */
export interface AutoAcceptDecision {
  field_name: string;
  value: any;
  confidence: number;
  threshold: number;
  auto_accepted: boolean;
  reason: string;
  decided_at: string;
}

/**
 * Auto-accept result for a document
 */
export interface AutoAcceptResult {
  document_id: string;
  application_id: string;
  auto_accepted_fields: Array<{
    field_name: string;
    value: any;
    confidence: number;
  }>;
  flagged_for_review: Array<{
    field_name: string;
    value: any;
    confidence: number;
    reason: string;
  }>;
  decisions: AutoAcceptDecision[];
  summary: {
    total_fields: number;
    auto_accepted_count: number;
    flagged_count: number;
    applied_at: string;
  };
}

/**
 * AutoAcceptService
 *
 * Automatically populates module fields with high-confidence AI extractions.
 * Flags lower-confidence fields for manual review.
 *
 * Key Features:
 * - Auto-applies fields ≥90% confidence to module_data
 * - Flags fields <90% for analyst review
 * - Tracks source as 'ai_extracted'
 * - Logs all auto-accept decisions for audit trail
 * - Supports field-specific threshold overrides
 * - Configurable threshold
 */
export class AutoAcceptService {
  private config: AutoAcceptConfig;

  constructor(config?: Partial<AutoAcceptConfig>) {
    this.config = {
      threshold: config?.threshold || 0.90,
      enabled: config?.enabled !== undefined ? config.enabled : true,
      fieldOverrides: config?.fieldOverrides || {},
    };

    logger.info('AutoAcceptService initialized', {
      threshold: this.config.threshold,
      enabled: this.config.enabled,
      field_overrides_count: Object.keys(this.config.fieldOverrides).length,
    });
  }

  /**
   * Process document extraction and auto-apply high-confidence fields
   */
  async processExtraction(
    documentId: string,
    applicationId: string,
    documentConfidence: DocumentConfidence,
    extractedFields: Record<string, any>
  ): Promise<AutoAcceptResult> {
    logger.info('Processing auto-accept for document', {
      document_id: documentId,
      application_id: applicationId,
      overall_confidence: documentConfidence.overall_confidence,
      field_count: documentConfidence.field_confidences.length,
    });

    if (!this.config.enabled) {
      logger.warn('Auto-accept is disabled - no fields will be auto-applied');
      return this.createDisabledResult(documentId, applicationId, documentConfidence);
    }

    const decisions: AutoAcceptDecision[] = [];
    const autoAcceptedFields: Array<{ field_name: string; value: any; confidence: number }> = [];
    const flaggedForReview: Array<{ field_name: string; value: any; confidence: number; reason: string }> = [];

    // Process each field
    for (const fieldConfidence of documentConfidence.field_confidences) {
      const decision = this.makeDecision(fieldConfidence, extractedFields);
      decisions.push(decision);

      if (decision.auto_accepted) {
        autoAcceptedFields.push({
          field_name: decision.field_name,
          value: decision.value,
          confidence: decision.confidence,
        });
      } else {
        flaggedForReview.push({
          field_name: decision.field_name,
          value: decision.value,
          confidence: decision.confidence,
          reason: decision.reason,
        });
      }
    }

    // Apply auto-accepted fields to module_data
    if (autoAcceptedFields.length > 0) {
      await this.applyFieldsToModuleData(
        applicationId,
        documentId,
        autoAcceptedFields
      );
    }

    // Log decisions to audit trail
    await this.logDecisions(documentId, applicationId, decisions);

    const result: AutoAcceptResult = {
      document_id: documentId,
      application_id: applicationId,
      auto_accepted_fields: autoAcceptedFields,
      flagged_for_review: flaggedForReview,
      decisions,
      summary: {
        total_fields: decisions.length,
        auto_accepted_count: autoAcceptedFields.length,
        flagged_count: flaggedForReview.length,
        applied_at: new Date().toISOString(),
      },
    };

    logger.info('Auto-accept processing complete', {
      document_id: documentId,
      auto_accepted: autoAcceptedFields.length,
      flagged: flaggedForReview.length,
      acceptance_rate: `${((autoAcceptedFields.length / decisions.length) * 100).toFixed(1)}%`,
    });

    return result;
  }

  /**
   * Make auto-accept decision for a single field
   */
  private makeDecision(
    fieldConfidence: FieldConfidence,
    extractedFields: Record<string, any>
  ): AutoAcceptDecision {
    const fieldName = fieldConfidence.field_name;
    const value = this.getFieldValue(extractedFields, fieldName);
    const confidence = fieldConfidence.adjusted_score;

    // Get threshold (use field-specific override if exists)
    const threshold = this.config.fieldOverrides[fieldName] || this.config.threshold;

    // Make decision
    const autoAccepted = confidence >= threshold;
    const reason = this.getDecisionReason(confidence, threshold, fieldConfidence);

    return {
      field_name: fieldName,
      value,
      confidence,
      threshold,
      auto_accepted: autoAccepted,
      reason,
      decided_at: new Date().toISOString(),
    };
  }

  /**
   * Get decision reason explanation
   */
  private getDecisionReason(
    confidence: number,
    threshold: number,
    fieldConfidence: FieldConfidence
  ): string {
    if (confidence >= threshold) {
      return `Auto-accepted: confidence ${(confidence * 100).toFixed(1)}% ≥ threshold ${(threshold * 100)}%`;
    }

    const confidenceLevel = fieldConfidence.confidence_level;
    if (confidenceLevel === 'medium') {
      return `Flagged for review: medium confidence ${(confidence * 100).toFixed(1)}% (requires manual verification)`;
    }

    return `Flagged for review: low confidence ${(confidence * 100).toFixed(1)}% (requires correction)`;
  }

  /**
   * Get field value from nested object using dot notation
   */
  private getFieldValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let value: any = obj;

    for (const part of parts) {
      // Handle array indices like "items[0]"
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        value = value?.[key]?.[parseInt(index, 10)];
      } else {
        value = value?.[part];
      }

      if (value === undefined) {
        return null;
      }
    }

    return value;
  }

  /**
   * Apply auto-accepted fields to module_data table
   */
  private async applyFieldsToModuleData(
    applicationId: string,
    documentId: string,
    fields: Array<{ field_name: string; value: any; confidence: number }>
  ): Promise<void> {
    const db = getDatabase();

    logger.info('Applying auto-accepted fields to module_data', {
      application_id: applicationId,
      document_id: documentId,
      field_count: fields.length,
    });

    for (const field of fields) {
      try {
        // Insert or update module_data record
        await db
          .from('module_data')
          .upsert({
            application_id: applicationId,
            field_name: field.field_name,
            field_value: field.value,
            source: 'ai_extracted',
            source_document_id: documentId,
            confidence_score: field.confidence,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'application_id,field_name',
            ignoreDuplicates: false,
          });

        logger.debug('Field applied to module_data', {
          application_id: applicationId,
          field_name: field.field_name,
          confidence: field.confidence,
        });
      } catch (error) {
        logger.error('Failed to apply field to module_data', {
          application_id: applicationId,
          field_name: field.field_name,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other fields even if one fails
      }
    }
  }

  /**
   * Log auto-accept decisions to audit trail
   */
  private async logDecisions(
    documentId: string,
    applicationId: string,
    decisions: AutoAcceptDecision[]
  ): Promise<void> {
    const db = getDatabase();

    logger.info('Logging auto-accept decisions to audit trail', {
      document_id: documentId,
      application_id: applicationId,
      decision_count: decisions.length,
    });

    try {
      // Log single audit entry with all decisions
      await db
        .from('audit_trail')
        .insert({
          application_id: applicationId,
          action_type: 'auto_accept_decision',
          performed_by: 'system',
          details: {
            document_id: documentId,
            decisions: decisions,
            auto_accepted_count: decisions.filter(d => d.auto_accepted).length,
            flagged_count: decisions.filter(d => !d.auto_accepted).length,
            threshold: this.config.threshold,
          },
          timestamp: new Date().toISOString(),
        });

      logger.debug('Auto-accept decisions logged to audit trail');
    } catch (error) {
      logger.error('Failed to log decisions to audit trail', {
        document_id: documentId,
        application_id: applicationId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Non-critical - don't fail the whole operation
    }
  }

  /**
   * Create result for when auto-accept is disabled
   */
  private createDisabledResult(
    documentId: string,
    applicationId: string,
    documentConfidence: DocumentConfidence
  ): AutoAcceptResult {
    const decisions: AutoAcceptDecision[] = documentConfidence.field_confidences.map(fc => ({
      field_name: fc.field_name,
      value: null,
      confidence: fc.adjusted_score,
      threshold: this.config.threshold,
      auto_accepted: false,
      reason: 'Auto-accept is disabled',
      decided_at: new Date().toISOString(),
    }));

    return {
      document_id: documentId,
      application_id: applicationId,
      auto_accepted_fields: [],
      flagged_for_review: documentConfidence.field_confidences.map(fc => ({
        field_name: fc.field_name,
        value: null,
        confidence: fc.adjusted_score,
        reason: 'Auto-accept disabled - all fields require manual review',
      })),
      decisions,
      summary: {
        total_fields: decisions.length,
        auto_accepted_count: 0,
        flagged_count: decisions.length,
        applied_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoAcceptConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('AutoAcceptService configuration updated', {
      threshold: this.config.threshold,
      enabled: this.config.enabled,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoAcceptConfig {
    return { ...this.config };
  }

  /**
   * Set field-specific threshold override
   */
  setFieldThreshold(fieldName: string, threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }

    this.config.fieldOverrides[fieldName] = threshold;

    logger.info('Field-specific threshold set', {
      field_name: fieldName,
      threshold,
    });
  }

  /**
   * Remove field-specific threshold override
   */
  removeFieldThreshold(fieldName: string): void {
    delete this.config.fieldOverrides[fieldName];

    logger.info('Field-specific threshold removed', {
      field_name: fieldName,
    });
  }

  /**
   * Get all field-specific thresholds
   */
  getFieldThresholds(): Record<string, number> {
    return { ...this.config.fieldOverrides };
  }
}

// Singleton instance
let autoAcceptServiceInstance: AutoAcceptService | null = null;

export function getAutoAcceptService(): AutoAcceptService {
  if (!autoAcceptServiceInstance) {
    autoAcceptServiceInstance = new AutoAcceptService();
  }
  return autoAcceptServiceInstance;
}
