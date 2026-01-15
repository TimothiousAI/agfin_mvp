import { z } from 'zod';

/**
 * Validation schemas for module data API endpoints
 */

/**
 * Valid data sources for module fields
 */
export const DataSourceSchema = z.enum([
  'ai_extracted',
  'proxy_entered',
  'proxy_edited',
  'auditor_verified',
]);

export type DataSource = z.infer<typeof DataSourceSchema>;

/**
 * Module number validation (1-5 for M1-M5)
 */
export const ModuleNumberSchema = z.number().int().min(1).max(5);

/**
 * Application ID and Module Number params
 */
export const GetModuleDataParamsSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  moduleNumber: z.coerce.number().int().min(1).max(5),
});

/**
 * Field ID param
 */
export const FieldIdSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
});

/**
 * Update field value body
 */
export const UpdateFieldValueSchema = z.object({
  value: z.any(), // JSONB can be any value
  source: DataSourceSchema.optional().default('proxy_edited'),
  source_document_id: z.string().uuid().optional().nullable(),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .nullable(),
});

/**
 * Bulk update fields body
 */
export const BulkUpdateFieldsSchema = z.object({
  fields: z.array(
    z.object({
      field_id: z.string().min(1),
      value: z.any(),
      source: DataSourceSchema.optional().default('proxy_edited'),
      source_document_id: z.string().uuid().optional().nullable(),
      confidence_score: z.number().min(0).max(1).optional().nullable(),
    })
  ),
});

/**
 * Query params for filtering module data
 */
export const ModuleDataQuerySchema = z.object({
  source: DataSourceSchema.optional(),
  min_confidence: z.coerce.number().min(0).max(1).optional(),
});

// Type exports
export type GetModuleDataParams = z.infer<typeof GetModuleDataParamsSchema>;
export type UpdateFieldValue = z.infer<typeof UpdateFieldValueSchema>;
export type BulkUpdateFields = z.infer<typeof BulkUpdateFieldsSchema>;
export type ModuleDataQuery = z.infer<typeof ModuleDataQuerySchema>;
