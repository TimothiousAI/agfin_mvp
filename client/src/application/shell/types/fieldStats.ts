import type { SourceType } from '@/shared/ui/SourceBadge';

/**
 * Statistics for fields by data source
 */
export interface FieldSourceStats {
  ai_extracted: number;
  proxy_entered: number;
  proxy_edited: number;
  auditor_verified: number;
  total: number;
}

/**
 * Statistics for fields by confidence level
 */
export interface FieldConfidenceStats {
  high: number;    // >= 90%
  medium: number;  // 70-89%
  low: number;     // < 70%
  total: number;
}

/**
 * Combined field statistics for a document or module
 */
export interface FieldStats {
  source: FieldSourceStats;
  confidence: FieldConfidenceStats;
  lowConfidenceFields: LowConfidenceField[];
  editedFields: EditedField[];
}

/**
 * Individual field with low confidence
 */
export interface LowConfidenceField {
  fieldId: string;
  fieldLabel: string;
  confidence: number;
  source: SourceType;
  sourceDocumentId?: string;
}

/**
 * Individual edited field for audit trail
 */
export interface EditedField {
  fieldId: string;
  fieldLabel: string;
  originalSource: SourceType;
  originalValue: unknown;
  currentValue: unknown;
  editedAt: Date;
}

/**
 * Calculate confidence level from score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

/**
 * Calculate field statistics from module data
 */
export function calculateFieldStats(
  fields: Record<string, { source: SourceType; confidence_score?: number; value: unknown }>
): FieldStats {
  const stats: FieldStats = {
    source: {
      ai_extracted: 0,
      proxy_entered: 0,
      proxy_edited: 0,
      auditor_verified: 0,
      total: 0,
    },
    confidence: {
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    },
    lowConfidenceFields: [],
    editedFields: [],
  };

  Object.entries(fields).forEach(([fieldId, field]) => {
    // Count by source
    stats.source[field.source]++;
    stats.source.total++;

    // Count by confidence (only for AI-extracted fields)
    if (field.confidence_score !== undefined && field.source === 'ai_extracted') {
      const level = getConfidenceLevel(field.confidence_score);
      stats.confidence[level]++;
      stats.confidence.total++;

      // Track low confidence fields
      if (field.confidence_score < 90) {
        stats.lowConfidenceFields.push({
          fieldId,
          fieldLabel: fieldId, // Will be resolved to label in component
          confidence: field.confidence_score,
          source: field.source,
        });
      }
    }

    // Track edited fields
    if (field.source === 'proxy_edited') {
      stats.editedFields.push({
        fieldId,
        fieldLabel: fieldId,
        originalSource: 'ai_extracted', // Assume edited from AI
        originalValue: null, // Would come from audit trail
        currentValue: field.value,
        editedAt: new Date(),
      });
    }
  });

  return stats;
}
