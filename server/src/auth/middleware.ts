import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../core/config';

/**
 * Clerk middleware wrapper for Express
 * Validates JWT tokens from Clerk frontend SDK
 *
 * Usage:
 * - Apply globally: app.use(clerkMiddleware())
 * - Protect routes: app.get('/protected', requireAuth(), handler)
 */

/**
 * Initialize Clerk middleware with secret key
 * This should be applied globally to all routes
 *
 * Note: Requires valid Clerk API keys from https://dashboard.clerk.com
 * In development without real keys, middleware will pass through with warning
 */
export const initializeClerkMiddleware = (): RequestHandler => {
  // Check if Clerk keys are properly configured (not placeholders)
  const hasValidKeys = config.CLERK_SECRET_KEY &&
                       config.CLERK_PUBLISHABLE_KEY &&
                       config.CLERK_SECRET_KEY.startsWith('sk_') &&
                       config.CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  if (!hasValidKeys) {
    console.warn('⚠️  Clerk authentication not configured - using passthrough mode');
    console.warn('   Configure CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in .env for authentication');

    // Return passthrough middleware when Clerk is not configured
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }

  return clerkMiddleware({
    secretKey: config.CLERK_SECRET_KEY,
    publishableKey: config.CLERK_PUBLISHABLE_KEY,
  });
};

/**
 * Require authentication middleware
 * Protects routes by requiring valid Clerk session
 * Returns 401 if no valid session found
 *
 * Note: In development without Clerk keys, this will return 401 for all requests
 *
 * @example
 * app.get('/api/protected', requireAuth(), (req, res) => {
 *   const auth = getAuth(req);
 *   const userId = auth.userId;
 *   res.json({ userId });
 * });
 */
export const requireAuth = (): RequestHandler => {
  const hasValidKeys = config.CLERK_SECRET_KEY &&
                       config.CLERK_PUBLISHABLE_KEY &&
                       config.CLERK_SECRET_KEY.startsWith('sk_') &&
                       config.CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  if (!hasValidKeys) {
    // In development mode without Clerk, use mock auth for testing
    if (config.NODE_ENV === 'development') {
      return (req: Request, _res: Response, next: NextFunction) => {
        // Mock auth object for development testing
        // @ts-ignore - Adding auth to request for testing
        req.auth = {
          userId: 'test-user-id-123',
          sessionId: 'test-session-123',
          orgId: null,
          orgRole: null,
          orgSlug: null,
          orgPermissions: null,
        };
        next();
      };
    }

    // Return 401 when auth is required but Clerk is not configured (non-dev environments)
    return (_req: Request, res: Response) => {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required but not configured',
        hint: 'Configure Clerk API keys in .env'
      });
    };
  }

  return clerkRequireAuth();
};

/**
 * Optional authentication middleware
 * Extracts user info if present but doesn't require it
 * Useful for routes that behave differently for authenticated users
 *
 * @example
 * app.get('/api/public', optionalAuth(), (req, res) => {
 *   const auth = getAuth(req);
 *   const userId = auth.userId;
 *   res.json({ isAuthenticated: !!userId });
 * });
 */
export const optionalAuth = () => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Auth info is already populated by clerkMiddleware
    // Just pass through without requiring authentication
    next();
  };
};

/**
 * Type guard to check if request has authenticated user
 */
export function isAuthenticated(req: Request): boolean {
  const auth = getAuth(req);
  return !!auth.userId;
}

/**
 * Get user ID from authenticated request
 * Throws if not authenticated (use after requireAuth middleware)
 */
export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth.userId) {
    throw new Error('User not authenticated');
  }
  return auth.userId;
}

/**
 * Wrapper for getAuth that handles development mode without Clerk
 * In dev mode without Clerk keys, returns the mock auth object directly
 * Otherwise uses Clerk's getAuth function from @clerk/express
 */
const clerkGetAuth = getAuth; // Save original Clerk function

export function getAuth(req: Request) {
  const hasValidKeys = config.CLERK_SECRET_KEY &&
                       config.CLERK_PUBLISHABLE_KEY &&
                       config.CLERK_SECRET_KEY.startsWith('sk_') &&
                       config.CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // In development without Clerk, return the mock auth object we set in requireAuth
  if (!hasValidKeys && config.NODE_ENV === 'development') {
    return (req as any).auth || {
      userId: 'test-user-id-123',
      sessionId: 'test-session-123',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
    };
  }

  // With Clerk configured, use the real getAuth function
  return clerkGetAuth(req);
}
