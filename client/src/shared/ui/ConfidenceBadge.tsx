import React from 'react';
import { Badge } from './badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceBadgeProps {
  /**
   * Confidence score (0-100)
   */
  confidence: number;
  /**
   * Optional custom label (defaults to percentage)
   */
  label?: string;
  /**
   * Show icon alongside text
   */
  showIcon?: boolean;
  /**
   * Show tooltip with explanation
   */
  showTooltip?: boolean;
  /**
   * Custom tooltip content
   */
  tooltipContent?: string;
  /**
   * Size variant
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

/**
 * Get icon for confidence level
 */
function getConfidenceIcon(level: ConfidenceLevel): React.ReactNode {
  switch (level) {
    case 'high':
      return <CheckCircle className="w-3 h-3" />;
    case 'medium':
      return <AlertCircle className="w-3 h-3" />;
    case 'low':
      return <XCircle className="w-3 h-3" />;
  }
}

/**
 * Get default tooltip explanation
 */
function getDefaultTooltip(level: ConfidenceLevel, score: number): string {
  switch (level) {
    case 'high':
      return `High confidence (${score}%). This field was extracted with high accuracy and can be auto-accepted.`;
    case 'medium':
      return `Medium confidence (${score}%). This field should be reviewed before accepting.`;
    case 'low':
      return `Low confidence (${score}%). This field requires manual verification and correction.`;
  }
}

/**
 * ConfidenceBadge Component
 *
 * Visual indicator for AI extraction confidence scores.
 *
 * Features:
 * - Color-coded by confidence level:
 *   - High (>=90%): green (#F0FDF4 bg, #30714C border/text)
 *   - Medium (70-89%): Wheat Gold (#F5F1E1 bg, #C29F3F border, #735E25 text)
 *   - Low (<70%): red (#FFEDED bg, #C1201C border/text)
 * - Shows percentage value
 * - Optional tooltip with explanation
 * - Consistent styling across application
 *
 * @example
 * ```tsx
 * <ConfidenceBadge confidence={95} />
 * <ConfidenceBadge confidence={75} showTooltip />
 * <ConfidenceBadge confidence={45} label="Low Quality" />
 * ```
 */
export function ConfidenceBadge({
  confidence,
  label,
  showIcon = true,
  showTooltip = true,
  tooltipContent,
  size = 'default',
  className,
}: ConfidenceBadgeProps) {
  // Clamp confidence to 0-100 range
  const clampedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
  const level = getConfidenceLevel(clampedConfidence);
  const icon = getConfidenceIcon(level);

  const badgeContent = (
    <Badge
      variant={`confidence-${level}`}
      size={size}
      className={className}
    >
      <span className="inline-flex items-center gap-1.5">
        {showIcon && icon}
        <span>{label || `${clampedConfidence}%`}</span>
      </span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  const tooltip = tooltipContent || getDefaultTooltip(level, clampedConfidence);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Confidence level indicator without percentage
 */
export interface ConfidenceLevelBadgeProps {
  level: ConfidenceLevel;
  showTooltip?: boolean;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ConfidenceLevelBadge({
  level,
  showTooltip = true,
  size = 'default',
  className,
}: ConfidenceLevelBadgeProps) {
  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence',
  };

  const tooltips = {
    high: 'High confidence extraction. Can be auto-accepted (≥90% accuracy).',
    medium: 'Medium confidence extraction. Should be reviewed before accepting (70-89% accuracy).',
    low: 'Low confidence extraction. Requires manual verification and correction (<70% accuracy).',
  };

  const badgeContent = (
    <Badge
      variant={`confidence-${level}`}
      size={size}
      className={className}
    >
      {labels[level]}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{tooltips[level]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
