import { ClerkProvider as ClerkProviderBase } from '@clerk/clerk-react';
import { ReactNode } from 'react';

/**
 * ClerkProvider wrapper component for Agrellus AgFin MVP
 *
 * Provides Clerk authentication context to the entire application.
 * Configured with Agrellus-specific theme and appearance customization.
 */

// Get Clerk publishable key from environment
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// In development, use a placeholder if key is missing (for UI testing)
const isDevelopment = import.meta.env.MODE === 'development';
const effectiveKey = clerkPublishableKey || (isDevelopment ? 'pk_test_placeholder_for_ui_demo' : '');

if (!effectiveKey) {
  throw new Error(
    'Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file.'
  );
}

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * Custom ClerkProvider with Agrellus theme
 *
 * Wraps the app with Clerk authentication provider and applies
 * custom appearance configuration matching AgFin brand.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkProviderBase
      publishableKey={effectiveKey}
      appearance={{
        // Agrellus brand colors and theme
        variables: {
          colorPrimary: '#16a34a', // Green-600 (agricultural/growth theme)
          colorSuccess: '#22c55e', // Green-500
          colorWarning: '#f59e0b', // Amber-500
          colorDanger: '#ef4444', // Red-500
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#ffffff',
          colorInputBackground: '#f9fafb', // Gray-50
          colorInputText: '#111827', // Gray-900
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderRadius: '0.5rem', // Rounded-lg
        },
        elements: {
          // Card styling
          card: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            border: '1px solid #e5e7eb', // Gray-200
          },
          // Header styling
          headerTitle: {
            fontSize: '1.875rem', // text-3xl
            fontWeight: '700',
            color: '#111827', // Gray-900
          },
          headerSubtitle: {
            fontSize: '0.875rem', // text-sm
            color: '#6b7280', // Gray-500
          },
          // Form styling
          formFieldLabel: {
            fontSize: '0.875rem', // text-sm
            fontWeight: '500',
            color: '#374151', // Gray-700
          },
          formFieldInput: {
            borderColor: '#d1d5db', // Gray-300
            '&:focus': {
              borderColor: '#16a34a', // Green-600
              boxShadow: '0 0 0 3px rgb(22 163 74 / 0.1)',
            },
          },
          // Button styling
          formButtonPrimary: {
            fontSize: '0.875rem', // text-sm
            fontWeight: '500',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#15803d', // Green-700
            },
          },
          // Footer styling
          footerActionLink: {
            color: '#16a34a', // Green-600
            '&:hover': {
              color: '#15803d', // Green-700
            },
          },
          // Badge styling (for OTP input)
          otpCodeFieldInput: {
            borderColor: '#d1d5db', // Gray-300
            '&:focus': {
              borderColor: '#16a34a', // Green-600
              boxShadow: '0 0 0 3px rgb(22 163 74 / 0.1)',
            },
          },
        },
        layout: {
          // Center align authentication forms
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
          shimmer: true,
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  );
}

/**
 * Export Clerk hooks for use throughout the app
 * These provide access to authentication state and user data
 *
 * Note: When using mock provider, these will be undefined.
 * Import from mock-clerk-provider instead in dev mode.
 */
export {
  useAuth,
  useUser,
  useClerk,
  useSignIn,
  useSignUp,
  useSession,
  useSessionList,
} from '@clerk/clerk-react';

/**
 * Export Clerk components for authentication UI
 */
export {
  SignIn,
  SignUp,
  UserButton,
  UserProfile,
  OrganizationSwitcher,
  OrganizationProfile,
  CreateOrganization,
  SignInButton,
  SignUpButton,
  SignOutButton,
} from '@clerk/clerk-react';
