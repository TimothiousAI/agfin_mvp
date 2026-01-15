import { logger } from '../../core/logging';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  getDocumentMapping,
  getModuleFieldMappings,
  FieldMapping,
  ModuleId,
  DocumentTypeName,
} from './field-mapping';
import { FieldExtractionResult } from './extraction.service';

/**
 * Field value with metadata for conflict resolution
 */
export interface FieldValueWithMetadata {
  fieldId: string;
  value: any;
  confidence?: number;
  sourceDocumentId?: string;
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
}

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy =
  | 'highest_confidence' // Use field with highest confidence score
  | 'most_recent'        // Use most recently extracted field
  | 'manual_review';     // Flag for manual review (don't auto-resolve)

/**
 * Mapping result for a single field
 */
export interface FieldMappingResult {
  fieldId: string;
  value: any;
  applied: boolean;
  skipped?: boolean;
  skipReason?: string;
  conflictResolved?: boolean;
  previousValue?: any;
  previousConfidence?: number;
}

/**
 * Document mapping result
 */
export interface DocumentMappingResult {
  documentId: string;
  applicationId: string;
  documentType: DocumentTypeName;
  modulesAffected: ModuleId[];
  fieldsApplied: number;
  fieldsSkipped: number;
  conflictsResolved: number;
  fieldResults: FieldMappingResult[];
  moduleCompletionUpdated: boolean;
  errors?: string[];
}

/**
 * Module completion status
 */
interface ModuleCompletion {
  moduleId: ModuleId;
  totalFields: number;
  filledFields: number;
  requiredFields: number;
  requiredFieldsFilled: number;
  completionPercentage: number;
  isComplete: boolean;
}

/**
 * MappingService
 *
 * Executes field mapping from extracted document data to application modules.
 * Handles type conversions, conflict resolution, and module completion tracking.
 */
export class MappingService {
  constructor(
    private supabase: SupabaseClient,
    private conflictStrategy: ConflictStrategy = 'highest_confidence'
  ) {
    logger.info('MappingService initialized', {
      conflict_strategy: conflictStrategy,
    });
  }

  /**
   * Apply extracted fields to application modules
   */
  async applyFieldMapping(
    applicationId: string,
    documentId: string,
    documentType: DocumentTypeName,
    extractionResult: FieldExtractionResult
  ): Promise<DocumentMappingResult> {
    logger.info('Starting field mapping', {
      application_id: applicationId,
      document_id: documentId,
      document_type: documentType,
      field_count: Object.keys(extractionResult.fields).length,
    });

    const result: DocumentMappingResult = {
      documentId,
      applicationId,
      documentType,
      modulesAffected: [],
      fieldsApplied: 0,
      fieldsSkipped: 0,
      conflictsResolved: 0,
      fieldResults: [],
      moduleCompletionUpdated: false,
      errors: [],
    };

    try {
      // Get mapping configuration for document type
      const mapping = getDocumentMapping(documentType);
      if (!mapping) {
        throw new Error(`No mapping configuration found for document type: ${documentType}`);
      }

      // Process each module that this document populates
      for (const moduleMapping of mapping.modules) {
        logger.info('Processing module mapping', {
          module_id: moduleMapping.moduleId,
          module_name: moduleMapping.moduleName,
          field_count: moduleMapping.fields.length,
        });

        // Convert module ID to module number (M1 -> 1, M2 -> 2, etc.)
        const moduleNumber = this.moduleIdToNumber(moduleMapping.moduleId);

        // Apply fields for this module
        const moduleResults = await this.applyModuleFields(
          applicationId,
          documentId,
          moduleNumber,
          moduleMapping.fields,
          extractionResult
        );

        result.fieldResults.push(...moduleResults);
        result.modulesAffected.push(moduleMapping.moduleId);
      }

      // Count results
      result.fieldsApplied = result.fieldResults.filter(r => r.applied).length;
      result.fieldsSkipped = result.fieldResults.filter(r => r.skipped).length;
      result.conflictsResolved = result.fieldResults.filter(r => r.conflictResolved).length;

      // Update module completion status for all affected modules
      for (const moduleId of result.modulesAffected) {
        const moduleNumber = this.moduleIdToNumber(moduleId);
        await this.updateModuleCompletion(applicationId, moduleNumber);
      }
      result.moduleCompletionUpdated = true;

      logger.info('Field mapping completed', {
        application_id: applicationId,
        document_id: documentId,
        modules_affected: result.modulesAffected.length,
        fields_applied: result.fieldsApplied,
        fields_skipped: result.fieldsSkipped,
        conflicts_resolved: result.conflictsResolved,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Field mapping failed', {
        application_id: applicationId,
        document_id: documentId,
        error: errorMessage,
      });

      result.errors = [errorMessage];
      throw error;
    }
  }

  /**
   * Apply fields for a single module
   */
  private async applyModuleFields(
    applicationId: string,
    documentId: string,
    moduleNumber: number,
    fieldMappings: FieldMapping[],
    extractionResult: FieldExtractionResult
  ): Promise<FieldMappingResult[]> {
    const results: FieldMappingResult[] = [];

    for (const mapping of fieldMappings) {
      try {
        const result = await this.applyField(
          applicationId,
          documentId,
          moduleNumber,
          mapping,
          extractionResult
        );
        results.push(result);
      } catch (error) {
        logger.error('Failed to apply field', {
          field: mapping.moduleField,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.push({
          fieldId: mapping.moduleField,
          value: null,
          applied: false,
          skipped: true,
          skipReason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Apply a single field mapping
   */
  private async applyField(
    applicationId: string,
    documentId: string,
    moduleNumber: number,
    mapping: FieldMapping,
    extractionResult: FieldExtractionResult
  ): Promise<FieldMappingResult> {
    // Extract value from document fields (support dot notation)
    const extractedValue = this.getNestedValue(
      extractionResult.fields,
      mapping.documentField
    );

    // Skip if no value extracted
    if (extractedValue === null || extractedValue === undefined) {
      return {
        fieldId: mapping.moduleField,
        value: null,
        applied: false,
        skipped: true,
        skipReason: 'No value extracted from document',
      };
    }

    // Apply transformation if specified
    let transformedValue = extractedValue;
    if (mapping.transform) {
      try {
        transformedValue = this.transformValue(extractedValue, mapping.transform);
      } catch (error) {
        logger.warn('Value transformation failed', {
          field: mapping.moduleField,
          transform: mapping.transform,
          value: extractedValue,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
          fieldId: mapping.moduleField,
          value: null,
          applied: false,
          skipped: true,
          skipReason: `Transformation failed: ${mapping.transform}`,
        };
      }
    }

    // Get confidence score for this field
    const confidence = extractionResult.confidence_scores[mapping.documentField];

    // Check for existing value (conflict detection)
    const { data: existingData } = await this.supabase
      .from('module_data')
      .select('*')
      .eq('application_id', applicationId)
      .eq('module_number', moduleNumber)
      .eq('field_id', mapping.moduleField)
      .maybeSingle();

    let conflictResolved = false;
    let previousValue = null;
    let previousConfidence = null;

    if (existingData) {
      previousValue = existingData.value;
      previousConfidence = existingData.confidence_score;

      // Resolve conflict based on strategy
      const shouldReplace = await this.shouldReplaceExisting(
        existingData,
        confidence,
        documentId
      );

      if (!shouldReplace) {
        return {
          fieldId: mapping.moduleField,
          value: transformedValue,
          applied: false,
          skipped: true,
          skipReason: 'Existing value has higher confidence',
          previousValue,
          previousConfidence,
        };
      }

      conflictResolved = true;
    }

    // Insert or update field value
    const { error: upsertError } = await this.supabase
      .from('module_data')
      .upsert({
        application_id: applicationId,
        module_number: moduleNumber,
        field_id: mapping.moduleField,
        value: transformedValue,
        source: 'ai_extracted',
        source_document_id: documentId,
        confidence_score: confidence,
      }, {
        onConflict: 'application_id,module_number,field_id',
      });

    if (upsertError) {
      throw new Error(`Failed to upsert field: ${upsertError.message}`);
    }

    return {
      fieldId: mapping.moduleField,
      value: transformedValue,
      applied: true,
      conflictResolved,
      previousValue,
      previousConfidence,
    };
  }

  /**
   * Get nested value from object using dot notation
   * Example: "address.street" -> obj.address.street
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Transform field value based on type
   */
  private transformValue(value: any, transform: string): any {
    switch (transform) {
      case 'date':
        return this.transformDate(value);
      case 'currency':
        return this.transformCurrency(value);
      case 'percentage':
        return this.transformPercentage(value);
      case 'boolean':
        return this.transformBoolean(value);
      case 'address':
        return this.transformAddress(value);
      default:
        return value;
    }
  }

  /**
   * Transform date to ISO 8601 format
   */
  private transformDate(value: any): string | null {
    if (!value) return null;

    // If already in YYYY-MM-DD format, return as-is
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // Try to parse date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Transform currency to number
   */
  private transformCurrency(value: any): number | null {
    if (value === null || value === undefined) return null;

    // If already a number, return as-is
    if (typeof value === 'number') {
      return value;
    }

    // Remove currency symbols and commas
    const cleaned = String(value).replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      throw new Error(`Invalid currency: ${value}`);
    }

    return num;
  }

  /**
   * Transform percentage to decimal (0-1)
   */
  private transformPercentage(value: any): number | null {
    if (value === null || value === undefined) return null;

    // If already a decimal (0-1), return as-is
    if (typeof value === 'number' && value >= 0 && value <= 1) {
      return value;
    }

    // Remove % symbol and convert to decimal
    const cleaned = String(value).replace(/%/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      throw new Error(`Invalid percentage: ${value}`);
    }

    // If > 1, assume it's in percentage form (e.g., 85 -> 0.85)
    return num > 1 ? num / 100 : num;
  }

  /**
   * Transform value to boolean
   */
  private transformBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    const str = String(value).toLowerCase().trim();
    if (['true', 'yes', '1', 'y'].includes(str)) {
      return true;
    }
    if (['false', 'no', '0', 'n'].includes(str)) {
      return false;
    }

    throw new Error(`Invalid boolean: ${value}`);
  }

  /**
   * Transform address to structured format
   */
  private transformAddress(value: any): Record<string, string> | null {
    if (!value) return null;

    // If already an object, return as-is
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }

    // Parse address string
    const parts = String(value).split(',').map(s => s.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zip_code: parts[3] || '',
    };
  }

  /**
   * Determine if existing value should be replaced
   */
  private async shouldReplaceExisting(
    existingData: any,
    newConfidence: number | undefined,
    newDocumentId: string
  ): Promise<boolean> {
    // If existing value is manually entered or auditor verified, don't replace
    if (existingData.source === 'proxy_entered' ||
        existingData.source === 'proxy_edited' ||
        existingData.source === 'auditor_verified') {
      logger.info('Skipping field - manually entered/verified value takes precedence', {
        field_id: existingData.field_id,
        existing_source: existingData.source,
      });
      return false;
    }

    // Apply conflict resolution strategy
    switch (this.conflictStrategy) {
      case 'highest_confidence': {
        const existingConfidence = existingData.confidence_score || 0;
        const newConf = newConfidence || 0;

        if (newConf > existingConfidence) {
          logger.info('Replacing field - higher confidence', {
            field_id: existingData.field_id,
            existing_confidence: existingConfidence,
            new_confidence: newConf,
          });
          return true;
        }

        logger.info('Keeping field - existing confidence is higher', {
          field_id: existingData.field_id,
          existing_confidence: existingConfidence,
          new_confidence: newConf,
        });
        return false;
      }

      case 'most_recent': {
        // Always replace with most recent extraction
        logger.info('Replacing field - most recent strategy', {
          field_id: existingData.field_id,
        });
        return true;
      }

      case 'manual_review': {
        // Don't auto-resolve - requires manual review
        logger.info('Skipping field - manual review required', {
          field_id: existingData.field_id,
        });
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Update module completion status
   */
  private async updateModuleCompletion(
    applicationId: string,
    moduleNumber: number
  ): Promise<void> {
    logger.info('Updating module completion', {
      application_id: applicationId,
      module_number: moduleNumber,
    });

    // Get all fields for this module
    const { data: moduleFields, error } = await this.supabase
      .from('module_data')
      .select('*')
      .eq('application_id', applicationId)
      .eq('module_number', moduleNumber);

    if (error) {
      logger.error('Failed to fetch module fields for completion update', {
        application_id: applicationId,
        module_number: moduleNumber,
        error: error.message,
      });
      return;
    }

    const filledFieldsCount = moduleFields?.length || 0;

    // Note: We would need module schema to calculate accurate completion
    // For now, we'll just log the count
    logger.info('Module completion calculated', {
      application_id: applicationId,
      module_number: moduleNumber,
      filled_fields: filledFieldsCount,
    });

    // In a full implementation, you would:
    // 1. Get module schema (all possible fields)
    // 2. Identify required fields
    // 3. Calculate completion percentage
    // 4. Update application status if module is complete
    // 5. Check if all modules complete -> update application status to 'ready_for_review'
  }

  /**
   * Convert module ID to module number
   */
  private moduleIdToNumber(moduleId: ModuleId): number {
    return parseInt(moduleId.substring(1), 10);
  }

  /**
   * Get module completion status
   */
  async getModuleCompletion(
    applicationId: string,
    moduleNumber: number
  ): Promise<ModuleCompletion> {
    // Get all fields for this module
    const { data: moduleFields } = await this.supabase
      .from('module_data')
      .select('*')
      .eq('application_id', applicationId)
      .eq('module_number', moduleNumber);

    const filledFields = moduleFields?.length || 0;

    // This is a simplified version - would need module schema for accurate calculation
    return {
      moduleId: `M${moduleNumber}` as ModuleId,
      totalFields: 0, // Would come from schema
      filledFields,
      requiredFields: 0, // Would come from schema
      requiredFieldsFilled: 0, // Would need to check which filled fields are required
      completionPercentage: 0, // Would calculate based on schema
      isComplete: false, // Would check if all required fields filled
    };
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictStrategy): void {
    this.conflictStrategy = strategy;
    logger.info('Conflict strategy updated', { strategy });
  }
}

/**
 * Create mapping service instance
 */
export function createMappingService(
  supabase: SupabaseClient,
  conflictStrategy?: ConflictStrategy
): MappingService {
  return new MappingService(supabase, conflictStrategy);
}
