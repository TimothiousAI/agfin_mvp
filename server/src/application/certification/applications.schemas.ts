import { z } from 'zod';

/**
 * Application status enum
 */
export const ApplicationStatus = z.enum([
  'draft',
  'awaiting_documents',
  'awaiting_audit',
  'certified',
  'locked'
]);

export type ApplicationStatusType = z.infer<typeof ApplicationStatus>;

/**
 * Schema for creating a new application
 */
export const CreateApplicationSchema = z.object({
  farmer_name: z.string().min(1, 'Farmer name is required').max(255),
  farmer_email: z.string().email('Invalid email address').max(255),
  farmer_phone: z.string().max(50).optional().nullable(),
  status: ApplicationStatus.optional().default('draft'),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

/**
 * Schema for updating an existing application
 */
export const UpdateApplicationSchema = z.object({
  farmer_name: z.string().min(1).max(255).optional(),
  farmer_email: z.string().email().max(255).optional(),
  farmer_phone: z.string().max(50).optional().nullable(),
  status: ApplicationStatus.optional(),
}).strict(); // Prevent additional fields

export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

/**
 * Schema for application query parameters
 */
export const GetApplicationsQuerySchema = z.object({
  status: ApplicationStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'farmer_name']).optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetApplicationsQuery = z.infer<typeof GetApplicationsQuerySchema>;

/**
 * UUID parameter schema for route params
 */
export const UUIDParamSchema = z.object({
  id: z.string().uuid('Invalid application ID format'),
});

export type UUIDParam = z.infer<typeof UUIDParamSchema>;

/**
 * Full application response schema (for documentation/validation)
 */
export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  analyst_id: z.string().uuid(),
  farmer_name: z.string(),
  farmer_email: z.string().email(),
  farmer_phone: z.string().nullable(),
  status: ApplicationStatus,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Application = z.infer<typeof ApplicationSchema>;
