/**
 * Performance optimization and monitoring utilities
 */

export {
  PerformanceMonitor,
  lazyWithRetry,
  prefetchRoute,
  usePrefetchOnInteraction,
  profileComponent,
  debounce,
  throttle,
  prefersReducedMotion,
  getTransitionDuration,
} from './optimization';

export {
  initWebVitalsTracking,
  trackAPICall,
  trackError,
  markTiming,
  measureTiming,
  getPerformanceReport,
  exportMetrics,
  metricsStore,
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_BUDGETS,
} from './monitoring';

export type {
  PerformanceMetric,
  APIMetric,
  ErrorMetric,
} from './monitoring';
