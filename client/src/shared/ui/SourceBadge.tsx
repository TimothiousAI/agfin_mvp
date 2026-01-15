import React from 'react';
import { Badge } from './badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Bot, User, Edit, CheckCircle } from 'lucide-react';

export type SourceType = 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';

export interface SourceBadgeProps {
  /**
   * Source type
   */
  source: SourceType;
  /**
   * Optional custom label (defaults to formatted source name)
   */
  label?: string;
  /**
   * Show tooltip with explanation
   */
  showTooltip?: boolean;
  /**
   * Show icon
   */
  showIcon?: boolean;
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
 * Get source configuration
 */
function getSourceConfig(source: SourceType): {
  variant: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
} {
  switch (source) {
    case 'ai_extracted':
      return {
        variant: 'ai',
        label: 'AI Extracted',
        icon: <Bot className="w-3 h-3" />,
        tooltip: 'This field was extracted by AI from document OCR and may require verification.',
      };
    case 'proxy_entered':
      return {
        variant: 'manual',
        label: 'Proxy Entered',
        icon: <User className="w-3 h-3" />,
        tooltip: 'This field was manually entered by a proxy user on behalf of the applicant.',
      };
    case 'proxy_edited':
      return {
        variant: 'modified',
        label: 'Proxy Edited',
        icon: <Edit className="w-3 h-3" />,
        tooltip: 'This field was modified by a proxy user after initial entry.',
      };
    case 'auditor_verified':
      return {
        variant: 'verified',
        label: 'Auditor Verified',
        icon: <CheckCircle className="w-3 h-3" />,
        tooltip: 'This field has been verified and approved by an auditor.',
      };
  }
}

/**
 * SourceBadge Component
 *
 * Visual indicator for data source/origin tracking.
 *
 * Features:
 * - Color-coded by source type:
 *   - AI Extracted: blue (#EFF6FF bg, #3B82F6 border, #1E40AF text)
 *   - Proxy Entered: gray (#F3F4F6 bg, #6B7280 border, #374151 text)
 *   - Proxy Edited: yellow (#FEF3C7 bg, #F59E0B border, #92400E text)
 *   - Auditor Verified: green (#DCFCE7 bg, #16A34A border, #166534 text)
 * - Optional icon display
 * - Tooltip with explanation
 * - Consistent styling across application
 *
 * @example
 * ```tsx
 * <SourceBadge source="ai_extracted" />
 * <SourceBadge source="proxy_entered" showIcon />
 * <SourceBadge source="auditor_verified" label="Verified" />
 * ```
 */
export function SourceBadge({
  source,
  label,
  showTooltip = true,
  showIcon = true,
  tooltipContent,
  size = 'default',
  className,
}: SourceBadgeProps) {
  const config = getSourceConfig(source);

  const badgeContent = (
    <Badge
      variant={config.variant as any}
      size={size}
      className={className}
    >
      <span className="inline-flex items-center gap-1.5">
        {showIcon && config.icon}
        <span>{label || config.label}</span>
      </span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  const tooltip = tooltipContent || config.tooltip;

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
 * Compact source icon (icon only, no label)
 */
export interface SourceIconProps {
  source: SourceType;
  showTooltip?: boolean;
  className?: string;
}

export function SourceIcon({
  source,
  showTooltip = true,
  className,
}: SourceIconProps) {
  const config = getSourceConfig(source);

  // Get color based on source type
  const colorClass = {
    ai_extracted: 'text-[#3B82F6]',
    proxy_entered: 'text-[#6B7280]',
    proxy_edited: 'text-[#F59E0B]',
    auditor_verified: 'text-[#16A34A]',
  }[source];

  const iconElement = (
    <span className={`inline-flex ${colorClass} ${className || ''}`}>
      {config.icon}
    </span>
  );

  if (!showTooltip) {
    return iconElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconElement}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
