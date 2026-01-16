import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import type { FieldConfidenceStats, LowConfidenceField } from './types/fieldStats';

export interface ConfidenceStatsBarProps {
  /** Confidence statistics */
  stats: FieldConfidenceStats;
  /** Low confidence fields for tooltip detail */
  lowConfidenceFields?: LowConfidenceField[];
  /** Callback when clicking on low confidence indicator */
  onViewLowConfidence?: () => void;
  /** Show detailed tooltip */
  showTooltip?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * ConfidenceStatsBar Component
 *
 * Visual indicator for extraction confidence distribution:
 * - Green (>=90%): High confidence, auto-accepted
 * - Yellow (70-89%): Medium confidence, needs review
 * - Red (<70%): Low confidence, requires verification
 */
export function ConfidenceStatsBar({
  stats,
  lowConfidenceFields = [],
  onViewLowConfidence,
  showTooltip = true,
  size = 'md',
  className = '',
}: ConfidenceStatsBarProps) {
  if (stats.total === 0) {
    return null;
  }

  // Calculate percentages
  const percentages = {
    high: (stats.high / stats.total) * 100,
    medium: (stats.medium / stats.total) * 100,
    low: (stats.low / stats.total) * 100,
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const hasWarnings = stats.low > 0 || stats.medium > 0;

  const barContent = (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Stacked confidence bar */}
      <div className={`w-full flex rounded-full overflow-hidden bg-white/10 ${sizeClasses[size]}`}>
        {percentages.high > 0 && (
          <div
            className="bg-[#30714C] transition-all"
            style={{ width: `${percentages.high}%` }}
          />
        )}
        {percentages.medium > 0 && (
          <div
            className="bg-[#D6A800] transition-all"
            style={{ width: `${percentages.medium}%` }}
          />
        )}
        {percentages.low > 0 && (
          <div
            className="bg-[#C1201C] transition-all"
            style={{ width: `${percentages.low}%` }}
          />
        )}
      </div>

      {/* Legend with counts */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-white/60">
          <span className="flex items-center gap-1">
            <CheckCircle className={`${iconSizes[size]} text-[#30714C]`} />
            <span>{stats.high}</span>
          </span>
          {stats.medium > 0 && (
            <span className="flex items-center gap-1 text-[#D6A800]">
              <AlertCircle className={iconSizes[size]} />
              <span>{stats.medium}</span>
            </span>
          )}
          {stats.low > 0 && (
            <span className="flex items-center gap-1 text-[#C1201C]">
              <XCircle className={iconSizes[size]} />
              <span>{stats.low}</span>
            </span>
          )}
        </div>

        {/* Warning indicator */}
        {hasWarnings && onViewLowConfidence && (
          <button
            onClick={onViewLowConfidence}
            className="text-[#C1201C] hover:text-[#EF4444] font-medium"
          >
            Review
          </button>
        )}
      </div>
    </div>
  );

  if (!showTooltip) {
    return barContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{barContent}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Extraction Confidence</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#30714C]">
                  <CheckCircle className="w-3 h-3" /> High (&gt;=90%)
                </span>
                <span className="text-white/80">{stats.high} fields</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#D6A800]">
                  <AlertCircle className="w-3 h-3" /> Medium (70-89%)
                </span>
                <span className="text-white/80">{stats.medium} fields</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#C1201C]">
                  <XCircle className="w-3 h-3" /> Low (&lt;70%)
                </span>
                <span className="text-white/80">{stats.low} fields</span>
              </div>
            </div>

            {/* Show low confidence field names */}
            {lowConfidenceFields.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-white/60 mb-1">Fields needing review:</p>
                <ul className="space-y-0.5 text-[#C1201C]">
                  {lowConfidenceFields.slice(0, 5).map((field) => (
                    <li key={field.fieldId} className="flex items-center justify-between">
                      <span className="truncate">{field.fieldLabel}</span>
                      <span className="text-white/60">{field.confidence}%</span>
                    </li>
                  ))}
                  {lowConfidenceFields.length > 5 && (
                    <li className="text-white/60 italic">
                      +{lowConfidenceFields.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConfidenceStatsBar;
