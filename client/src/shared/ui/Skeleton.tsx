/**
 * Loading state components
 *
 * Provides skeleton loaders, spinners, and progress bars for loading states
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Base Skeleton component with shimmer animation
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Custom className
   */
  className?: string;

  /**
   * Disable shimmer animation
   */
  noAnimation?: boolean;
}

export function Skeleton({ className, noAnimation = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded',
        !noAnimation && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton with shimmer effect (more sophisticated than pulse)
 */
export function SkeletonShimmer({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

/**
 * Skeleton for text lines
 */
export interface SkeletonTextProps {
  /**
   * Number of lines
   */
  lines?: number;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Randomize line widths
   */
  randomize?: boolean;
}

export function SkeletonText({ lines = 3, className, randomize = true }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLastLine = i === lines - 1;
        const randomWidth = randomize && isLastLine ? Math.floor(Math.random() * 30 + 50) : 100;

        return (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: randomize ? `${randomWidth}%` : '100%',
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Skeleton for card
 */
export interface SkeletonCardProps {
  /**
   * Show image placeholder
   */
  hasImage?: boolean;

  /**
   * Show avatar
   */
  hasAvatar?: boolean;

  /**
   * Number of text lines
   */
  lines?: number;

  /**
   * Custom className
   */
  className?: string;
}

export function SkeletonCard({
  hasImage = true,
  hasAvatar = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4', className)}>
      {hasImage && <Skeleton className="w-full h-48 rounded-md" />}

      <div className="space-y-3">
        {hasAvatar && (
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        )}

        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}

/**
 * Skeleton for list items
 */
export interface SkeletonListProps {
  /**
   * Number of items
   */
  count?: number;

  /**
   * Show avatar for each item
   */
  hasAvatar?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

export function SkeletonList({ count = 5, hasAvatar = true, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {hasAvatar && <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for table
 */
export interface SkeletonTableProps {
  /**
   * Number of rows
   */
  rows?: number;

  /**
   * Number of columns
   */
  columns?: number;

  /**
   * Custom className
   */
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Spinner component for buttons and inline loading
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom className
   */
  className?: string;

  /**
   * Label for screen readers
   */
  label?: string;
}

const SPINNER_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function Spinner({ size = 'md', className, label = 'Loading...', ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-block', className)}
      {...props}
    >
      <Loader2 className={cn(SPINNER_SIZES[size], 'animate-spin text-current')} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Progress bar for uploads and long operations
 */
export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   */
  value: number;

  /**
   * Show percentage label
   */
  showLabel?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Color variant
   */
  variant?: 'default' | 'success' | 'warning' | 'error';

  /**
   * Custom className
   */
  className?: string;

  /**
   * Indeterminate (animated loading bar)
   */
  indeterminate?: boolean;
}

const PROGRESS_SIZES = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const PROGRESS_COLORS = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  variant = 'default',
  className,
  indeterminate = false,
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {indeterminate ? 'Loading...' : `${Math.round(clampedValue)}%`}
          </span>
        </div>
      )}

      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          PROGRESS_SIZES[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {indeterminate ? (
          <div
            className={cn(
              'h-full rounded-full animate-progress-indeterminate',
              PROGRESS_COLORS[variant]
            )}
            style={{ width: '40%' }}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              PROGRESS_COLORS[variant]
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Loading button state (button with spinner)
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Button children
   */
  children: React.ReactNode;

  /**
   * Spinner size
   */
  spinnerSize?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({
  loading = false,
  children,
  spinnerSize = 'sm',
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      {...props}
    >
      {loading && <Spinner size={spinnerSize} className="absolute" />}
      <span className={cn(loading && 'invisible')}>{children}</span>
    </button>
  );
}

/**
 * Full page loading overlay
 */
export interface LoadingOverlayProps {
  /**
   * Show overlay
   */
  show: boolean;

  /**
   * Loading message
   */
  message?: string;

  /**
   * Spinner size
   */
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingOverlay({ show, message, size = 'lg' }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <Spinner size={size} />
        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
        )}
      </div>
    </div>
  );
}
