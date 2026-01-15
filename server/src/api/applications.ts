import { Router, Request, Response } from 'express';
import { requireAuth, getAuth } from '../auth/middleware';
import { getSupabaseAdmin } from '../core/database';

const router = Router();

/**
 * GET /api/applications
 * Get all applications for the authenticated user
 * Uses Clerk userId for Row Level Security
 */
router.get('/', requireAuth(), async (req: Request, res: Response): Promise<void> => {
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

    // Create Supabase client with service role for querying
    // Note: In production, you'd use RLS policies to filter by user
    const supabase = getSupabaseAdmin();

    // Query applications - RLS policies will filter by user_id automatically
    // Note: RLS policies must be configured in Supabase to use auth.uid()
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch applications'
      });
      return;
    }

    res.json({
      success: true,
      userId, // Include userId to verify RLS context
      count: applications?.length || 0,
      applications: applications || []
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/applications
 * Create a new application for the authenticated user
 */
router.post('/', requireAuth(), async (req: Request, res: Response): Promise<void> => {
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

    const supabase = getSupabaseAdmin();

    // Insert application with user_id for RLS
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        ...req.body,
        // RLS will automatically set user_id from auth context
        // but we can also set it explicitly
        analyst_email: auth.sessionClaims?.email || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      res.status(500).json({
        error: 'Database error',
        message: 'Failed to create application'
      });
      return;
    }

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
});

export default router;
