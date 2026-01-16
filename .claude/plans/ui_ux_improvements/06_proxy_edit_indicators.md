# Implementation Plan: Proxy-Edit Field Indicators in Progress Panel

**Scope**: Add visual indicators to the Progress Panel showing field data sources (AI-extracted vs proxy-entered vs proxy-edited vs auditor-verified) with confidence scoring and edit counts.

**Services Affected**: client

**Estimated Steps**: 12

---

## Overview

This feature enhances the Progress Panel with visual indicators that display the provenance of field data. Users will see at a glance which fields were AI-extracted, manually entered, edited by analysts, or verified by auditors. Confidence scores will be color-coded (green/yellow/red) to highlight fields needing attention. The implementation leverages existing `SourceBadge`, `ConfidenceBadge`, and `WarningBadges` components while adding new aggregate views for documents and modules.

---

## Prerequisites

- [ ] Existing components available: `SourceBadge.tsx`, `ConfidenceBadge.tsx`, `WarningBadges.tsx`
- [ ] Database types defined: `module_data` table with `source` and `confidence_score` fields
- [ ] API endpoint: `GET /api/modules/:applicationId/:moduleNumber` returns field data with source/confidence

---

## Implementation Steps

### Phase 1: Types and Data Structures

**Step 1.1**: Create field statistics types

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\types\fieldStats.ts`
- Changes: Add new types for tracking field statistics by source and confidence

```typescript
import { SourceType } from '@/shared/ui/SourceBadge';

/**
 * Statistics for fields by data source
 */
export interface FieldSourceStats {
  ai_extracted: number;
  proxy_entered: number;
  proxy_edited: number;
  auditor_verified: number;
  total: number;
}

/**
 * Statistics for fields by confidence level
 */
export interface FieldConfidenceStats {
  high: number;    // >= 90%
  medium: number;  // 70-89%
  low: number;     // < 70%
  total: number;
}

/**
 * Combined field statistics for a document or module
 */
export interface FieldStats {
  source: FieldSourceStats;
  confidence: FieldConfidenceStats;
  lowConfidenceFields: LowConfidenceField[];
  editedFields: EditedField[];
}

/**
 * Individual field with low confidence
 */
export interface LowConfidenceField {
  fieldId: string;
  fieldLabel: string;
  confidence: number;
  source: SourceType;
  sourceDocumentId?: string;
}

/**
 * Individual edited field for audit trail
 */
export interface EditedField {
  fieldId: string;
  fieldLabel: string;
  originalSource: SourceType;
  originalValue: any;
  currentValue: any;
  editedAt: Date;
}

/**
 * Calculate confidence level from score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

/**
 * Calculate field statistics from module data
 */
export function calculateFieldStats(
  fields: Record<string, { source: SourceType; confidence_score?: number; value: any }>
): FieldStats {
  const stats: FieldStats = {
    source: {
      ai_extracted: 0,
      proxy_entered: 0,
      proxy_edited: 0,
      auditor_verified: 0,
      total: 0,
    },
    confidence: {
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    },
    lowConfidenceFields: [],
    editedFields: [],
  };

  Object.entries(fields).forEach(([fieldId, field]) => {
    // Count by source
    stats.source[field.source]++;
    stats.source.total++;

    // Count by confidence (only for AI-extracted fields)
    if (field.confidence_score !== undefined && field.source === 'ai_extracted') {
      const level = getConfidenceLevel(field.confidence_score);
      stats.confidence[level]++;
      stats.confidence.total++;

      // Track low confidence fields
      if (field.confidence_score < 90) {
        stats.lowConfidenceFields.push({
          fieldId,
          fieldLabel: fieldId, // Will be resolved to label in component
          confidence: field.confidence_score,
          source: field.source,
        });
      }
    }

    // Track edited fields
    if (field.source === 'proxy_edited') {
      stats.editedFields.push({
        fieldId,
        fieldLabel: fieldId,
        originalSource: 'ai_extracted', // Assume edited from AI
        originalValue: null, // Would come from audit trail
        currentValue: field.value,
        editedAt: new Date(),
      });
    }
  });

  return stats;
}
```

**Validation**: TypeScript compilation check - `cd client && npx tsc --noEmit`

---

### Phase 2: Source Statistics Badge Component

**Step 2.1**: Create SourceStatsBadge component for aggregate source display

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\SourceStatsBadge.tsx`
- Changes: New component showing source distribution with visual breakdown

```typescript
import React from 'react';
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
```

**Validation**: `cd client && npm run build`

---

### Phase 3: Confidence Statistics Display

**Step 3.1**: Create ConfidenceStatsBar component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ConfidenceStatsBar.tsx`
- Changes: New component showing confidence distribution

```typescript
import React from 'react';
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
                  <CheckCircle className="w-3 h-3" /> High (>=90%)
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
```

**Validation**: `cd client && npm run build`

---

### Phase 4: Hook for Field Statistics

**Step 4.1**: Create useFieldStats hook

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useFieldStats.ts`
- Changes: Hook to fetch and calculate field statistics per document/module

```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FieldStats, FieldSourceStats, FieldConfidenceStats } from './types/fieldStats';
import { calculateFieldStats } from './types/fieldStats';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Field statistics response from API
 */
interface ModuleFieldsResponse {
  module: {
    module_number: number;
    fields: Record<string, {
      field_id: string;
      value: any;
      source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
      confidence_score?: number;
      source_document_id?: string;
    }>;
  };
}

/**
 * Aggregated statistics for entire application
 */
export interface ApplicationFieldStats {
  /** Per-module statistics */
  byModule: Record<number, FieldStats>;
  /** Aggregated source stats */
  totalSource: FieldSourceStats;
  /** Aggregated confidence stats */
  totalConfidence: FieldConfidenceStats;
  /** Total edited count across all modules */
  totalEdited: number;
  /** Total low confidence count */
  totalLowConfidence: number;
}

/**
 * Fetch field data for a single module
 */
async function fetchModuleFields(
  applicationId: string,
  moduleNumber: number
): Promise<ModuleFieldsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/modules/${applicationId}/${moduleNumber}`,
    {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch module ${moduleNumber} fields`);
  }

  return response.json();
}

/**
 * Hook to get field statistics for a single module
 */
export function useModuleFieldStats(
  applicationId: string | undefined,
  moduleNumber: number
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['module-fields', applicationId, moduleNumber],
    queryFn: () => fetchModuleFields(applicationId!, moduleNumber),
    enabled: !!applicationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const stats = useMemo(() => {
    if (!data?.module?.fields) return null;
    return calculateFieldStats(data.module.fields);
  }, [data]);

  return {
    stats,
    isLoading,
    error,
    rawData: data,
  };
}

/**
 * Hook to get aggregated field statistics across all modules
 */
export function useApplicationFieldStats(applicationId: string | undefined) {
  // Fetch all 5 modules in parallel
  const module1 = useModuleFieldStats(applicationId, 1);
  const module2 = useModuleFieldStats(applicationId, 2);
  const module3 = useModuleFieldStats(applicationId, 3);
  const module4 = useModuleFieldStats(applicationId, 4);
  const module5 = useModuleFieldStats(applicationId, 5);

  const isLoading = module1.isLoading || module2.isLoading || module3.isLoading ||
                    module4.isLoading || module5.isLoading;

  const aggregatedStats = useMemo((): ApplicationFieldStats | null => {
    const moduleStats = [module1, module2, module3, module4, module5];

    // Check if we have any data
    if (moduleStats.every(m => !m.stats)) return null;

    const byModule: Record<number, FieldStats> = {};
    const totalSource: FieldSourceStats = {
      ai_extracted: 0,
      proxy_entered: 0,
      proxy_edited: 0,
      auditor_verified: 0,
      total: 0,
    };
    const totalConfidence: FieldConfidenceStats = {
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };

    moduleStats.forEach((module, index) => {
      const moduleNumber = index + 1;
      if (module.stats) {
        byModule[moduleNumber] = module.stats;

        // Aggregate source stats
        totalSource.ai_extracted += module.stats.source.ai_extracted;
        totalSource.proxy_entered += module.stats.source.proxy_entered;
        totalSource.proxy_edited += module.stats.source.proxy_edited;
        totalSource.auditor_verified += module.stats.source.auditor_verified;
        totalSource.total += module.stats.source.total;

        // Aggregate confidence stats
        totalConfidence.high += module.stats.confidence.high;
        totalConfidence.medium += module.stats.confidence.medium;
        totalConfidence.low += module.stats.confidence.low;
        totalConfidence.total += module.stats.confidence.total;
      }
    });

    return {
      byModule,
      totalSource,
      totalConfidence,
      totalEdited: totalSource.proxy_edited,
      totalLowConfidence: totalConfidence.low + totalConfidence.medium,
    };
  }, [module1.stats, module2.stats, module3.stats, module4.stats, module5.stats]);

  return {
    stats: aggregatedStats,
    isLoading,
    moduleStats: {
      1: module1.stats,
      2: module2.stats,
      3: module3.stats,
      4: module4.stats,
      5: module5.stats,
    },
  };
}

export default useApplicationFieldStats;
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 5: Update DocumentProgress Component

**Step 5.1**: Add source/confidence indicators to document slots

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\DocumentProgress.tsx`
- Changes: Integrate field stats badges into document slot display

Add to the existing `DocumentSlot` interface:

```typescript
export interface DocumentSlot {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  errorMessage?: string;
  uploadedAt?: Date;
  processedAt?: Date;
  // NEW: Field statistics
  fieldStats?: {
    source: {
      ai_extracted: number;
      proxy_edited: number;
      total: number;
    };
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
    lowConfidenceCount: number;
    editedCount: number;
  };
}
```

Add to each document slot card (after the status text):

```typescript
{/* Field Statistics Badges - Only show for processed documents */}
{doc.status === 'done' && doc.fieldStats && (
  <div className="mt-2 flex items-center gap-2">
    {/* Edited count badge */}
    {doc.fieldStats.editedCount > 0 && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-xs rounded">
        <Edit className="w-3 h-3" />
        {doc.fieldStats.editedCount}
      </span>
    )}
    {/* Low confidence badge */}
    {doc.fieldStats.lowConfidenceCount > 0 && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FFEDED] border border-[#C1201C] text-[#C1201C] text-xs rounded">
        <AlertTriangle className="w-3 h-3" />
        {doc.fieldStats.lowConfidenceCount}
      </span>
    )}
  </div>
)}
```

**Validation**: `cd client && npm run build`

---

### Phase 6: Update ModuleProgressSection Component

**Step 6.1**: Add source/confidence indicators to module cards

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ModuleProgressSection.tsx`
- Changes: Integrate field statistics into module progress display

Update the `ModuleStatus` interface:

```typescript
export interface ModuleStatus {
  moduleNumber: number;
  moduleName: string;
  shortName: string;
  completionPercentage: number;
  requiredFieldsCompleted: number;
  requiredFieldsTotal: number;
  isComplete: boolean;
  // NEW: Field statistics
  fieldStats?: {
    source: FieldSourceStats;
    confidence: FieldConfidenceStats;
  };
}
```

Add import and use the SourceStatsBadge and ConfidenceStatsBar:

```typescript
import { SourceStatsBadge, EditedCountBadge } from './SourceStatsBadge';
import { ConfidenceStatsBar } from './ConfidenceStatsBar';
```

Add to each module card (after the progress bar):

```typescript
{/* Field Statistics Section */}
{module.fieldStats && module.fieldStats.source.total > 0 && (
  <div className="mt-3 pt-3 border-t border-white/10">
    {/* Source distribution bar */}
    <SourceStatsBadge
      stats={module.fieldStats.source}
      size="sm"
      compact={false}
    />

    {/* Confidence distribution (only if AI extracted fields exist) */}
    {module.fieldStats.confidence.total > 0 && (
      <div className="mt-2">
        <ConfidenceStatsBar
          stats={module.fieldStats.confidence}
          size="sm"
        />
      </div>
    )}
  </div>
)}
```

**Validation**: `cd client && npm run build`

---

### Phase 7: Update ProgressPanel Component

**Step 7.1**: Add aggregated field statistics summary

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ProgressPanel.tsx`
- Changes: Add overall field statistics summary in the panel header

Add imports:

```typescript
import { SourceStatsBadge, EditedCountBadge } from './SourceStatsBadge';
import { ConfidenceStatsBar } from './ConfidenceStatsBar';
import { useApplicationFieldStats } from './useFieldStats';
import type { ApplicationFieldStats } from './useFieldStats';
```

Update props interface:

```typescript
export interface ProgressPanelProps {
  // ... existing props
  /** Application field statistics */
  fieldStats?: ApplicationFieldStats;
}
```

Add new summary section after the overall progress:

```typescript
{/* Field Source & Confidence Summary */}
{fieldStats && fieldStats.totalSource.total > 0 && (
  <div className="bg-[#0D2233] rounded-lg p-4 mt-4">
    <h4 className="text-sm font-semibold text-white mb-3">Data Source Overview</h4>

    {/* Source distribution */}
    <SourceStatsBadge
      stats={fieldStats.totalSource}
      size="md"
      showTooltip
    />

    {/* Confidence distribution */}
    {fieldStats.totalConfidence.total > 0 && (
      <div className="mt-4">
        <h5 className="text-xs text-white/60 mb-2">Extraction Confidence</h5>
        <ConfidenceStatsBar
          stats={fieldStats.totalConfidence}
          size="md"
        />
      </div>
    )}

    {/* Warning counts */}
    {(fieldStats.totalEdited > 0 || fieldStats.totalLowConfidence > 0) && (
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4">
        {fieldStats.totalEdited > 0 && (
          <EditedCountBadge
            count={fieldStats.totalEdited}
            onClick={() => {/* Navigate to edited fields view */}}
          />
        )}
        {fieldStats.totalLowConfidence > 0 && (
          <span className="text-xs text-[#C1201C]">
            {fieldStats.totalLowConfidence} fields need review
          </span>
        )}
      </div>
    )}
  </div>
)}
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 8: Field Details Tooltip Component

**Step 8.1**: Create detailed field tooltip for hover

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\FieldDetailTooltip.tsx`
- Changes: Rich tooltip showing field provenance details

```typescript
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { SourceBadge, SourceType } from '@/shared/ui/SourceBadge';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { FileText, Calendar } from 'lucide-react';

export interface FieldDetailTooltipProps {
  /** Field identifier */
  fieldId: string;
  /** Display label for the field */
  fieldLabel: string;
  /** Current value */
  value: any;
  /** Data source */
  source: SourceType;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Source document name */
  sourceDocument?: string;
  /** Last modified date */
  lastModified?: Date;
  /** Original AI-extracted value (if edited) */
  originalValue?: any;
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
```

**Validation**: `cd client && npm run build`

---

### Phase 9: Warning Summary Integration

**Step 9.1**: Enhance WarningSummary with source/confidence details

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\WarningBadges.tsx`
- Changes: Add edited field and low confidence details to warning summary

Add to `WarningSummaryProps`:

```typescript
export interface WarningSummaryProps {
  totalWarnings: number;
  breakdown?: {
    documents: number;
    modules: number;
    // NEW
    editedFields?: number;
    lowConfidenceFields?: number;
  };
  onViewAll?: () => void;
  // NEW: Callbacks for specific warning types
  onViewEdited?: () => void;
  onViewLowConfidence?: () => void;
}
```

Add new breakdown items in `WarningSummary`:

```typescript
{breakdown && (
  <div className="text-sm text-red-700 mt-1 space-y-0.5">
    {breakdown.documents > 0 && (
      <span>{breakdown.documents} document issues</span>
    )}
    {breakdown.modules > 0 && (
      <span> {breakdown.modules} incomplete modules</span>
    )}
    {/* NEW */}
    {breakdown.editedFields && breakdown.editedFields > 0 && (
      <button
        onClick={onViewEdited}
        className="block text-[#F59E0B] hover:underline"
      >
        {breakdown.editedFields} edited fields for audit
      </button>
    )}
    {breakdown.lowConfidenceFields && breakdown.lowConfidenceFields > 0 && (
      <button
        onClick={onViewLowConfidence}
        className="block text-[#C1201C] hover:underline"
      >
        {breakdown.lowConfidenceFields} low confidence extractions
      </button>
    )}
  </div>
)}
```

**Validation**: `cd client && npm run build`

---

### Phase 10: Export Components

**Step 10.1**: Create barrel export for shell components

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\index.ts`
- Changes: Export all new components

```typescript
// Existing exports
export { default as ProgressPanel } from './ProgressPanel';
export { default as DocumentProgress } from './DocumentProgress';
export { default as ModuleProgressSection } from './ModuleProgressSection';
export { default as OverallProgress } from './OverallProgress';
export * from './WarningBadges';

// NEW: Field statistics components
export { SourceStatsBadge, EditedCountBadge } from './SourceStatsBadge';
export { ConfidenceStatsBar } from './ConfidenceStatsBar';
export { FieldDetailTooltip } from './FieldDetailTooltip';

// NEW: Hooks
export { useApplicationFieldStats, useModuleFieldStats } from './useFieldStats';

// NEW: Types
export type {
  FieldStats,
  FieldSourceStats,
  FieldConfidenceStats,
  LowConfidenceField,
  EditedField,
  ApplicationFieldStats,
} from './types/fieldStats';
export { calculateFieldStats, getConfidenceLevel } from './types/fieldStats';
```

**Validation**: `cd client && npm run build`

---

### Phase 11: Test Components

**Step 11.1**: Create test page for field indicators

- File: `C:\Users\timca\Business\agfin_app\client\src\test\FieldIndicatorsTest.tsx`
- Changes: Interactive test page for new components

```typescript
import React from 'react';
import { SourceStatsBadge, EditedCountBadge } from '@/application/shell/SourceStatsBadge';
import { ConfidenceStatsBar } from '@/application/shell/ConfidenceStatsBar';
import { FieldDetailTooltip } from '@/application/shell/FieldDetailTooltip';
import { SourceBadge } from '@/shared/ui/SourceBadge';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';

const mockSourceStats = {
  ai_extracted: 15,
  proxy_entered: 3,
  proxy_edited: 5,
  auditor_verified: 2,
  total: 25,
};

const mockConfidenceStats = {
  high: 10,
  medium: 3,
  low: 2,
  total: 15,
};

const mockLowConfidenceFields = [
  { fieldId: 'acreage_total', fieldLabel: 'Total Acreage', confidence: 65, source: 'ai_extracted' as const },
  { fieldId: 'revenue_projected', fieldLabel: 'Projected Revenue', confidence: 72, source: 'ai_extracted' as const },
  { fieldId: 'entity_name', fieldLabel: 'Entity Name', confidence: 58, source: 'ai_extracted' as const },
];

export default function FieldIndicatorsTest() {
  return (
    <div className="min-h-screen bg-[#061623] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Field Indicators Test</h1>

        {/* Source Badges */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Source Badges</h2>
          <div className="flex flex-wrap gap-4">
            <SourceBadge source="ai_extracted" />
            <SourceBadge source="proxy_entered" />
            <SourceBadge source="proxy_edited" />
            <SourceBadge source="auditor_verified" />
          </div>
        </section>

        {/* Confidence Badges */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Confidence Badges</h2>
          <div className="flex flex-wrap gap-4">
            <ConfidenceBadge confidence={95} />
            <ConfidenceBadge confidence={82} />
            <ConfidenceBadge confidence={65} />
            <ConfidenceBadge confidence={45} />
          </div>
        </section>

        {/* Source Stats Badge */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Source Statistics Bar</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-white/60 mb-2">Full display</h3>
              <SourceStatsBadge stats={mockSourceStats} size="md" />
            </div>
            <div>
              <h3 className="text-sm text-white/60 mb-2">Compact</h3>
              <SourceStatsBadge stats={mockSourceStats} size="sm" compact />
            </div>
          </div>
        </section>

        {/* Confidence Stats Bar */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Confidence Statistics Bar</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-white/60 mb-2">With low confidence fields</h3>
              <ConfidenceStatsBar
                stats={mockConfidenceStats}
                lowConfidenceFields={mockLowConfidenceFields}
                onViewLowConfidence={() => alert('View low confidence fields')}
              />
            </div>
            <div>
              <h3 className="text-sm text-white/60 mb-2">All high confidence</h3>
              <ConfidenceStatsBar
                stats={{ high: 15, medium: 0, low: 0, total: 15 }}
              />
            </div>
          </div>
        </section>

        {/* Edited Count Badge */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Edited Count Badge</h2>
          <div className="flex gap-4">
            <EditedCountBadge count={3} onClick={() => alert('View edited fields')} />
            <EditedCountBadge count={12} animate />
          </div>
        </section>

        {/* Field Detail Tooltip */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Field Detail Tooltip</h2>
          <p className="text-white/60 mb-4">Hover over the badges below:</p>
          <div className="flex flex-wrap gap-4">
            <FieldDetailTooltip
              fieldId="applicant_name"
              fieldLabel="Applicant Name"
              value="John Smith"
              source="ai_extracted"
              confidence={92}
              sourceDocument="Tax Return 2024.pdf"
            >
              <div className="px-3 py-2 bg-white/10 rounded cursor-pointer hover:bg-white/20">
                AI Extracted Field
              </div>
            </FieldDetailTooltip>

            <FieldDetailTooltip
              fieldId="total_acreage"
              fieldLabel="Total Acreage"
              value={1250}
              source="proxy_edited"
              confidence={72}
              originalValue={1200}
              lastModified={new Date()}
            >
              <div className="px-3 py-2 bg-[#FEF3C7] text-[#92400E] rounded cursor-pointer hover:bg-[#FDE68A]">
                Edited Field
              </div>
            </FieldDetailTooltip>

            <FieldDetailTooltip
              fieldId="entity_type"
              fieldLabel="Entity Type"
              value="LLC"
              source="auditor_verified"
            >
              <div className="px-3 py-2 bg-[#DCFCE7] text-[#166534] rounded cursor-pointer hover:bg-[#BBF7D0]">
                Verified Field
              </div>
            </FieldDetailTooltip>
          </div>
        </section>
      </div>
    </div>
  );
}
```

**Step 11.2**: Add test route

- File: `C:\Users\timca\Business\agfin_app\client\src\App.tsx`
- Changes: Add route for the test page

```typescript
// Add import
import FieldIndicatorsTest from './test/FieldIndicatorsTest';

// Add route in Routes
<Route path="/test/field-indicators" element={<FieldIndicatorsTest />} />
```

**Validation**: `cd client && npm run dev` and navigate to http://localhost:5173/test/field-indicators

---

### Phase 12: Integration Testing

**Step 12.1**: Verify end-to-end integration

- Manual testing steps:
  1. Navigate to test page at `/test/field-indicators`
  2. Verify all badge variations render correctly
  3. Test tooltips appear on hover
  4. Verify color coding matches specification
  5. Test click handlers for interactive badges

**Validation**: Visual inspection and interaction testing

---

## Acceptance Criteria

- [ ] Source badges display correctly for all 4 source types (ai_extracted, proxy_entered, proxy_edited, auditor_verified)
- [ ] Confidence badges show correct colors: Green (>=90%), Yellow (70-89%), Red (<70%)
- [ ] SourceStatsBadge shows stacked bar with accurate percentages
- [ ] ConfidenceStatsBar displays distribution with review button when warnings exist
- [ ] EditedCountBadge shows count and responds to click events
- [ ] FieldDetailTooltip displays complete field provenance on hover
- [ ] Tooltips provide helpful context about what each indicator means
- [ ] All components integrate correctly with dark theme (#061623 background)
- [ ] Components are exported and accessible from barrel file
- [ ] Test page demonstrates all component variations

---

## Final Validation

```bash
# Build all client code
cd client && npm run build

# Type check
cd client && npx tsc --noEmit

# Lint check
cd client && npm run lint

# Start dev server and test
cd client && npm run dev
# Navigate to http://localhost:5173/test/field-indicators
```

---

## Files Created/Modified

| Action | File Path |
|--------|-----------|
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\application\shell\types\fieldStats.ts` |
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\application\shell\SourceStatsBadge.tsx` |
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\application\shell\ConfidenceStatsBar.tsx` |
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\application\shell\useFieldStats.ts` |
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\application\shell\FieldDetailTooltip.tsx` |
| CREATE | `C:\Users\timca\Business\agfin_app\client\src\test\FieldIndicatorsTest.tsx` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\application\shell\DocumentProgress.tsx` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\application\shell\ModuleProgressSection.tsx` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\application\shell\ProgressPanel.tsx` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\application\shell\WarningBadges.tsx` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\application\shell\index.ts` |
| MODIFY | `C:\Users\timca\Business\agfin_app\client\src\App.tsx` |

---

## Notes

1. **Existing Components Reused**: The implementation leverages existing `SourceBadge`, `ConfidenceBadge`, and `Badge` components from `shared/ui/` to maintain consistency.

2. **Dark Theme Compatibility**: All new components use the established Agrellus brand colors and work with the dark background theme (#061623, #0D2233).

3. **Tooltip Pattern**: Uses Radix UI `Tooltip` component consistent with other tooltips in the codebase.

4. **Data Source Tracking**: The `source` field in `module_data` table supports four values that map directly to the visual indicators:
   - `ai_extracted`: Blue indicator
   - `proxy_entered`: Gray indicator
   - `proxy_edited`: Yellow/Amber indicator (highlight for audit)
   - `auditor_verified`: Green indicator

5. **Confidence Thresholds**: Per PRD Section 7.4:
   - High (>=90%): Green, auto-accepted
   - Medium (70-89%): Yellow, needs review
   - Low (<70%): Red, requires verification

6. **Performance Consideration**: The `useApplicationFieldStats` hook fetches all 5 modules in parallel using React Query. Consider adding a dedicated API endpoint if this becomes a performance concern.

7. **Future Enhancement**: Consider adding animated transitions when field statistics update to provide visual feedback when documents are processed or fields are edited.
