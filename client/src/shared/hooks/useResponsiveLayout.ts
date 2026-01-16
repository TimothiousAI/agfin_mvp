import { useState, useEffect } from 'react';

/**
 * Breakpoint constants for responsive design
 */
export const BREAKPOINTS = {
  mobile: 768,    // < 768px = mobile
  tablet: 1024,   // 768-1024px = tablet
  desktop: 1024,  // >= 1024px = desktop
} as const;

/**
 * Layout types based on screen size
 */
export type LayoutType = 'mobile' | 'tablet' | 'desktop';

/**
 * Breakpoint detection result
 */
export interface ResponsiveLayout {
  layout: LayoutType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * Detect current layout type based on window width
 */
function getLayoutType(width: number): LayoutType {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Get initial layout (SSR-safe)
 * Returns desktop as default for server-side rendering
 */
function getInitialLayout(): ResponsiveLayout {
  // SSR-safe: Check if window is defined
  if (typeof window === 'undefined') {
    return {
      layout: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1920,
      height: 1080,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const layout = getLayoutType(width);

  return {
    layout,
    isMobile: layout === 'mobile',
    isTablet: layout === 'tablet',
    isDesktop: layout === 'desktop',
    width,
    height,
  };
}

/**
 * Custom hook for responsive layout detection
 *
 * Features:
 * - Detects current layout type (mobile/tablet/desktop)
 * - Updates on window resize
 * - Debounced for performance
 * - SSR-safe (returns desktop on server)
 * - State preservation across breakpoint changes
 *
 * @param debounceMs - Debounce time for resize events (default: 150ms)
 * @returns ResponsiveLayout object with current layout information
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { layout, isMobile, isTablet, isDesktop } = useResponsiveLayout();
 *
 *   if (isMobile) return <MobileLayout />;
 *   if (isTablet) return <TabletLayout />;
 *   return <DesktopLayout />;
 * }
 * ```
 */
export function useResponsiveLayout(debounceMs: number = 150): ResponsiveLayout {
  const [responsiveLayout, setResponsiveLayout] = useState<ResponsiveLayout>(getInitialLayout);

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Debounce resize events
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const layout = getLayoutType(width);

        setResponsiveLayout({
          layout,
          isMobile: layout === 'mobile',
          isTablet: layout === 'tablet',
          isDesktop: layout === 'desktop',
          width,
          height,
        });
      }, debounceMs);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call once to set initial value (in case SSR default was used)
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [debounceMs]);

  return responsiveLayout;
}

/**
 * Hook to detect if screen matches a specific media query
 *
 * @param query - CSS media query string
 * @returns boolean indicating if media query matches
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isLandscape = useMediaQuery('(orientation: landscape)');
 *   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 *   return <div>Landscape: {isLandscape ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // SSR-safe: Return false on server
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Update state when media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
    }

    // Set initial value
    setMatches(mediaQuery.matches);

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hooks for common breakpoints
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
}

/**
 * Hook for touch device detection
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    // SSR-safe
    if (typeof window === 'undefined') {
      return false;
    }
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Some devices don't register touch until first touch
    const handleTouchStart = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', handleTouchStart);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return isTouch;
}
