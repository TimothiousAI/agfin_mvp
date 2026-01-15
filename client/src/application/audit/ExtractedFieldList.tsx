import React, { useMemo, useState } from 'react';
import { CheckCircle, Edit3, AlertCircle, FileText } from 'lucide-react';

/**
 * Extracted field for audit review
 */
export interface AuditField {
  id: string;
  fieldName: string;
  fieldPath: string;
  value: any;
  confidence: number;
  status: 'pending' | 'reviewed' | 'edited';
  targetModule: string;
  targetField: string;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  required?: boolean;
  location?: {
    pageNumber: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  };
}

/**
 * Props for ExtractedFieldList component
 */
export interface ExtractedFieldListProps {
  /** All extracted fields to display */
  fields: AuditField[];
  /** Highlighted field ID (from clicking on document) */
  highlightedFieldId?: string;
  /** Callback when field is clicked */
  onFieldClick?: (field: AuditField) => void;
  /** Callback when edit button is clicked */
  onEditField?: (field: AuditField) => void;
  /** Callback when confirm button is clicked (for low confidence fields) */
  onConfirmField?: (field: AuditField) => void;
  /** Loading state */
  loading?: boolean;
  /** Confidence threshold for low confidence warning */
  confidenceThreshold?: number;
}

/**
 * ExtractedFieldList Component
 *
 * Displays all extracted fields in audit mode with:
 * - Confidence badges
 * - Current value display
 * - Edit button for corrections
 * - Confirm button for low confidence fields
 * - Status indicators (reviewed/pending/edited)
 * - Click to navigate to field location in PDF
 */
export default function ExtractedFieldList({
  fields,
  highlightedFieldId,
  onFieldClick,
  onEditField,
  onConfirmField,
  loading = false,
  confidenceThreshold = 0.90,
}: ExtractedFieldListProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'edited'>('all');
  const [filterLowConfidence, setFilterLowConfidence] = useState(false);

  // Filter and group fields
  const filteredFields = useMemo(() => {
    let filtered = [...fields];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

    // Filter by low confidence
    if (filterLowConfidence) {
      filtered = filtered.filter(f => f.confidence < confidenceThreshold);
    }

    return filtered;
  }, [fields, filterStatus, filterLowConfidence, confidenceThreshold]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = fields.length;
    const pending = fields.filter(f => f.status === 'pending').length;
    const reviewed = fields.filter(f => f.status === 'reviewed').length;
    const edited = fields.filter(f => f.status === 'edited').length;
    const lowConfidence = fields.filter(f => f.confidence < confidenceThreshold).length;
    const avgConfidence = fields.length > 0
      ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
      : 0;

    return { total, pending, reviewed, edited, lowConfidence, avgConfidence };
  }, [fields, confidenceThreshold]);

  const handleFieldClick = (field: AuditField) => {
    onFieldClick?.(field);
  };

  const handleEdit = (field: AuditField) => {
    onEditField?.(field);
  };

  const handleConfirm = (field: AuditField) => {
    onConfirmField?.(field);
  };

  /**
   * Get confidence badge color
   */
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.95) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'High',
        icon: <CheckCircle className="w-3 h-3" />,
      };
    } else if (confidence >= confidenceThreshold) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Good',
        icon: <CheckCircle className="w-3 h-3" />,
      };
    } else if (confidence >= 0.7) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Medium',
        icon: <AlertCircle className="w-3 h-3" />,
      };
    } else {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Low',
        icon: <AlertCircle className="w-3 h-3" />,
      };
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: 'pending' | 'reviewed' | 'edited') => {
    switch (status) {
      case 'reviewed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Reviewed',
        };
      case 'edited':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          label: 'Edited',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          label: 'Pending',
        };
    }
  };

  /**
   * Format field value for display
   */
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} items]`;
      return JSON.stringify(value);
    }
    const str = String(value);
    return str.length > 100 ? str.substring(0, 97) + '...' : str;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0D2233]">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
          <p>Loading extracted fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D2233]">
      {/* Header with stats */}
      <div className="flex-shrink-0 bg-[#061623] border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Extracted Fields ({filteredFields.length})
        </h2>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 text-xs mb-1">Pending Review</div>
            <div className="text-white text-lg font-semibold">{stats.pending}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 text-xs mb-1">Low Confidence</div>
            <div className="text-white text-lg font-semibold">{stats.lowConfidence}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 text-xs mb-1">Reviewed</div>
            <div className="text-white text-lg font-semibold">{stats.reviewed}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 text-xs mb-1">Avg Confidence</div>
            <div className="text-white text-lg font-semibold">
              {Math.round(stats.avgConfidence * 100)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2 py-1.5 text-sm bg-white/10 text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-[#30714C]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Only</option>
            <option value="reviewed">Reviewed Only</option>
            <option value="edited">Edited Only</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowConfidence}
              onChange={(e) => setFilterLowConfidence(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#30714C] focus:ring-[#30714C]"
            />
            <span>Low confidence only</span>
          </label>
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto">
        {filteredFields.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No fields to display</p>
            <p className="text-sm mt-1">
              {filterLowConfidence
                ? 'All fields have good confidence scores'
                : 'Try adjusting filters to see more fields'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredFields.map((field) => {
              const confidenceBadge = getConfidenceBadge(field.confidence);
              const statusBadge = getStatusBadge(field.status);
              const isHighlighted = field.id === highlightedFieldId;
              const needsConfirmation = field.confidence < confidenceThreshold && field.status === 'pending';

              return (
                <div
                  key={field.id}
                  className={`p-4 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-[#30714C]/20 border-l-4 border-[#30714C]'
                      : 'hover:bg-white/5 border-l-4 border-transparent'
                  }`}
                  onClick={() => handleFieldClick(field)}
                >
                  {/* Field header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1 truncate">
                        {field.fieldName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{field.targetModule}</span>
                        <span>→</span>
                        <code className="bg-white/10 px-1.5 py-0.5 rounded">
                          {field.targetField}
                        </code>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${confidenceBadge.bg} ${confidenceBadge.text}`}
                      >
                        {confidenceBadge.icon}
                        {Math.round(field.confidence * 100)}%
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Field value */}
                  <div className="bg-white/5 rounded p-3 mb-3 border border-white/10">
                    <div className="text-white/60 text-xs mb-1">Current Value:</div>
                    <div className="text-white text-sm break-words">
                      {formatValue(field.value)}
                    </div>
                  </div>

                  {/* Source document */}
                  {field.sourceDocumentName && (
                    <div className="flex items-center gap-1 mb-3 text-xs text-white/60">
                      <FileText className="w-3 h-3" />
                      <span>From: {field.sourceDocumentName}</span>
                      {field.location && (
                        <span className="ml-2">• Page {field.location.pageNumber}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(field);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 text-white hover:bg-white/20 rounded border border-white/20 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>

                    {needsConfirmation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(field);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#30714C] text-white hover:bg-[#30714C]/80 rounded transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Value
                      </button>
                    )}
                  </div>

                  {/* Warning for low confidence */}
                  {needsConfirmation && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Review Required:</strong> This field has low confidence and needs
                        verification. Please confirm the value is correct or edit it.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
