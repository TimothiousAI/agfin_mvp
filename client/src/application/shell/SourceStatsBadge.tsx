import { Bot, User, Edit, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import type { FieldSourceStats } from './types/fieldStats';

export interface SourceStatsBadgeProps {
  /** Source statistics */
  stats: FieldSourceStats;
  /** Show detailed breakdown on hover */
  showTooltip?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * SourceStatsBadge Component
 *
 * Shows aggregate field source distribution:
 * - Color-coded segments for each source type
 * - Tooltip with detailed counts
 * - Highlights edited fields
 */
export function SourceStatsBadge({
  stats,
  showTooltip = true,
  compact = false,
  size = 'md',
  className = '',
}: SourceStatsBadgeProps) {
  if (stats.total === 0) {
    return null;
  }

  // Calculate percentages
  const percentages = {
    ai: (stats.ai_extracted / stats.total) * 100,
    manual: (stats.proxy_entered / stats.total) * 100,
    edited: (stats.proxy_edited / stats.total) * 100,
    verified: (stats.auditor_verified / stats.total) * 100,
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const badgeContent = (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Stacked bar showing source distribution */}
      <div className={`w-full flex rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {percentages.ai > 0 && (
          <div
            className="bg-[#3B82F6] transition-all"
            style={{ width: `${percentages.ai}%` }}
            title="AI Extracted"
          />
        )}
        {percentages.manual > 0 && (
          <div
            className="bg-[#6B7280] transition-all"
            style={{ width: `${percentages.manual}%` }}
            title="Proxy Entered"
          />
        )}
        {percentages.edited > 0 && (
          <div
            className="bg-[#F59E0B] transition-all"
            style={{ width: `${percentages.edited}%` }}
            title="Proxy Edited"
          />
        )}
        {percentages.verified > 0 && (
          <div
            className="bg-[#16A34A] transition-all"
            style={{ width: `${percentages.verified}%` }}
            title="Auditor Verified"
          />
        )}
      </div>

      {/* Compact legend with counts */}
      {!compact && (
        <div className="flex items-center gap-3 text-xs text-white/60">
          {stats.ai_extracted > 0 && (
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3 text-[#3B82F6]" />
              {stats.ai_extracted}
            </span>
          )}
          {stats.proxy_entered > 0 && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#6B7280]" />
              {stats.proxy_entered}
            </span>
          )}
          {stats.proxy_edited > 0 && (
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <Edit className="w-3 h-3" />
              {stats.proxy_edited}
            </span>
          )}
          {stats.auditor_verified > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-[#16A34A]" />
              {stats.auditor_verified}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{badgeContent}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Field Sources</p>
            <div className="space-y-1">
              {stats.ai_extracted > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[#3B82F6]">
                    <Bot className="w-3 h-3" /> AI Extracted
                  </span>
                  <span className="text-white/80">{stats.ai_extracted}</span>
                </div>
              )}
              {stats.proxy_entered > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[#6B7280]">
                    <User className="w-3 h-3" /> Proxy Entered
                  </span>
                  <span className="text-white/80">{stats.proxy_entered}</span>
                </div>
              )}
              {stats.proxy_edited > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[#F59E0B]">
                    <Edit className="w-3 h-3" /> Proxy Edited
                  </span>
                  <span className="text-white/80">{stats.proxy_edited}</span>
                </div>
              )}
              {stats.auditor_verified > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[#16A34A]">
                    <CheckCircle className="w-3 h-3" /> Auditor Verified
                  </span>
                  <span className="text-white/80">{stats.auditor_verified}</span>
                </div>
              )}
            </div>
            <div className="pt-1 border-t border-white/10 text-white/60">
              Total: {stats.total} fields
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact edited count badge
 */
export interface EditedCountBadgeProps {
  count: number;
  onClick?: () => void;
  animate?: boolean;
}

export function EditedCountBadge({
  count,
  onClick,
  animate = false,
}: EditedCountBadgeProps) {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5
              bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E]
              text-xs font-medium rounded-full
              hover:bg-[#FDE68A] transition-colors
              ${animate ? 'animate-pulse' : ''}
            `}
          >
            <Edit className="w-3 h-3" />
            <span>{count}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {count} field{count !== 1 ? 's' : ''} edited by analyst
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SourceStatsBadge;
