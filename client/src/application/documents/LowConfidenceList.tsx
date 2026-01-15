import React, { useState, useMemo } from 'react';

/**
 * Field with confidence metadata
 */
export interface ConfidenceField {
  id: string;
  fieldName: string;
  fieldPath: string;
  value: any;
  confidence: number;
  targetModule: string;
  targetField: string;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  required?: boolean;
  reviewed?: boolean;
}

/**
 * Sort option for fields
 */
export type SortOption = 'confidence_asc' | 'confidence_desc' | 'module' | 'required_first';

export interface LowConfidenceListProps {
  /** All extracted fields */
  fields: ConfidenceField[];
  /** Confidence threshold (default: 0.90) */
  threshold?: number;
  /** Show already reviewed fields */
  showReviewed?: boolean;
  /** Callback when field is clicked for navigation */
  onNavigateToField?: (field: ConfidenceField) => void;
  /** Callback when field is marked as reviewed */
  onMarkReviewed?: (field: ConfidenceField) => void;
  /** Callback when field is edited */
  onEditField?: (field: ConfidenceField) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * LowConfidenceList Component
 *
 * Displays fields below confidence threshold, sorted by confidence level,
 * with quick navigation and review tracking.
 */
export default function LowConfidenceList({
  fields,
  threshold = 0.90,
  showReviewed = false,
  onNavigateToField,
  onMarkReviewed,
  onEditField,
  loading = false,
}: LowConfidenceListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('confidence_asc');
  const [filterRequired, setFilterRequired] = useState(false);

  // Filter fields below threshold
  const lowConfidenceFields = useMemo(() => {
    let filtered = fields.filter(f => f.confidence < threshold);

    // Filter out reviewed if needed
    if (!showReviewed) {
      filtered = filtered.filter(f => !f.reviewed);
    }

    // Filter required only if enabled
    if (filterRequired) {
      filtered = filtered.filter(f => f.required);
    }

    // Sort fields
    const sorted = [...filtered];
    switch (sortBy) {
      case 'confidence_asc':
        sorted.sort((a, b) => a.confidence - b.confidence);
        break;
      case 'confidence_desc':
        sorted.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'module':
        sorted.sort((a, b) => a.targetModule.localeCompare(b.targetModule));
        break;
      case 'required_first':
        sorted.sort((a, b) => {
          if (a.required && !b.required) return -1;
          if (!a.required && b.required) return 1;
          return a.confidence - b.confidence;
        });
        break;
    }

    return sorted;
  }, [fields, threshold, showReviewed, filterRequired, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = lowConfidenceFields.length;
    const requiredCount = lowConfidenceFields.filter(f => f.required).length;
    const reviewedCount = lowConfidenceFields.filter(f => f.reviewed).length;
    const avgConfidence = total > 0
      ? lowConfidenceFields.reduce((sum, f) => sum + f.confidence, 0) / total
      : 0;

    return {
      total,
      requiredCount,
      reviewedCount,
      avgConfidence,
    };
  }, [lowConfidenceFields]);

  const handleNavigate = (field: ConfidenceField) => {
    if (onNavigateToField) {
      onNavigateToField(field);
    }
  };

  const handleMarkReviewed = (field: ConfidenceField) => {
    if (onMarkReviewed) {
      onMarkReviewed(field);
    }
  };

  const handleEdit = (field: ConfidenceField) => {
    if (onEditField) {
      onEditField(field);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return 'text-yellow-600';
    if (confidence >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 0.7) return 'bg-yellow-50 border-yellow-200';
    if (confidence >= 0.5) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value);
    const str = String(value);
    return str.length > 50 ? str.substring(0, 47) + '...' : str;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading low confidence fields...</p>
      </div>
    );
  }

  return (
    <div className="low-confidence-list">
      {/* Header with stats and controls */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Low Confidence Fields
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Below {Math.round(threshold * 100)}% confidence threshold
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">fields need review</div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-600">
              Required: <strong>{stats.requiredCount}</strong>
            </span>
          </div>

          {showReviewed && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">
                Reviewed: <strong>{stats.reviewedCount}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-600">
              Avg Confidence: <strong>{Math.round(stats.avgConfidence * 100)}%</strong>
            </span>
          </div>
        </div>

        {/* Filters and sort */}
        <div className="flex items-center gap-3 pt-3 border-t">
          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="confidence_asc">Confidence (Low to High)</option>
              <option value="confidence_desc">Confidence (High to Low)</option>
              <option value="module">Module</option>
              <option value="required_first">Required First</option>
            </select>
          </div>

          {/* Filter required */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterRequired}
              onChange={(e) => setFilterRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Required only</span>
          </label>
        </div>
      </div>

      {/* Field list */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {lowConfidenceFields.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">All fields look good!</p>
            <p className="text-sm text-gray-500">
              {filterRequired
                ? 'No required fields below threshold'
                : showReviewed
                ? 'All low confidence fields have been reviewed'
                : 'No unreviewed fields below confidence threshold'}
            </p>
          </div>
        ) : (
          lowConfidenceFields.map((field) => (
            <div
              key={field.id}
              className={`p-4 border-l-4 ${getConfidenceBgColor(field.confidence)} ${
                field.reviewed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Confidence indicator */}
                <div className="flex-shrink-0 text-center">
                  <div className={`text-3xl font-bold ${getConfidenceColor(field.confidence)}`}>
                    {Math.round(field.confidence * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">confidence</div>
                </div>

                {/* Field details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {field.fieldName}
                        {field.required && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                            Required
                          </span>
                        )}
                        {field.reviewed && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Reviewed
                          </span>
                        )}
                      </h4>

                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{field.targetModule}</span>
                        {' → '}
                        <code className="bg-gray-100 px-1 rounded text-xs">{field.targetField}</code>
                      </div>

                      <div className="text-sm text-gray-700 bg-white px-3 py-2 rounded border">
                        <strong>Value:</strong> {formatValue(field.value)}
                      </div>

                      {field.sourceDocumentName && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Source: {field.sourceDocumentName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleNavigate(field)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Field
                    </button>

                    <button
                      onClick={() => handleEdit(field)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Value
                    </button>

                    {!field.reviewed && (
                      <button
                        onClick={() => handleMarkReviewed(field)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
