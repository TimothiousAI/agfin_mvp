import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './core/queryClient'
import './index.css'
import './shared/ui/focus-styles.css'
import './shared/ui/high-contrast.css'
import './shared/accessibility/color-independent.css'
import './shared/accessibility/reduced-motion.css'
import './shared/accessibility/announcer.css'
import App from './App.tsx'
import { initReducedMotionListener } from './shared/accessibility'

// Use mock provider for development if no Clerk key is configured
const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const isDev = import.meta.env.MODE === 'development';
const useMockAuth = isDev && !hasClerkKey;

if (useMockAuth) {
  console.warn('[Dev Mode] Using mock Clerk provider - no real authentication');
}

// Dynamically import the appropriate provider
const AuthProvider = useMockAuth
  ? (await import('./auth/mock-clerk-provider')).MockClerkProvider
  : (await import('./auth/clerk-provider')).ClerkProvider;

// Initialize reduced motion listener
initReducedMotionListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
