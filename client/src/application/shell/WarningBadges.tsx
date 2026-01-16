import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Warning badge props
 */
export interface WarningBadgeProps {
  /** Number of warnings/low confidence fields */
  count: number;
  /** Tooltip text (defaults to "{count} field(s) need attention") */
  tooltip?: string;
  /** Click handler for badge */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show pulse animation (for new warnings) */
  animate?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Warning Badge Component
 *
 * Displays attention indicator for low confidence fields:
 * - Badge count showing number of issues
 * - Tooltip on hover
 * - Click to navigate/show details
 * - Animation for new warnings
 */
export function WarningBadge({
  count,
  tooltip,
  onClick,
  size = 'md',
  animate = false,
  className = '',
}: WarningBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't render if count is 0
  if (count === 0) {
    return null;
  }

  const defaultTooltip = `${count} field${count !== 1 ? 's' : ''} need attention`;

  // Size classes
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  return (
    <div className="relative inline-block">
      {/* Badge */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          bg-red-500 text-white font-bold rounded-full
          hover:bg-red-600 transition-colors
          cursor-pointer
          ${className}
        `}
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: [0, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={tooltip || defaultTooltip}
      >
        {count > 9 ? '9+' : count}

        {/* Pulse animation for new warnings */}
        {animate && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-400"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1, repeat: 2 }}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none"
          >
            {tooltip || defaultTooltip}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Document Warning Badge Props
 */
export interface DocumentWarningBadgeProps {
  /** Number of low confidence fields in document */
  lowConfidenceCount: number;
  /** Document ID or name for click handling */
  documentId: string;
  /** Click handler */
  onViewDetails?: (documentId: string) => void;
  /** Show animation */
  animate?: boolean;
}

/**
 * Document Warning Badge
 *
 * Specialized badge for documents with low confidence fields
 */
export function DocumentWarningBadge({
  lowConfidenceCount,
  documentId,
  onViewDetails,
  animate = false,
}: DocumentWarningBadgeProps) {
  return (
    <WarningBadge
      count={lowConfidenceCount}
      tooltip={`${lowConfidenceCount} low confidence field${lowConfidenceCount !== 1 ? 's' : ''}`}
      onClick={() => onViewDetails?.(documentId)}
      animate={animate}
      size="md"
    />
  );
}

/**
 * Module Warning Badge Props
 */
export interface ModuleWarningBadgeProps {
  /** Number of flagged fields in module */
  flaggedFieldCount: number;
  /** Module number (1-5) */
  moduleNumber: number;
  /** Click handler */
  onViewDetails?: (moduleNumber: number) => void;
  /** Show animation */
  animate?: boolean;
}

/**
 * Module Warning Badge
 *
 * Specialized badge for modules with flagged fields
 */
export function ModuleWarningBadge({
  flaggedFieldCount,
  moduleNumber,
  onViewDetails,
  animate = false,
}: ModuleWarningBadgeProps) {
  return (
    <WarningBadge
      count={flaggedFieldCount}
      tooltip={`Module ${moduleNumber}: ${flaggedFieldCount} flagged field${flaggedFieldCount !== 1 ? 's' : ''}`}
      onClick={() => onViewDetails?.(moduleNumber)}
      animate={animate}
      size="md"
    />
  );
}

/**
 * Inline Warning Indicator Props
 */
export interface InlineWarningIndicatorProps {
  /** Field name */
  fieldName: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Click handler to show field details */
  onShowDetails?: () => void;
}

/**
 * Inline Warning Indicator
 *
 * Small warning icon next to low confidence fields
 */
export function InlineWarningIndicator({
  fieldName,
  confidence,
  onShowDetails,
}: InlineWarningIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const confidencePercentage = Math.round(confidence * 100);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={onShowDetails}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-accent-500 hover:text-accent-600 transition-colors ml-1"
        aria-label={`Low confidence warning for ${fieldName}`}
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none"
          >
            <div className="font-semibold mb-1">{fieldName}</div>
            <div className="text-accent-400">
              Confidence: {confidencePercentage}%
            </div>
            <div className="text-gray-300 mt-1">Click to review</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Warning Summary Props
 */
export interface WarningSummaryProps {
  /** Total warning count across all items */
  totalWarnings: number;
  /** Breakdown by category */
  breakdown?: {
    documents: number;
    modules: number;
    /** Count of edited fields for audit */
    editedFields?: number;
    /** Count of low confidence fields */
    lowConfidenceFields?: number;
  };
  /** Click handler to see all warnings */
  onViewAll?: () => void;
  /** Callback to view edited fields */
  onViewEdited?: () => void;
  /** Callback to view low confidence fields */
  onViewLowConfidence?: () => void;
}

/**
 * Warning Summary Component
 *
 * Shows aggregate warning count with breakdown
 */
export function WarningSummary({
  totalWarnings,
  breakdown,
  onViewAll,
  onViewEdited,
  onViewLowConfidence,
}: WarningSummaryProps) {
  if (totalWarnings === 0) {
    return null;
  }

  return (
    <motion.button
      onClick={onViewAll}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-red-50 border-2 border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
            {totalWarnings > 99 ? '99+' : totalWarnings}
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="font-semibold text-red-900">
            {totalWarnings} Field{totalWarnings !== 1 ? 's' : ''} Need Attention
          </div>
          {breakdown && (
            <div className="text-sm text-red-700 mt-1 space-y-0.5">
              <span>
                {breakdown.documents > 0 && `${breakdown.documents} in documents`}
                {breakdown.documents > 0 && breakdown.modules > 0 && ' • '}
                {breakdown.modules > 0 && `${breakdown.modules} in modules`}
              </span>
              {breakdown.editedFields && breakdown.editedFields > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEdited?.();
                  }}
                  className="block text-[#F59E0B] hover:underline"
                >
                  {breakdown.editedFields} edited fields for audit
                </button>
              )}
              {breakdown.lowConfidenceFields && breakdown.lowConfidenceFields > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLowConfidence?.();
                  }}
                  className="block text-[#C1201C] hover:underline"
                >
                  {breakdown.lowConfidenceFields} low confidence extractions
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
      </div>
    </motion.button>
  );
}

export default WarningBadge;
