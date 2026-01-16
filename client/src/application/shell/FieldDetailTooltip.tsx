import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { SourceBadge, type SourceType } from '@/shared/ui/SourceBadge';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { FileText, Calendar } from 'lucide-react';

export interface FieldDetailTooltipProps {
  /** Field identifier */
  fieldId: string;
  /** Display label for the field */
  fieldLabel: string;
  /** Current value */
  value: unknown;
  /** Data source */
  source: SourceType;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Source document name */
  sourceDocument?: string;
  /** Last modified date */
  lastModified?: Date;
  /** Original AI-extracted value (if edited) */
  originalValue?: unknown;
  /** Children to wrap */
  children: React.ReactNode;
}

/**
 * FieldDetailTooltip Component
 *
 * Rich tooltip showing field provenance information:
 * - Data source with badge
 * - Confidence score with color
 * - Source document reference
 * - Edit history (if applicable)
 */
export function FieldDetailTooltip({
  fieldId,
  fieldLabel,
  value,
  source,
  confidence,
  sourceDocument,
  lastModified,
  originalValue,
  children,
}: FieldDetailTooltipProps) {
  const wasEdited = source === 'proxy_edited' && originalValue !== undefined;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-sm p-0">
          <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{fieldLabel}</p>
                <p className="text-xs text-white/60">{fieldId}</p>
              </div>
              <SourceBadge source={source} size="sm" showTooltip={false} />
            </div>

            {/* Current Value */}
            <div className="bg-white/5 rounded p-2">
              <p className="text-xs text-white/60 mb-1">Current Value</p>
              <p className="text-sm text-white font-mono">
                {value !== undefined && value !== null
                  ? String(value)
                  : <span className="text-white/40 italic">Empty</span>
                }
              </p>
            </div>

            {/* Confidence Score */}
            {confidence !== undefined && source === 'ai_extracted' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">AI Confidence</span>
                <ConfidenceBadge confidence={confidence} size="sm" showTooltip={false} />
              </div>
            )}

            {/* Source Document */}
            {sourceDocument && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <FileText className="w-3 h-3" />
                <span>From: {sourceDocument}</span>
              </div>
            )}

            {/* Edit History */}
            {wasEdited && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60 mb-1">Original AI Value</p>
                <p className="text-sm text-white/40 font-mono line-through">
                  {String(originalValue)}
                </p>
              </div>
            )}

            {/* Last Modified */}
            {lastModified && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Calendar className="w-3 h-3" />
                <span>Modified: {lastModified.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default FieldDetailTooltip;
