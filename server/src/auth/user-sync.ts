import { Request } from 'express';
import { getAuth } from './middleware';
import { getSupabaseAdmin } from '../core/database';

/**
 * User sync utility for Clerk <-> Supabase Auth integration
 * Implements lazy sync pattern: user records are created on first API request
 *
 * Note: Supabase has a built-in auth.users table that we'll use to store Clerk users
 * The Clerk user ID is stored in the user's metadata for linking
 */

/**
 * Ensure user exists in Supabase Auth
 * Creates user record if it doesn't exist (lazy sync)
 *
 * @param req - Express request with Clerk auth context
 * @returns Supabase user ID or null if sync fails
 */
export async function ensureUserExists(req: Request): Promise<string | null> {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      console.warn('No userId in auth context - cannot sync user');
      return null;
    }

    const supabase = getSupabaseAdmin();
    const clerkUserId = auth.userId;
    const email = auth.sessionClaims?.email as string | undefined || `clerk-${clerkUserId}@agrellus.local`;

    // Check if user already exists by searching user metadata
    // Supabase Auth stores custom data in user_metadata field
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Failed to list users:', listError);
      return null;
    }

    // Find user by Clerk ID in metadata
    const existingUser = existingUsers.users.find(
      (user) => user.user_metadata?.clerk_id === clerkUserId
    );

    if (existingUser) {
      // User already synced
      return existingUser.id;
    }

    // User doesn't exist - create new auth user
    // Note: We're creating a user in Supabase Auth without a password
    // since authentication is handled by Clerk
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto-confirm since Clerk already verified
      user_metadata: {
        clerk_id: clerkUserId,
        synced_from_clerk: true,
        synced_at: new Date().toISOString(),
      },
    });

    if (createError) {
      // Check if user already exists (race condition)
      if (createError.message?.includes('already been registered')) {
        console.log('User already exists (race condition), searching...');
        const { data: racedUsers } = await supabase.auth.admin.listUsers();
        const racedUser = racedUsers?.users.find(
          (user) => user.user_metadata?.clerk_id === clerkUserId
        );
        return racedUser?.id || null;
      }

      console.error('Failed to create user in Supabase Auth:', createError);
      return null;
    }

    console.log(`✅ User synced to Supabase Auth: Clerk ${clerkUserId} -> Supabase ${newUser.user?.id}`);
    return newUser.user?.id || null;
  } catch (error) {
    console.error('User sync error:', error);
    return null;
  }
}

/**
 * Get or create user in Supabase Auth
 * Returns the Supabase Auth user ID
 */
export const getOrCreateUser = ensureUserExists;

/**
 * Get Supabase user ID for a Clerk user
 * Does not create user if it doesn't exist
 *
 * @param clerkUserId - Clerk user ID
 * @returns Supabase user ID or null
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Failed to list users:', error);
      return null;
    }

    const user = users.users.find(
      (user) => user.user_metadata?.clerk_id === clerkUserId
    );

    return user?.id || null;
  } catch (error) {
    console.error('Error fetching Supabase user:', error);
    return null;
  }
}

/**
 * Middleware to automatically sync users on protected routes
 * Add this after requireAuth() to ensure user exists in Supabase
 *
 * @example
 * app.get('/api/protected', requireAuth(), autoSyncUser(), handler);
 */
export function autoSyncUser() {
  return async (req: Request, res: any, next: any) => {
    const supabaseUserId = await ensureUserExists(req);

    if (!supabaseUserId) {
      console.warn('User sync failed - proceeding without Supabase user');
      // Don't block request - some endpoints may not need Supabase user
    }

    // Attach Supabase user ID to request for easy access in handlers
    (req as any).supabaseUserId = supabaseUserId;
    next();
  };
}

/**
 * Get Supabase user ID from request
 * Must be used after autoSyncUser() middleware
 */
export function getSupabaseUserIdFromRequest(req: Request): string | null {
  return (req as any).supabaseUserId || null;
}
