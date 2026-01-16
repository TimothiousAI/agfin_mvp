import { Router, Request, Response } from 'express';
import { requireAuth, getAuth } from '../../auth/middleware';
import { getSupabaseAdmin } from '../../core/database';
import { validateBody, validateQuery, validateParams } from '../../shared/middleware/validate';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  GetApplicationsQuerySchema,
  UUIDParamSchema,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type GetApplicationsQuery,
} from './applications.schemas';

const router = Router();

/**
 * GET /api/applications
 * Get all applications for the authenticated user with optional filtering and pagination
 */
router.get(
  '/',
  requireAuth(),
  validateQuery(GetApplicationsQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context',
        });
        return;
      }

      const query = req.query as unknown as GetApplicationsQuery;
      const supabase = getSupabaseAdmin();

      // Build query with filters
      let dbQuery = (supabase
        .from('applications') as any)
        .select('*', { count: 'exact' })
        .eq('analyst_id', userId);

      // Apply status filter if provided
      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }

      // Apply sorting
      dbQuery = dbQuery.order(query.sort_by!, { ascending: query.sort_order === 'asc' });

      // Apply pagination
      dbQuery = dbQuery.range(query.offset!, query.offset! + query.limit! - 1);

      const { data: applications, error, count } = await dbQuery;

      if (error) {
        console.error('Database error:', error);
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch applications',
        });
        return;
      }

      res.json({
        success: true,
        count: count || 0,
        limit: query.limit,
        offset: query.offset,
        applications: applications || [],
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context',
        });
        return;
      }

      const { id } = req.params;
      const supabase = getSupabaseAdmin();

      const { data: application, error } = await (supabase
        .from('applications') as any)
        .select('*')
        .eq('id', id)
        .eq('analyst_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            error: 'Not found',
            message: 'Application not found',
          });
          return;
        }

        console.error('Database error:', error);
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch application',
        });
        return;
      }

      res.json({
        success: true,
        application,
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
  validateBody(CreateApplicationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context',
        });
        return;
      }

      const applicationData = req.body as CreateApplicationInput;
      const supabase = getSupabaseAdmin();

      const { data: application, error } = await (supabase
        .from('applications') as any)
        .insert({
          ...applicationData,
          analyst_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to create application',
        });
        return;
      }

      res.status(201).json({
        success: true,
        application,
      });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
  validateParams(UUIDParamSchema),
  validateBody(UpdateApplicationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context',
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body as UpdateApplicationInput;
      const supabase = getSupabaseAdmin();

      // Check if there are any fields to update
      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          error: 'Bad request',
          message: 'No fields to update',
        });
        return;
      }

      const { data: application, error } = await (supabase
        .from('applications') as any)
        .update(updates)
        .eq('id', id)
        .eq('analyst_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            error: 'Not found',
            message: 'Application not found',
          });
          return;
        }

        console.error('Database error:', error);
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to update application',
        });
        return;
      }

      res.json({
        success: true,
        application,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/applications/:id
 * Delete an application
 */
router.delete(
  '/:id',
  requireAuth(),
  validateParams(UUIDParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context',
        });
        return;
      }

      const { id } = req.params;
      const supabase = getSupabaseAdmin();

      const { error } = await (supabase
        .from('applications') as any)
        .delete()
        .eq('id', id)
        .eq('analyst_id', userId);

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            error: 'Not found',
            message: 'Application not found',
          });
          return;
        }

        console.error('Database error:', error);
        res.status(500).json({
          error: 'Database error',
          message: 'Failed to delete application',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Application deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
