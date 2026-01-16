/**
 * Screen Reader Announcer
 *
 * Implements ARIA live regions for dynamic content announcements
 * - Polite announcements (non-interrupting)
 * - Assertive announcements (interrupting)
 * - Status updates
 * - Error announcements
 * - Navigation changes
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Politeness levels for announcements
 * - off: No announcement (default for most content)
 * - polite: Announce when convenient (form submissions, loading states)
 * - assertive: Announce immediately (errors, urgent notifications)
 */
type PolitenessLevel = 'off' | 'polite' | 'assertive';

/**
 * Announcement message with priority
 */
interface Announcement {
  id: string;
  message: string;
  politeness: PolitenessLevel;
  timestamp: number;
}

/**
 * Announcer context value
 */
interface AnnouncerContextValue {
  announce: (message: string, politeness?: PolitenessLevel) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
  announceLoading: (message: string) => void;
  announceNavigation: (pageName: string) => void;
  clearAnnouncements: () => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

/**
 * Hook to access announcer
 */
export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within AnnouncerProvider');
  }
  return context;
}

/**
 * Provider for screen reader announcements
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeAnnouncements, setPoliteAnnouncements] = useState<Announcement[]>([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<Announcement[]>([]);

  /**
   * Main announce function
   */
  const announce = useCallback((message: string, politeness: PolitenessLevel = 'polite') => {
    if (!message.trim() || politeness === 'off') return;

    const announcement: Announcement = {
      id: `${Date.now()}-${Math.random()}`,
      message: message.trim(),
      politeness,
      timestamp: Date.now(),
    };

    if (politeness === 'assertive') {
      setAssertiveAnnouncements((prev) => [...prev, announcement]);
    } else {
      setPoliteAnnouncements((prev) => [...prev, announcement]);
    }
  }, []);

  /**
   * Announce with polite priority (non-interrupting)
   */
  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  /**
   * Announce with assertive priority (interrupting)
   */
  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  /**
   * Announce error (assertive)
   */
  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  /**
   * Announce success (polite)
   */
  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  /**
   * Announce loading state (polite)
   */
  const announceLoading = useCallback((message: string) => {
    announce(`Loading: ${message}`, 'polite');
  }, [announce]);

  /**
   * Announce navigation change (assertive for immediate feedback)
   */
  const announceNavigation = useCallback((pageName: string) => {
    announce(`Navigated to ${pageName}`, 'assertive');
  }, [announce]);

  /**
   * Clear all announcements
   */
  const clearAnnouncements = useCallback(() => {
    setPoliteAnnouncements([]);
    setAssertiveAnnouncements([]);
  }, []);

  /**
   * Auto-clear announcements after timeout
   */
  useEffect(() => {
    const clearOldAnnouncements = (
      announcements: Announcement[],
      setter: React.Dispatch<React.SetStateAction<Announcement[]>>
    ) => {
      const now = Date.now();
      const filtered = announcements.filter(
        (announcement) => now - announcement.timestamp < 5000 // Keep for 5 seconds
      );
      if (filtered.length !== announcements.length) {
        setter(filtered);
      }
    };

    const interval = setInterval(() => {
      clearOldAnnouncements(politeAnnouncements, setPoliteAnnouncements);
      clearOldAnnouncements(assertiveAnnouncements, setAssertiveAnnouncements);
    }, 1000);

    return () => clearInterval(interval);
  }, [politeAnnouncements, assertiveAnnouncements]);

  const contextValue: AnnouncerContextValue = {
    announce,
    announcePolite,
    announceAssertive,
    announceError,
    announceSuccess,
    announceLoading,
    announceNavigation,
    clearAnnouncements,
  };

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}

      {/* Polite live region (aria-live="polite") */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="announcer-polite"
      >
        {politeAnnouncements.length > 0 ? politeAnnouncements[politeAnnouncements.length - 1].message : ''}
      </div>

      {/* Assertive live region (aria-live="assertive") */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="announcer-assertive"
      >
        {assertiveAnnouncements.length > 0 ? assertiveAnnouncements[assertiveAnnouncements.length - 1].message : ''}
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Announcer component (deprecated - use AnnouncerProvider instead)
 * Kept for backwards compatibility
 */
export default AnnouncerProvider;

/**
 * Screen reader only utility component
 */
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Visual + Screen reader announcement component
 * Shows message visually and announces to screen readers
 */
export function VisualAnnouncement({
  children,
  type = 'polite',
  className = '',
}: {
  children: ReactNode;
  type?: 'polite' | 'assertive';
  className?: string;
}) {
  return (
    <div
      role={type === 'assertive' ? 'alert' : 'status'}
      aria-live={type}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Hook to announce on component mount
 */
export function useAnnounceOnMount(message: string, politeness: PolitenessLevel = 'polite') {
  const { announce } = useAnnouncer();

  useEffect(() => {
    if (message) {
      announce(message, politeness);
    }
  }, []); // Only on mount
}

/**
 * Hook to announce when value changes
 */
export function useAnnounceOnChange(
  value: string | number | boolean | null | undefined,
  getMessage: (value: any) => string,
  politeness: PolitenessLevel = 'polite'
) {
  const { announce } = useAnnouncer();

  useEffect(() => {
    const message = getMessage(value);
    if (message) {
      announce(message, politeness);
    }
  }, [value, getMessage, announce, politeness]);
}

/**
 * Hook to announce navigation changes
 */
export function useAnnounceNavigation(pageName: string) {
  const { announceNavigation } = useAnnouncer();

  useEffect(() => {
    if (pageName) {
      announceNavigation(pageName);
    }
  }, [pageName, announceNavigation]);
}

/**
 * Hook to announce loading states
 */
export function useAnnounceLoading(isLoading: boolean, loadingMessage: string, completeMessage?: string) {
  const { announceLoading, announcePolite } = useAnnouncer();

  useEffect(() => {
    if (isLoading) {
      announceLoading(loadingMessage);
    } else if (completeMessage) {
      announcePolite(completeMessage);
    }
  }, [isLoading, loadingMessage, completeMessage, announceLoading, announcePolite]);
}

/**
 * Hook to announce form errors
 */
export function useAnnounceFormError(error: string | null | undefined) {
  const { announceError } = useAnnouncer();

  useEffect(() => {
    if (error) {
      announceError(error);
    }
  }, [error, announceError]);
}

/**
 * Hook to announce success messages
 */
export function useAnnounceSuccess(success: string | null | undefined) {
  const { announceSuccess } = useAnnouncer();

  useEffect(() => {
    if (success) {
      announceSuccess(success);
    }
  }, [success, announceSuccess]);
}

/**
 * Status message component with live region
 */
export function StatusMessage({ message, type = 'polite' }: { message: string; type?: 'polite' | 'assertive' }) {
  return (
    <div
      role={type === 'assertive' ? 'alert' : 'status'}
      aria-live={type}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

/**
 * Loading announcement component
 */
export function LoadingAnnouncement({ message = 'Loading' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      {message}
    </div>
  );
}

/**
 * Error announcement component
 */
export function ErrorAnnouncement({ error }: { error: string }) {
  return (
    <div role="alert" aria-live="assertive">
      Error: {error}
    </div>
  );
}

/**
 * Success announcement component
 */
export function SuccessAnnouncement({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite">
      Success: {message}
    </div>
  );
}
