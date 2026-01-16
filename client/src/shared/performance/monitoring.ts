/**
 * Performance Monitoring System
 *
 * Tracks Web Vitals, API response times, error rates, and custom metrics.
 * Provides real-time performance observability for the application.
 */

// Web Vitals metrics thresholds (Google's recommended values)
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,  // Largest Contentful Paint - Good: <2.5s
  FID: 100,   // First Input Delay - Good: <100ms
  CLS: 0.1,   // Cumulative Layout Shift - Good: <0.1
  FCP: 1800,  // First Contentful Paint - Good: <1.8s
  TTFB: 800,  // Time to First Byte - Good: <800ms
  INP: 200,   // Interaction to Next Paint - Good: <200ms
} as const;

// Performance budget thresholds
export const PERFORMANCE_BUDGETS = {
  apiResponseTime: 1000,  // API calls should complete in <1s
  pageLoadTime: 3000,     // Initial page load <3s
  errorRate: 0.01,        // Error rate <1%
} as const;

/**
 * Metric data structure
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url?: string;
  metadata?: Record<string, any>;
}

/**
 * API call metric
 */
export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

/**
 * Error metric
 */
export interface ErrorMetric {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
}

/**
 * Performance metrics store
 */
class PerformanceMetricsStore {
  private webVitals: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private customMetrics: Map<string, number[]> = new Map();

  // Listeners for real-time updates
  private listeners: Array<(metric: PerformanceMetric) => void> = [];

  /**
   * Record a Web Vitals metric
   */
  recordWebVital(metric: PerformanceMetric): void {
    this.webVitals.push(metric);
    this.notifyListeners(metric);

    // Check if metric exceeds threshold
    if (metric.rating === 'poor') {
      console.warn(`[Performance] ${metric.name} is poor:`, metric.value);
    }

    // Keep only last 100 metrics
    if (this.webVitals.length > 100) {
      this.webVitals = this.webVitals.slice(-100);
    }
  }

  /**
   * Record an API call metric
   */
  recordAPICall(metric: APIMetric): void {
    this.apiMetrics.push(metric);

    // Log slow API calls
    if (metric.duration > PERFORMANCE_BUDGETS.apiResponseTime) {
      console.warn(
        `[Performance] Slow API call: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`
      );
    }

    // Keep only last 100 API metrics
    if (this.apiMetrics.length > 100) {
      this.apiMetrics = this.apiMetrics.slice(-100);
    }
  }

  /**
   * Record an error
   */
  recordError(metric: ErrorMetric): void {
    this.errorMetrics.push(metric);

    // Keep only last 50 errors
    if (this.errorMetrics.length > 50) {
      this.errorMetrics = this.errorMetrics.slice(-50);
    }
  }

  /**
   * Record a custom metric
   */
  recordCustom(name: string, value: number): void {
    if (!this.customMetrics.has(name)) {
      this.customMetrics.set(name, []);
    }
    const metrics = this.customMetrics.get(name)!;
    metrics.push(value);

    // Keep only last 100 values
    if (metrics.length > 100) {
      this.customMetrics.set(name, metrics.slice(-100));
    }
  }

  /**
   * Get all Web Vitals metrics
   */
  getWebVitals(): PerformanceMetric[] {
    return [...this.webVitals];
  }

  /**
   * Get API metrics summary
   */
  getAPIMetricsSummary(): {
    totalCalls: number;
    averageResponseTime: number;
    errorRate: number;
    slowestCalls: APIMetric[];
  } {
    if (this.apiMetrics.length === 0) {
      return {
        totalCalls: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowestCalls: [],
      };
    }

    const totalCalls = this.apiMetrics.length;
    const averageResponseTime =
      this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
    const errorCount = this.apiMetrics.filter((m) => !m.success).length;
    const errorRate = errorCount / totalCalls;
    const slowestCalls = [...this.apiMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      totalCalls,
      averageResponseTime,
      errorRate,
      slowestCalls,
    };
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    const totalRequests = this.apiMetrics.length;
    if (totalRequests === 0) return 0;

    const errorCount = this.errorMetrics.length;
    return errorCount / totalRequests;
  }

  /**
   * Get custom metric statistics
   */
  getCustomMetricStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.customMetrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(metric: PerformanceMetric): void {
    this.listeners.forEach((listener) => listener(metric));
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = ['=== Performance Report ===', ''];

    // Web Vitals
    report.push('Web Vitals:');
    const latestVitals = this.getLatestWebVitals();
    for (const [name, metric] of Object.entries(latestVitals)) {
      if (metric) {
        report.push(`  ${name}: ${metric.value.toFixed(2)} (${metric.rating})`);
      }
    }
    report.push('');

    // API Performance
    const apiSummary = this.getAPIMetricsSummary();
    report.push('API Performance:');
    report.push(`  Total calls: ${apiSummary.totalCalls}`);
    report.push(`  Avg response time: ${apiSummary.averageResponseTime.toFixed(2)}ms`);
    report.push(`  Error rate: ${(apiSummary.errorRate * 100).toFixed(2)}%`);
    report.push('');

    // Error rate
    const errorRate = this.getErrorRate();
    report.push(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    report.push('');

    return report.join('\n');
  }

  /**
   * Get latest Web Vitals metrics
   */
  private getLatestWebVitals(): Record<string, PerformanceMetric | undefined> {
    const latest: Record<string, PerformanceMetric | undefined> = {};
    for (const metric of this.webVitals) {
      if (!latest[metric.name] || metric.timestamp > latest[metric.name]!.timestamp) {
        latest[metric.name] = metric;
      }
    }
    return latest;
  }
}

// Global metrics store
export const metricsStore = new PerformanceMetricsStore();

/**
 * Rate a metric value against threshold
 */
function rateMetric(
  name: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name];
  if (value <= threshold) return 'good';
  if (value <= threshold * 1.5) return 'needs-improvement';
  return 'poor';
}

/**
 * Initialize Web Vitals tracking
 * Uses the web-vitals library if available, falls back to manual tracking
 */
export async function initWebVitalsTracking(): Promise<void> {
  try {
    // @ts-ignore - web-vitals types
    const webVitals = await import('web-vitals');

    // Track LCP (Largest Contentful Paint)
    webVitals.onLCP((metric: any) => {
      metricsStore.recordWebVital({
        name: 'LCP',
        value: metric.value,
        rating: rateMetric('LCP', metric.value),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track FID (First Input Delay) - deprecated in web-vitals v4, use INP
    if ('onFID' in webVitals) {
      (webVitals as any).onFID((metric: any) => {
        metricsStore.recordWebVital({
          name: 'FID',
          value: metric.value,
          rating: rateMetric('FID', metric.value),
          timestamp: Date.now(),
          url: window.location.href,
        });
      });
    }

    // Track CLS (Cumulative Layout Shift)
    webVitals.onCLS((metric: any) => {
      metricsStore.recordWebVital({
        name: 'CLS',
        value: metric.value,
        rating: rateMetric('CLS', metric.value),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track FCP (First Contentful Paint)
    webVitals.onFCP((metric: any) => {
      metricsStore.recordWebVital({
        name: 'FCP',
        value: metric.value,
        rating: rateMetric('FCP', metric.value),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track TTFB (Time to First Byte)
    webVitals.onTTFB((metric: any) => {
      metricsStore.recordWebVital({
        name: 'TTFB',
        value: metric.value,
        rating: rateMetric('TTFB', metric.value),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track INP (Interaction to Next Paint) - replaces FID
    if ('onINP' in webVitals) {
      (webVitals as any).onINP((metric: any) => {
        metricsStore.recordWebVital({
          name: 'INP',
          value: metric.value,
          rating: rateMetric('INP', metric.value),
          timestamp: Date.now(),
          url: window.location.href,
        });
      });
    }

    console.log('[Performance] Web Vitals tracking initialized');
  } catch (error) {
    console.warn('[Performance] web-vitals library not available, using manual tracking');
    initManualWebVitalsTracking();
  }
}

/**
 * Manual Web Vitals tracking using Performance API
 */
function initManualWebVitalsTracking(): void {
  // Track LCP using PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          metricsStore.recordWebVital({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: rateMetric('LCP', lastEntry.renderTime || lastEntry.loadTime),
            timestamp: Date.now(),
            url: window.location.href,
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  startTime: number,
  status: number
): void {
  const duration = Date.now() - startTime;
  const success = status >= 200 && status < 400;

  metricsStore.recordAPICall({
    endpoint,
    method,
    duration,
    status,
    timestamp: Date.now(),
    success,
  });
}

/**
 * Track error
 */
export function trackError(error: Error): void {
  metricsStore.recordError({
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Mark performance timing
 */
export function markTiming(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 */
export function measureTiming(name: string, startMark: string, endMark: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        metricsStore.recordCustom(name, measure.duration);
        return measure.duration;
      }
    } catch (e) {
      // Marks not found
    }
  }
  return 0;
}

/**
 * Get performance report
 */
export function getPerformanceReport(): string {
  return metricsStore.generateReport();
}

/**
 * Export metrics for external monitoring service
 */
export function exportMetrics(): {
  webVitals: PerformanceMetric[];
  apiSummary: ReturnType<typeof metricsStore.getAPIMetricsSummary>;
  errorRate: number;
} {
  return {
    webVitals: metricsStore.getWebVitals(),
    apiSummary: metricsStore.getAPIMetricsSummary(),
    errorRate: metricsStore.getErrorRate(),
  };
}

// Initialize tracking when module loads
if (typeof window !== 'undefined') {
  initWebVitalsTracking();
}
