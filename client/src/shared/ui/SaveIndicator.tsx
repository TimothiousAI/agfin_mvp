/**
 * Visual save indicator component
 *
 * Shows current save status with appropriate icon and color
 */

import { CheckCircle, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { type SaveStatus } from '../hooks/useAutoSave';
import { cn } from '@/lib/utils';

export interface SaveIndicatorProps {
  /**
   * Current save status
   */
  status: SaveStatus;

  /**
   * Error message (shown when status is 'error')
   */
  error?: string | null;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Show label text
   */
  showLabel?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG = {
  idle: {
    icon: Cloud,
    label: 'Auto-save enabled',
    color: 'text-gray-400',
    animate: false,
  },
  saving: {
    icon: Loader2,
    label: 'Saving...',
    color: 'text-blue-500',
    animate: true,
  },
  saved: {
    icon: CheckCircle,
    label: 'Saved',
    color: 'text-green-500',
    animate: false,
  },
  error: {
    icon: AlertCircle,
    label: 'Save failed',
    color: 'text-red-500',
    animate: false,
  },
  conflict: {
    icon: AlertCircle,
    label: 'Conflict detected',
    color: 'text-yellow-500',
    animate: false,
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    gap: 'gap-2',
  },
} as const;

export function SaveIndicator({
  status,
  error,
  className,
  showLabel = true,
  size = 'md',
}: SaveIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const displayLabel = status === 'error' && error ? error : config.label;

  return (
    <div
      className={cn(
        'flex items-center',
        sizeConfig.gap,
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon
        className={cn(
          sizeConfig.icon,
          config.animate && 'animate-spin'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn(sizeConfig.text, 'font-medium')}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Inline save indicator (appears next to form fields)
 */
export function InlineSaveIndicator({
  status,
  error,
  className,
}: Omit<SaveIndicatorProps, 'showLabel' | 'size'>) {
  // Only show when actively saving or just saved
  if (status === 'idle') return null;

  return (
    <SaveIndicator
      status={status}
      error={error}
      className={className}
      showLabel={false}
      size="sm"
    />
  );
}

/**
 * Floating save indicator (appears in corner of screen)
 */
export function FloatingSaveIndicator({
  status,
  error,
  position = 'bottom-right',
}: Omit<SaveIndicatorProps, 'showLabel' | 'size' | 'className'> & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  // Only show when actively saving, just saved, or error
  if (status === 'idle') return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2',
        positionClasses[position],
        'transition-all duration-200 ease-in-out',
        status === 'saving' && 'animate-in fade-in slide-in-from-bottom-2',
        status === 'saved' && 'animate-in fade-in slide-in-from-bottom-2'
      )}
    >
      <SaveIndicator
        status={status}
        error={error}
        showLabel={true}
        size="sm"
      />
    </div>
  );
}
