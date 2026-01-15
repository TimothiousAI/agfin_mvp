/**
 * Authentication hooks for React components
 * Works with both Clerk and mock authentication providers
 */

import { useUser, useAuth as useClerkAuth, useSession as useClerkSession } from '@clerk/clerk-react';

/**
 * Hook to get current authenticated user
 * Returns user data and loading state
 *
 * @example
 * const { user, isLoaded, isSignedIn } = useCurrentUser();
 * if (isLoaded && isSignedIn) {
 *   console.log('User email:', user.primaryEmailAddress?.emailAddress);
 * }
 */
export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  return {
    user,
    isLoaded,
    isSignedIn,
    // Convenience helpers
    email: user?.primaryEmailAddress?.emailAddress || null,
    userId: user?.id || null,
    fullName: user?.fullName || null,
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    imageUrl: user?.imageUrl || null,
  };
}

/**
 * Hook for authentication actions (sign in, sign out, etc.)
 *
 * @example
 * const { signOut, isLoaded } = useAuthActions();
 * await signOut();
 */
export function useAuthActions() {
  const { signOut, isLoaded, userId, sessionId } = useClerkAuth();

  return {
    signOut,
    isLoaded,
    userId,
    sessionId,
    isSignedIn: !!userId,
  };
}

/**
 * Hook for session management
 * Returns session data and status
 *
 * @example
 * const { session, isLoaded } = useSession();
 * if (session) {
 *   console.log('Session ID:', session.id);
 * }
 */
export function useSession() {
  const { session, isLoaded } = useClerkSession();

  return {
    session,
    isLoaded,
    isActive: !!session,
    sessionId: session?.id || null,
    userId: session?.user?.id || null,
  };
}

/**
 * Combined hook that provides all auth state
 * Convenience wrapper around individual hooks
 *
 * @example
 * const { user, signOut, session, isLoaded } = useAuthState();
 */
export function useAuthState() {
  const currentUser = useCurrentUser();
  const auth = useAuthActions();
  const session = useSession();

  return {
    // User data
    user: currentUser.user,
    email: currentUser.email,
    userId: currentUser.userId,
    fullName: currentUser.fullName,

    // Auth actions
    signOut: auth.signOut,

    // Session data
    session: session.session,
    sessionId: session.sessionId,

    // Loading states
    isLoaded: currentUser.isLoaded && auth.isLoaded && session.isLoaded,
    isSignedIn: currentUser.isSignedIn,
  };
}

/**
 * Type-safe user data interface
 * Extract user properties without depending on Clerk types
 */
export interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
}

/**
 * Hook to get simplified, type-safe user data
 * Useful when you don't need the full Clerk user object
 *
 * @example
 * const userData = useUserData();
 * if (userData) {
 *   console.log('Welcome', userData.fullName);
 * }
 */
export function useUserData(): UserData | null {
  const { user, isSignedIn } = useCurrentUser();

  if (!isSignedIn || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || null,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
  };
}
