/**
 * Performance optimization utilities for context switching and rendering
 *
 * Goals:
 * - Context-switch latency < 300ms
 * - Lazy load heavy components
 * - Optimize re-renders with memoization
 * - Prefetch likely next views
 */

import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

/**
 * Performance measurement utilities using Performance API
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  /**
   * Mark the start of a performance measurement
   */
  static markStart(label: string): void {
    const markName = `${label}-start`;
    this.marks.set(label, performance.now());

    if (performance.mark) {
      performance.mark(markName);
    }
  }

  /**
   * Mark the end of a performance measurement and log duration
   */
  static markEnd(label: string): number {
    const startTime = this.marks.get(label);
    const endTime = performance.now();

    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${label}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.marks.delete(label);

    if (performance.mark && performance.measure) {
      const endMarkName = `${label}-end`;
      performance.mark(endMarkName);

      try {
        performance.measure(label, `${label}-start`, endMarkName);
      } catch (e) {
        // Ignore if marks don't exist
      }
    }

    // Log if exceeds threshold
    const threshold = 300; // ms
    if (duration > threshold) {
      console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    } else {
      console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  static measure<T>(label: string, fn: () => T): T {
    this.markStart(label);
    try {
      const result = fn();
      return result;
    } finally {
      this.markEnd(label);
    }
  }

  /**
   * Get all performance entries for a label
   */
  static getEntries(label?: string): PerformanceEntry[] {
    if (label) {
      return performance.getEntriesByName(label);
    }
    return performance.getEntriesByType('measure');
  }

  /**
   * Clear all performance marks and measures
   */
  static clear(): void {
    this.marks.clear();
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
}

/**
 * Enhanced lazy loading with retry logic for failed chunk loads
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName: string = 'Component'
): LazyExoticComponent<T> {
  return lazy(() => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    return componentImport().catch((error) => {
      console.error(`[LazyLoad] Failed to load ${componentName}:`, error);

      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume the user may have an outdated version
        // Force refresh the page
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }

      // If already refreshed, throw the error
      throw error;
    });
  });
}

/**
 * Prefetch a route's component
 */
export function prefetchRoute(routeImport: () => Promise<any>): void {
  // Check if we're on a fast connection before prefetching
  const connection = (navigator as any).connection;

  if (connection) {
    // Don't prefetch on slow connections or save-data mode
    if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return;
    }
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routeImport().catch(() => {
        // Silently ignore prefetch errors
      });
    });
  } else {
    setTimeout(() => {
      routeImport().catch(() => {
        // Silently ignore prefetch errors
      });
    }, 1);
  }
}

/**
 * Prefetch on hover/focus (for link components)
 */
export function usePrefetchOnInteraction(
  routeImport: () => Promise<any>,
  enabled: boolean = true
) {
  if (!enabled) {
    return { onMouseEnter: undefined, onFocus: undefined };
  }

  let prefetched = false;

  const prefetch = () => {
    if (!prefetched) {
      prefetched = true;
      prefetchRoute(routeImport);
    }
  };

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  };
}

/**
 * Component render profiler (development only)
 */
export function profileComponent(
  componentName: string,
  onRenderCallback?: (duration: number) => void
) {
  return (
    _id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    _startTime: number,
    _commitTime: number
  ) => {
    if (import.meta.env.MODE === 'development') {
      const threshold = 16; // 60fps = 16.67ms per frame

      if (actualDuration > threshold) {
        console.warn(
          `[Profiler] ${componentName} (${phase}) took ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`
        );
      }
    }

    onRenderCallback?.(actualDuration);
  };
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get transition duration based on user preference
 */
export function getTransitionDuration(defaultMs: number = 200): number {
  return prefersReducedMotion() ? 0 : defaultMs;
}
