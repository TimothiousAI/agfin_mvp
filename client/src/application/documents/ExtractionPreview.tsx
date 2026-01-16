import { useState, useMemo } from 'react';

/**
 * Extracted field with metadata
 */
export interface ExtractedField {
  fieldName: string;
  fieldPath: string; // dot notation path (e.g., "address.street")
  value: any;
  confidence: number;
  targetModule: string; // e.g., "M1: Identity & Organization"
  targetField: string; // e.g., "m1_applicant_full_name"
  required?: boolean;
  transform?: string; // e.g., "date", "currency"
}

/**
 * Confidence level badge colors
 */
const CONFIDENCE_LEVELS = {
  high: { threshold: 0.9, color: 'bg-green-100 text-green-800', label: 'High' },
  medium: { threshold: 0.7, color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  low: { threshold: 0, color: 'bg-red-100 text-red-800', label: 'Low' },
};

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_LEVELS.high.threshold) return 'high';
  if (score >= CONFIDENCE_LEVELS.medium.threshold) return 'medium';
  return 'low';
}

export interface ExtractionPreviewProps {
  /** Document ID */
  documentId: string;
  /** Document type (e.g., "drivers_license") */
  documentType: string;
  /** Extracted fields with metadata */
  fields: ExtractedField[];
  /** Overall extraction confidence */
  overallConfidence?: number;
  /** Callback when field is accepted */
  onAcceptField?: (field: ExtractedField) => void;
  /** Callback when field is rejected */
  onRejectField?: (field: ExtractedField) => void;
  /** Callback when field is edited */
  onEditField?: (field: ExtractedField, newValue: any) => void;
  /** Callback for bulk accept */
  onBulkAccept?: (fields: ExtractedField[]) => void;
  /** Callback for bulk reject */
  onBulkReject?: (fields: ExtractedField[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Show accept/reject actions */
  showActions?: boolean;
}

/**
 * ExtractionPreview Component
 *
 * Displays extracted document fields with confidence scores,
 * target module mapping, and accept/reject controls.
 */
export default function ExtractionPreview({
  documentId: _documentId,
  documentType: _documentType,
  fields,
  overallConfidence,
  onAcceptField,
  onRejectField,
  onEditField,
  onBulkAccept,
  onBulkReject,
  loading = false,
  showActions = true,
}: ExtractionPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Group fields by module
  const fieldsByModule = useMemo(() => {
    const grouped = new Map<string, ExtractedField[]>();

    fields.forEach(field => {
      const module = field.targetModule;
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(field);
    });

    return grouped;
  }, [fields]);

  // Count fields by confidence level
  const confidenceStats = useMemo(() => {
    const stats = { high: 0, medium: 0, low: 0 };
    fields.forEach(field => {
      const level = getConfidenceLevel(field.confidence);
      stats[level]++;
    });
    return stats;
  }, [fields]);

  // Get high-confidence fields for bulk accept
  const highConfidenceFields = useMemo(() => {
    return fields.filter(f => f.confidence >= CONFIDENCE_LEVELS.high.threshold);
  }, [fields]);

  const handleAccept = (field: ExtractedField) => {
    if (onAcceptField) {
      onAcceptField(field);
    }
  };

  const handleReject = (field: ExtractedField) => {
    if (onRejectField) {
      onRejectField(field);
    }
  };

  const handleStartEdit = (field: ExtractedField) => {
    setEditingField(field.fieldPath);
    setEditValue(field.value);
  };

  const handleSaveEdit = (field: ExtractedField) => {
    if (onEditField && editValue !== null) {
      onEditField(field, editValue);
    }
    setEditingField(null);
    setEditValue(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue(null);
  };

  const handleToggleSelect = (fieldPath: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldPath)) {
      newSelected.delete(fieldPath);
    } else {
      newSelected.add(fieldPath);
    }
    setSelectedFields(newSelected);
  };

  const handleBulkAcceptHighConfidence = () => {
    if (onBulkAccept && highConfidenceFields.length > 0) {
      onBulkAccept(highConfidenceFields);
    }
  };

  const handleBulkAcceptSelected = () => {
    if (onBulkAccept && selectedFields.size > 0) {
      const fieldsToAccept = fields.filter(f => selectedFields.has(f.fieldPath));
      onBulkAccept(fieldsToAccept);
      setSelectedFields(new Set());
    }
  };

  const handleBulkRejectSelected = () => {
    if (onBulkReject && selectedFields.size > 0) {
      const fieldsToReject = fields.filter(f => selectedFields.has(f.fieldPath));
      onBulkReject(fieldsToReject);
      setSelectedFields(new Set());
    }
  };

  const formatValue = (value: any, transform?: string): string => {
    if (value === null || value === undefined) return '(empty)';

    if (transform === 'currency') {
      return typeof value === 'number'
        ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;
    }

    if (transform === 'percentage') {
      return typeof value === 'number'
        ? `${(value * 100).toFixed(1)}%`
        : value;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Processing extraction results...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 mb-2">No fields extracted</p>
        <p className="text-sm text-gray-500">The document may not contain extractable data or extraction failed.</p>
      </div>
    );
  }

  return (
    <div className="extraction-preview">
      {/* Header with overall stats */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Extracted Fields
          </h3>
          {overallConfidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Overall Confidence:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                CONFIDENCE_LEVELS[getConfidenceLevel(overallConfidence)].color
              }`}>
                {Math.round(overallConfidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Confidence stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">High: {confidenceStats.high}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">Medium: {confidenceStats.medium}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Low: {confidenceStats.low}</span>
          </div>
          <div className="ml-auto text-gray-600">
            Total: {fields.length} fields
          </div>
        </div>

        {/* Bulk actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <button
              onClick={handleBulkAcceptHighConfidence}
              disabled={highConfidenceFields.length === 0}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept All High Confidence ({highConfidenceFields.length})
            </button>

            {selectedFields.size > 0 && (
              <>
                <button
                  onClick={handleBulkAcceptSelected}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Accept Selected ({selectedFields.size})
                </button>
                <button
                  onClick={handleBulkRejectSelected}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Reject Selected ({selectedFields.size})
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Fields grouped by module */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {Array.from(fieldsByModule.entries()).map(([moduleName, moduleFields]) => (
          <div key={moduleName} className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {moduleName}
              <span className="text-sm text-gray-500 font-normal">
                ({moduleFields.length} fields)
              </span>
            </h4>

            <div className="space-y-3">
              {moduleFields.map((field) => {
                const isEditing = editingField === field.fieldPath;
                const isSelected = selectedFields.has(field.fieldPath);
                const confidenceLevel = getConfidenceLevel(field.confidence);
                const confidenceBadge = CONFIDENCE_LEVELS[confidenceLevel];

                return (
                  <div
                    key={field.fieldPath}
                    className={`p-3 border rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox for selection */}
                      {showActions && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(field.fieldPath)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Field name and badges */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {field.fieldName}
                          </span>
                          {field.required && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              Required
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 text-xs rounded ${confidenceBadge.color}`}>
                            {Math.round(field.confidence * 100)}% {confidenceBadge.label}
                          </span>
                          {field.transform && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              {field.transform}
                            </span>
                          )}
                        </div>

                        {/* Field value */}
                        {isEditing ? (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(field)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <code className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded block">
                              {formatValue(field.value, field.transform)}
                            </code>
                          </div>
                        )}

                        {/* Target field info */}
                        <div className="mt-2 text-xs text-gray-500">
                          Maps to: <code className="bg-gray-100 px-1 rounded">{field.targetField}</code>
                        </div>
                      </div>

                      {/* Actions */}
                      {showActions && !isEditing && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleAccept(field)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Accept field"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleStartEdit(field)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit value"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReject(field)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Reject field"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
