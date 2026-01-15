import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Request validation targets
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory
 * Validates request data against a Zod schema and returns 400 on validation errors
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and validate the target data
      const validated = await schema.parseAsync(req[target]);

      // Replace the original data with validated data (with defaults applied)
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into a user-friendly response
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          details: errors,
        });
        return;
      }

      // Unexpected error during validation
      console.error('Unexpected validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation',
      });
      return;
    }
  };
}

/**
 * Convenience wrappers for common validation targets
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
