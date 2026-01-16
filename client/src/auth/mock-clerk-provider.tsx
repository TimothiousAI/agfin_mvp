import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

/**
 * Mock Clerk Provider for Development/Testing
 *
 * This is a minimal mock of Clerk's authentication context
 * to allow UI testing without real Clerk API keys.
 *
 * IMPORTANT: This should only be used in development/demo mode.
 * Production should use real ClerkProvider.
 *
 * Note: RLS is bypassed in dev mode via service role key in database.ts
 */

interface MockAuthContext {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any | null;
  signOut: () => Promise<void>;
}

interface MockSignInContext {
  isLoaded: boolean;
  signIn: {
    create: (params: any) => Promise<any>;
    prepareFirstFactor: (params: any) => Promise<any>;
    attemptFirstFactor: (params: any) => Promise<any>;
  };
  setActive: (params: any) => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContext>({
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: async () => {},
});

const MockSignInContext = createContext<MockSignInContext>({
  isLoaded: true,
  signIn: {
    create: async () => ({}),
    prepareFirstFactor: async () => ({}),
    attemptFirstFactor: async () => ({ status: 'complete', createdSessionId: 'mock-session' }),
  },
  setActive: async () => {},
});

export function MockClerkProvider({ children }: { children: ReactNode }) {
  // Use sessionStorage to persist auth state across navigation
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return sessionStorage.getItem('mock_clerk_signed_in') === 'true';
  });

  // Dev user - can be overridden via env var
  const devEmail = import.meta.env.VITE_DEV_USER_EMAIL || 'timcarter76@gmail.com';
  const [user] = useState({
    id: 'dev-user-id',
    primaryEmailAddress: { emailAddress: devEmail },
    firstName: 'Tim',
    lastName: 'Carter',
  });

  // Helper to update sign-in state
  const updateSignInState = (signedIn: boolean) => {
    if (signedIn) {
      sessionStorage.setItem('mock_clerk_signed_in', 'true');
    } else {
      sessionStorage.removeItem('mock_clerk_signed_in');
    }
    setIsSignedIn(signedIn);
  };

  const authValue: MockAuthContext = {
    isLoaded: true,
    isSignedIn,
    user: isSignedIn ? user : null,
    signOut: async () => {
      updateSignInState(false);
    },
  };

  const signInValue: MockSignInContext = {
    isLoaded: true,
    signIn: {
      create: async (params: any) => {
        console.log('[MockClerk] Creating sign-in with:', params);

        // Return a mock SignInResource object with the required methods
        const mockSignInAttempt = {
          status: 'needs_first_factor',
          supportedFirstFactors: [
            {
              strategy: 'email_code',
              emailAddressId: 'mock-email-id',
            },
          ],
          prepareFirstFactor: async (prepareParams: any) => {
            console.log('[MockClerk] Preparing first factor:', prepareParams);
            // Simulate sending OTP
            await new Promise(resolve => setTimeout(resolve, 500));
            return { status: 'prepared' };
          },
          attemptFirstFactor: async (attemptParams: any) => {
            console.log('[MockClerk] Attempting first factor with code:', attemptParams.code);
            // Simulate OTP verification
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
              status: 'complete',
              createdSessionId: 'mock-session-id',
            };
          },
        };

        return mockSignInAttempt;
      },
      prepareFirstFactor: async (params: any) => {
        console.log('[MockClerk] Preparing first factor (direct):', params);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { status: 'prepared' };
      },
      attemptFirstFactor: async (params: any) => {
        console.log('[MockClerk] Attempting first factor (direct):', params.code);
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          status: 'complete',
          createdSessionId: 'mock-session-id',
        };
      },
    },
    setActive: async (params: any) => {
      console.log('[MockClerk] Setting active session:', params);
      updateSignInState(true);
    },
  };

  return (
    <MockAuthContext.Provider value={authValue}>
      <MockSignInContext.Provider value={signInValue}>
        {children}
      </MockSignInContext.Provider>
    </MockAuthContext.Provider>
  );
}

// Mock hooks
export function useAuth() {
  return useContext(MockAuthContext);
}

export function useUser() {
  const { user } = useContext(MockAuthContext);
  return { user, isLoaded: true };
}

export function useSignIn() {
  return useContext(MockSignInContext);
}

// Export other mock hooks/components
export const useClerk = () => ({ signOut: useAuth().signOut });
export const useSignUp = () => ({ isLoaded: true, signUp: {} });
export const useSession = () => ({ session: null, isLoaded: true });
export const useSessionList = () => ({ sessions: [], isLoaded: true });

// Mock components (not used but exported for compatibility)
export const SignIn = () => <div>MockSignIn</div>;
export const SignUp = () => <div>MockSignUp</div>;
export const UserButton = () => <button>Mock User</button>;
export const UserProfile = () => <div>MockUserProfile</div>;
export const OrganizationSwitcher = () => <div>MockOrgSwitcher</div>;
export const OrganizationProfile = () => <div>MockOrgProfile</div>;
export const CreateOrganization = () => <div>MockCreateOrg</div>;
export const SignInButton = () => <button>Sign In</button>;
export const SignUpButton = () => <button>Sign Up</button>;
export const SignOutButton = () => <button>Sign Out</button>;
