import { logger } from '../../core/logging';

/**
 * Confidence scoring configuration
 */
export interface ConfidenceConfig {
  /** Base confidence threshold for auto-accept (default: 0.90) */
  autoAcceptThreshold: number;
  /** Field-type specific adjustments */
  fieldTypeAdjustments: Record<string, number>;
  /** Document-type specific adjustments */
  documentTypeAdjustments: Record<string, number>;
}

/**
 * Field confidence score with metadata
 */
export interface FieldConfidence {
  field_name: string;
  raw_score: number;
  adjusted_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  field_type?: string;
  adjustments_applied: Array<{
    type: 'field_type' | 'document_type' | 'value_quality';
    adjustment: number;
    reason: string;
  }>;
}

/**
 * Document confidence summary
 */
export interface DocumentConfidence {
  overall_confidence: number;
  confidence_level: 'high' | 'medium' | 'low';
  field_confidences: FieldConfidence[];
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  auto_accept_eligible: boolean;
  calculated_at: string;
}

/**
 * ConfidenceService
 *
 * Calculates field-level and document-level confidence scores.
 * Applies field-type and document-type specific adjustments.
 * Determines auto-accept eligibility based on threshold.
 */
export class ConfidenceService {
  private config: ConfidenceConfig;

  constructor(config?: Partial<ConfidenceConfig>) {
    this.config = {
      autoAcceptThreshold: config?.autoAcceptThreshold || 0.90,
      fieldTypeAdjustments: config?.fieldTypeAdjustments || this.getDefaultFieldTypeAdjustments(),
      documentTypeAdjustments: config?.documentTypeAdjustments || this.getDefaultDocumentTypeAdjustments(),
    };

    logger.info('ConfidenceService initialized', {
      auto_accept_threshold: this.config.autoAcceptThreshold,
    });
  }

  /**
   * Calculate confidence for all fields in extracted data
   */
  calculateDocumentConfidence(
    extractedFields: Record<string, any>,
    doclingConfidence?: number,
    documentType?: string
  ): DocumentConfidence {
    logger.info('Calculating document confidence', {
      field_count: Object.keys(extractedFields).length,
      docling_confidence: doclingConfidence,
      document_type: documentType,
    });

    // Calculate field-level confidences
    const fieldConfidences = this.calculateFieldConfidences(
      extractedFields,
      doclingConfidence,
      documentType
    );

    // Calculate overall confidence (average of adjusted scores)
    const adjustedScores = fieldConfidences.map(fc => fc.adjusted_score);
    const overall_confidence = adjustedScores.length > 0
      ? adjustedScores.reduce((sum, score) => sum + score, 0) / adjustedScores.length
      : doclingConfidence || 0;

    // Count confidence levels
    const high_confidence_count = fieldConfidences.filter(fc => fc.confidence_level === 'high').length;
    const medium_confidence_count = fieldConfidences.filter(fc => fc.confidence_level === 'medium').length;
    const low_confidence_count = fieldConfidences.filter(fc => fc.confidence_level === 'low').length;

    // Determine if auto-accept eligible (overall >= 90%)
    const auto_accept_eligible = overall_confidence >= this.config.autoAcceptThreshold;

    const result: DocumentConfidence = {
      overall_confidence,
      confidence_level: this.getConfidenceLevel(overall_confidence),
      field_confidences: fieldConfidences,
      high_confidence_count,
      medium_confidence_count,
      low_confidence_count,
      auto_accept_eligible,
      calculated_at: new Date().toISOString(),
    };

    logger.info('Document confidence calculated', {
      overall_confidence,
      confidence_level: result.confidence_level,
      high_count: high_confidence_count,
      medium_count: medium_confidence_count,
      low_count: low_confidence_count,
      auto_accept_eligible,
    });

    return result;
  }

  /**
   * Calculate confidence for individual fields
   */
  private calculateFieldConfidences(
    fields: Record<string, any>,
    baseConfidence: number = 0.7,
    documentType?: string,
    prefix: string = ''
  ): FieldConfidence[] {
    const confidences: FieldConfidence[] = [];

    for (const [key, value] of Object.entries(fields)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;

      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Handle nested objects recursively
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedConfidences = this.calculateFieldConfidences(
          value,
          baseConfidence,
          documentType,
          fieldName
        );
        confidences.push(...nestedConfidences);
        continue;
      }

      // Handle arrays (use average confidence)
      if (Array.isArray(value)) {
        if (value.length === 0) {
          continue;
        }
        // For arrays of objects, calculate confidence for each item
        if (typeof value[0] === 'object') {
          value.forEach((item, index) => {
            const arrayItemConfidences = this.calculateFieldConfidences(
              item,
              baseConfidence,
              documentType,
              `${fieldName}[${index}]`
            );
            confidences.push(...arrayItemConfidences);
          });
          continue;
        }
      }

      // Calculate confidence for primitive value
      const fieldConfidence = this.calculateFieldConfidence(
        fieldName,
        value,
        baseConfidence,
        documentType
      );

      confidences.push(fieldConfidence);
    }

    return confidences;
  }

  /**
   * Calculate confidence for a single field
   */
  private calculateFieldConfidence(
    fieldName: string,
    value: any,
    baseConfidence: number,
    documentType?: string
  ): FieldConfidence {
    const adjustments: Array<{
      type: 'field_type' | 'document_type' | 'value_quality';
      adjustment: number;
      reason: string;
    }> = [];

    // Start with base confidence (from Docling)
    let score = baseConfidence;

    // Infer field type from name
    const fieldType = this.inferFieldType(fieldName);

    // Apply field-type adjustment
    if (fieldType && this.config.fieldTypeAdjustments[fieldType]) {
      const adjustment = this.config.fieldTypeAdjustments[fieldType];
      score = Math.max(0, Math.min(1, score + adjustment));
      adjustments.push({
        type: 'field_type',
        adjustment,
        reason: `Field type: ${fieldType}`,
      });
    }

    // Apply document-type adjustment
    if (documentType && this.config.documentTypeAdjustments[documentType]) {
      const adjustment = this.config.documentTypeAdjustments[documentType];
      score = Math.max(0, Math.min(1, score + adjustment));
      adjustments.push({
        type: 'document_type',
        adjustment,
        reason: `Document type: ${documentType}`,
      });
    }

    // Apply value quality adjustment
    const qualityAdjustment = this.assessValueQuality(fieldName, value);
    if (qualityAdjustment !== 0) {
      score = Math.max(0, Math.min(1, score + qualityAdjustment));
      adjustments.push({
        type: 'value_quality',
        adjustment: qualityAdjustment,
        reason: this.getQualityReason(qualityAdjustment),
      });
    }

    return {
      field_name: fieldName,
      raw_score: baseConfidence,
      adjusted_score: score,
      confidence_level: this.getConfidenceLevel(score),
      field_type: fieldType,
      adjustments_applied: adjustments,
    };
  }

  /**
   * Infer field type from field name
   */
  private inferFieldType(fieldName: string): string | undefined {
    const lowerName = fieldName.toLowerCase();

    if (lowerName.includes('date') || lowerName.includes('_at')) {
      return 'date';
    }
    if (lowerName.includes('amount') || lowerName.includes('revenue') ||
        lowerName.includes('expense') || lowerName.includes('income') ||
        lowerName.includes('cost') || lowerName.includes('price') ||
        lowerName.includes('total') || lowerName.includes('balance')) {
      return 'currency';
    }
    if (lowerName.includes('name') || lowerName.includes('title')) {
      return 'text';
    }
    if (lowerName.includes('number') || lowerName.includes('id') ||
        lowerName.includes('ein') || lowerName.includes('ssn') ||
        lowerName.includes('license')) {
      return 'identifier';
    }
    if (lowerName.includes('address') || lowerName.includes('street') ||
        lowerName.includes('city') || lowerName.includes('state') ||
        lowerName.includes('zip')) {
      return 'address';
    }
    if (lowerName.includes('email')) {
      return 'email';
    }
    if (lowerName.includes('phone') || lowerName.includes('fax')) {
      return 'phone';
    }
    if (lowerName.includes('percent') || lowerName.includes('rate')) {
      return 'percentage';
    }

    return undefined;
  }

  /**
   * Assess value quality and return adjustment
   */
  private assessValueQuality(fieldName: string, value: any): number {
    if (value === '' || value === null || value === undefined) {
      return -0.3; // Empty value penalty
    }

    const stringValue = String(value).trim();

    // Check for placeholder or invalid patterns
    if (stringValue.match(/^(n\/?a|unknown|tbd|pending|xxx+|\*+|---+)$/i)) {
      return -0.2; // Placeholder penalty
    }

    // Check for suspiciously short values (likely OCR errors)
    if (stringValue.length === 1 && fieldName.toLowerCase().includes('name')) {
      return -0.15; // Single character name is suspicious
    }

    // Reward well-formatted values
    const fieldType = this.inferFieldType(fieldName);

    if (fieldType === 'date') {
      // Valid date format (YYYY-MM-DD or MM/DD/YYYY)
      if (stringValue.match(/^\d{4}-\d{2}-\d{2}$/) || stringValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return 0.05;
      }
    }

    if (fieldType === 'email') {
      // Valid email format
      if (stringValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return 0.05;
      }
    }

    if (fieldType === 'phone') {
      // Valid phone format
      if (stringValue.match(/^\d{3}-\d{3}-\d{4}$/) || stringValue.match(/^\(\d{3}\)\s*\d{3}-\d{4}$/)) {
        return 0.05;
      }
    }

    if (fieldType === 'currency') {
      // Valid currency format
      if (typeof value === 'number' && !isNaN(value)) {
        return 0.03;
      }
    }

    return 0; // No adjustment
  }

  /**
   * Get confidence level label
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.90) return 'high';
    if (score >= 0.70) return 'medium';
    return 'low';
  }

  /**
   * Get quality adjustment reason
   */
  private getQualityReason(adjustment: number): string {
    if (adjustment < -0.2) return 'Empty or missing value';
    if (adjustment < 0) return 'Low quality value (placeholder or suspicious format)';
    if (adjustment > 0) return 'High quality value (well-formatted)';
    return 'Standard value';
  }

  /**
   * Get default field type adjustments
   */
  private getDefaultFieldTypeAdjustments(): Record<string, number> {
    return {
      // Identifiers are usually high confidence (structured)
      identifier: 0.05,
      // Dates can be ambiguous (MM/DD vs DD/MM)
      date: -0.05,
      // Currency often has OCR issues (commas, decimals)
      currency: -0.03,
      // Text names are usually clear
      text: 0.02,
      // Addresses can be complex
      address: -0.05,
      // Email/phone have clear formats
      email: 0.03,
      phone: 0.03,
      // Percentages can be ambiguous
      percentage: -0.02,
    };
  }

  /**
   * Get default document type adjustments
   */
  private getDefaultDocumentTypeAdjustments(): Record<string, number> {
    return {
      // Drivers licenses are standardized
      drivers_license: 0.05,
      // Tax forms are complex but structured
      schedule_f: 0.02,
      balance_sheet: 0.02,
      // Government forms are standardized
      fsa_578: 0.05,
      // Insurance documents are structured
      crop_insurance_current: 0.03,
      crop_insurance_prior: 0.03,
      // Contracts can vary widely
      lease_agreement: -0.03,
      // Lists can be inconsistent
      equipment_list: -0.02,
      // Organization docs vary
      organization_docs: 0.0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConfidenceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('ConfidenceService configuration updated', {
      auto_accept_threshold: this.config.autoAcceptThreshold,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ConfidenceConfig {
    return { ...this.config };
  }
}

// Singleton instance
let confidenceServiceInstance: ConfidenceService | null = null;

export function getConfidenceService(): ConfidenceService {
  if (!confidenceServiceInstance) {
    confidenceServiceInstance = new ConfidenceService();
  }
  return confidenceServiceInstance;
}
