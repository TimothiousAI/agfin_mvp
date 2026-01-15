import { ReactNode, forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface TouchTargetProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Content of the touch target */
  children: ReactNode;
  /** Size variant: 'default' (44x44px) or 'large' (56x56px) */
  size?: 'default' | 'large';
  /** Visual feedback style */
  feedback?: 'scale' | 'opacity' | 'background' | 'none';
  /** Additional spacing around target */
  spacing?: 'tight' | 'normal' | 'loose';
  /** Custom minimum size (overrides size prop) */
  minSize?: number;
}

/**
 * TouchTarget Component
 *
 * Ensures accessible touch targets following WCAG 2.1 guidelines:
 * - Minimum 44x44px touch area (Level AAA)
 * - Adequate spacing between targets
 * - Visual feedback on touch
 * - Prevents accidental taps
 *
 * Features:
 * - Enforces minimum touch target size
 * - Multiple size variants (44px, 56px)
 * - Visual feedback styles (scale, opacity, background)
 * - Configurable spacing
 * - Fully accessible (ARIA support)
 * - Works with any button content
 *
 * @example
 * ```tsx
 * // Default 44x44px touch target
 * <TouchTarget onClick={() => console.log('Tapped')}>
 *   <Icon />
 * </TouchTarget>
 *
 * // Large 56x56px touch target (for primary actions)
 * <TouchTarget size="large" feedback="scale">
 *   <PlusIcon />
 * </TouchTarget>
 *
 * // Custom styling with loose spacing
 * <TouchTarget spacing="loose" className="bg-primary">
 *   Save
 * </TouchTarget>
 * ```
 */
export const TouchTarget = forwardRef<HTMLButtonElement, TouchTargetProps>(
  (
    {
      children,
      size = 'default',
      feedback = 'scale',
      spacing = 'normal',
      minSize,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Size mappings
    const sizeClasses = {
      default: 'min-w-[44px] min-h-[44px]',
      large: 'min-w-[56px] min-h-[56px]',
    };

    // Spacing mappings (margin around target)
    const spacingClasses = {
      tight: 'm-1',
      normal: 'm-2',
      loose: 'm-3',
    };

    // Visual feedback mappings
    const feedbackClasses = {
      scale: 'active:scale-95 transition-transform',
      opacity: 'active:opacity-70 transition-opacity',
      background: 'active:bg-black/10 transition-colors',
      none: '',
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'rounded-lg',
          'touch-manipulation', // Prevents 300ms delay on touch
          'select-none', // Prevents text selection on long press
          'outline-none focus-visible:ring-2 focus-visible:ring-[#30714C] focus-visible:ring-offset-2',

          // Size
          minSize ? `min-w-[${minSize}px] min-h-[${minSize}px]` : sizeClasses[size],

          // Spacing
          spacingClasses[spacing],

          // Feedback
          feedbackClasses[feedback],

          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',

          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchTarget.displayName = 'TouchTarget';

/**
 * TouchTargetLink Component
 *
 * Same as TouchTarget but renders as an anchor element
 */
interface TouchTargetLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  size?: 'default' | 'large';
  feedback?: 'scale' | 'opacity' | 'background' | 'none';
  spacing?: 'tight' | 'normal' | 'loose';
  minSize?: number;
}

export const TouchTargetLink = forwardRef<HTMLAnchorElement, TouchTargetLinkProps>(
  (
    {
      children,
      size = 'default',
      feedback = 'scale',
      spacing = 'normal',
      minSize,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      default: 'min-w-[44px] min-h-[44px]',
      large: 'min-w-[56px] min-h-[56px]',
    };

    const spacingClasses = {
      tight: 'm-1',
      normal: 'm-2',
      loose: 'm-3',
    };

    const feedbackClasses = {
      scale: 'active:scale-95 transition-transform',
      opacity: 'active:opacity-70 transition-opacity',
      background: 'active:bg-black/10 transition-colors',
      none: '',
    };

    return (
      <a
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-lg',
          'touch-manipulation',
          'select-none',
          'outline-none focus-visible:ring-2 focus-visible:ring-[#30714C] focus-visible:ring-offset-2',
          minSize ? `min-w-[${minSize}px] min-h-[${minSize}px]` : sizeClasses[size],
          spacingClasses[spacing],
          feedbackClasses[feedback],
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

TouchTargetLink.displayName = 'TouchTargetLink';

/**
 * Utility function to check if an element meets touch target requirements
 * Useful for testing and validation
 */
export function validateTouchTarget(element: HTMLElement): {
  valid: boolean;
  width: number;
  height: number;
  issues: string[];
} {
  const rect = element.getBoundingClientRect();
  const issues: string[] = [];

  const minSize = 44;

  if (rect.width < minSize) {
    issues.push(`Width ${rect.width}px is below minimum ${minSize}px`);
  }

  if (rect.height < minSize) {
    issues.push(`Height ${rect.height}px is below minimum ${minSize}px`);
  }

  // Check spacing (minimum 8px between targets recommended)
  const style = window.getComputedStyle(element);
  const margin = parseInt(style.marginTop) + parseInt(style.marginBottom);
  if (margin < 8) {
    issues.push(`Insufficient spacing (${margin}px) between targets (recommended: 8px+)`);
  }

  return {
    valid: issues.length === 0,
    width: rect.width,
    height: rect.height,
    issues,
  };
}
