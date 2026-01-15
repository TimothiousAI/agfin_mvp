import { z } from 'zod';

/**
 * Application validation schemas
 * Centralized Zod schemas for application management endpoints
 */

// Application status enum
export const ApplicationStatusSchema = z.enum([
  'draft',
  'awaiting_documents',
  'awaiting_audit',
  'certified',
  'locked'
]);

// Schema for creating a new application
export const CreateApplicationSchema = z.object({
  farmer_name: z.string().min(1, 'Farmer name is required').max(255),
  farmer_email: z.string().email('Invalid email address'),
  farmer_phone: z.string().optional().nullable(),
  status: ApplicationStatusSchema.optional().default('draft'),
});

// Schema for updating an existing application
export const UpdateApplicationSchema = z.object({
  farmer_name: z.string().min(1).max(255).optional(),
  farmer_email: z.string().email().optional(),
  farmer_phone: z.string().optional().nullable(),
  status: ApplicationStatusSchema.optional(),
}).strict(); // Reject unknown fields

// Schema for query parameters when listing applications
export const ApplicationListQuerySchema = z.object({
  status: ApplicationStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

// Schema for application ID parameter
export const ApplicationIdSchema = z.object({
  id: z.string().uuid('Invalid application ID format'),
});

// Schema for status update
export const UpdateStatusSchema = z.object({
  status: ApplicationStatusSchema,
});

// Schema for full application response (for type inference)
export const ApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  analyst_id: z.string().uuid(),
  farmer_name: z.string(),
  farmer_email: z.string().email(),
  farmer_phone: z.string().nullable(),
  status: ApplicationStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * TypeScript type exports inferred from schemas
 */
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type ApplicationListQuery = z.infer<typeof ApplicationListQuerySchema>;
export type ApplicationIdParam = z.infer<typeof ApplicationIdSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;
