import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './index';

/**
 * Protected Route Components for Agrellus AgFin MVP
 *
 * Provides route protection and conditional rendering based on authentication state.
 */

// ============================================================================
// Loading Skeleton
// ============================================================================

/**
 * Loading screen shown during authentication state checks
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#061623] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-[#30714C] rounded-xl flex items-center justify-center mb-4 animate-pulse">
          <span className="text-white text-2xl font-bold">A</span>
        </div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Conditional Rendering Components
// ============================================================================

interface ConditionalProps {
  children: ReactNode;
  /** Optional fallback content when condition is not met */
  fallback?: ReactNode;
}

/**
 * Renders children only when user is signed in
 *
 * @example
 * <SignedIn>
 *   <UserProfile />
 * </SignedIn>
 */
export function SignedIn({ children, fallback = null }: ConditionalProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return isSignedIn ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders children only when user is signed out
 *
 * @example
 * <SignedOut>
 *   <LoginPrompt />
 * </SignedOut>
 */
export function SignedOut({ children, fallback = null }: ConditionalProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return !isSignedIn ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Redirect Components
// ============================================================================

interface RedirectToSignInProps {
  /** Optional return URL to redirect to after sign-in */
  returnUrl?: string;
}

/**
 * Redirects to sign-in page with optional return URL
 *
 * @example
 * if (!isSignedIn) return <RedirectToSignIn />
 */
export function RedirectToSignIn({ returnUrl }: RedirectToSignInProps = {}) {
  const location = useLocation();

  // Preserve the current location as return URL if not explicitly provided
  const redirectUrl = returnUrl || location.pathname + location.search;

  // Only include return URL if it's not the sign-in page itself
  const shouldPreserveReturn = redirectUrl !== '/sign-in' && redirectUrl !== '/';

  return (
    <Navigate
      to="/sign-in"
      state={{ returnUrl: shouldPreserveReturn ? redirectUrl : undefined }}
      replace
    />
  );
}

// ============================================================================
// Protected Route HOC
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional: Redirect to specific URL instead of /sign-in */
  redirectTo?: string;
  /** Optional: Custom loading component */
  loadingComponent?: ReactNode;
}

/**
 * Higher-Order Component for protecting routes
 *
 * Renders children only when user is authenticated.
 * Shows loading state during auth check.
 * Redirects to sign-in if not authenticated.
 *
 * @example
 * <Route path="/app" element={
 *   <ProtectedRoute>
 *     <AppPage />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({
  children,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // Show loading screen while checking auth state
  if (!isLoaded) {
    return loadingComponent || <LoadingScreen />;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Use RedirectToSignIn to preserve return URL
    return <RedirectToSignIn />;
  }

  // User is authenticated - render protected content
  return <>{children}</>;
}

// ============================================================================
// Route Guard HOC (Alternative API)
// ============================================================================

interface RouteGuardProps {
  children: ReactNode;
  /** Custom condition function - return true to allow access */
  condition?: (isSignedIn: boolean, isLoaded: boolean) => boolean;
  /** Fallback component when condition is not met */
  fallback?: ReactNode;
}

/**
 * Flexible route guard with custom conditions
 *
 * @example
 * // Only show to signed-in users
 * <RouteGuard condition={(signedIn) => signedIn}>
 *   <AdminPanel />
 * </RouteGuard>
 *
 * @example
 * // Only show to signed-out users (e.g., public marketing page)
 * <RouteGuard
 *   condition={(signedIn) => !signedIn}
 *   fallback={<Navigate to="/app" />}
 * >
 *   <LandingPage />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  condition,
  fallback,
}: RouteGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const shouldRender = condition
    ? condition(isSignedIn, isLoaded)
    : isSignedIn;

  if (!shouldRender) {
    return fallback || <RedirectToSignIn />;
  }

  return <>{children}</>;
}

// ============================================================================
// Hook for checking auth state in components
// ============================================================================

/**
 * Hook to check if user has access to current route
 *
 * @example
 * function MyComponent() {
 *   const { hasAccess, isLoading } = useRouteAccess();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!hasAccess) return <AccessDenied />;
 *
 *   return <ProtectedContent />;
 * }
 */
export function useRouteAccess() {
  const { isSignedIn, isLoaded } = useAuth();

  return {
    hasAccess: isSignedIn,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn,
  };
}
