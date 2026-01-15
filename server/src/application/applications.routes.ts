import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, getAuth } from '../auth/middleware';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  ApplicationListQuerySchema,
  ApplicationIdSchema,
  UpdateStatusSchema,
} from './applications.schemas';
import * as ApplicationService from './applications.service';

const router = Router();

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

    // Replace request data with validated data
    (req as any)[source] = result.data;
    next();
  };
}

/**
 * POST /api/applications/test-validation (DEV ONLY)
 * Test endpoint to verify Zod validation without auth
 * Remove this before production!
 */
router.post(
  '/test-validation',
  validate(CreateApplicationSchema, 'body'),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'Validation passed! This endpoint is for testing only.',
      note: 'Remove this endpoint before production'
    });
  }
);

/**
 * GET /api/applications
 * List all applications for the authenticated user
 * Query params: status (optional), limit (optional, default 50), offset (optional, default 0)
 */
router.get(
  '/',
  requireAuth(),
  validate(ApplicationListQuerySchema, 'query'),
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

      const filters = req.query as z.infer<typeof ApplicationListQuerySchema>;
      const { applications, count } = await ApplicationService.getApplications(userId, filters);

      res.json({
        success: true,
        userId,
        count,
        limit: filters.limit,
        offset: filters.offset,
        applications
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/applications
 * Create a new application
 */
router.post(
  '/',
  requireAuth(),
  validate(CreateApplicationSchema, 'body'),
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

      const validatedData = req.body as z.infer<typeof CreateApplicationSchema>;
      const application = await ApplicationService.createApplication(userId, validatedData);

      res.status(201).json({
        success: true,
        userId,
        application
      });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/applications/:id
 * Get a single application by ID
 */
router.get(
  '/:id',
  requireAuth(),
  validate(ApplicationIdSchema, 'params'),
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

      const { id } = req.params as z.infer<typeof ApplicationIdSchema>;
      const application = await ApplicationService.getApplicationById(id, userId);

      res.json({
        success: true,
        userId,
        application
      });
    } catch (error) {
      console.error('Error fetching application:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PATCH /api/applications/:id
 * Update an existing application
 */
router.patch(
  '/:id',
  requireAuth(),
  validate(ApplicationIdSchema, 'params'),
  validate(UpdateApplicationSchema, 'body'),
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

      const { id } = req.params as z.infer<typeof ApplicationIdSchema>;
      const validatedData = req.body as z.infer<typeof UpdateApplicationSchema>;
      const application = await ApplicationService.updateApplication(id, userId, validatedData);

      res.json({
        success: true,
        userId,
        application
      });
    } catch (error) {
      console.error('Error updating application:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/applications/:id
 * Delete an application (soft delete by setting status to 'locked')
 */
router.delete(
  '/:id',
  requireAuth(),
  validate(ApplicationIdSchema, 'params'),
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

      const { id } = req.params as z.infer<typeof ApplicationIdSchema>;
      const application = await ApplicationService.deleteApplication(id, userId);

      res.json({
        success: true,
        userId,
        message: 'Application locked successfully',
        application
      });
    } catch (error) {
      console.error('Error deleting application:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PATCH /api/applications/:id/status
 * Update application status with transition validation
 */
router.patch(
  '/:id/status',
  requireAuth(),
  validate(ApplicationIdSchema, 'params'),
  validate(UpdateStatusSchema, 'body'),
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

      const { id } = req.params as z.infer<typeof ApplicationIdSchema>;
      const { status: newStatus } = req.body as z.infer<typeof UpdateStatusSchema>;

      const result = await ApplicationService.updateApplicationStatus(id, userId, newStatus);

      res.json({
        success: true,
        userId,
        message: `Status updated from '${result.previousStatus}' to '${result.newStatus}'`,
        application: result.application
      });
    } catch (error) {
      console.error('Error updating application status:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message
          });
          return;
        }

        if (error.message.includes('Invalid status transition')) {
          res.status(400).json({
            error: 'Invalid status transition',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
