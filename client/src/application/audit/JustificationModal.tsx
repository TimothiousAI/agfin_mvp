import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * Standardized justification reasons for field edits
 */
export type JustificationReason =
  | 'ai_extraction_error'
  | 'document_ambiguity'
  | 'farmer_provided_correction'
  | 'data_missing_illegible';

/**
 * Justification reason metadata
 */
interface ReasonOption {
  value: JustificationReason;
  label: string;
  description: string;
}

/**
 * Available justification reasons
 */
const JUSTIFICATION_REASONS: ReasonOption[] = [
  {
    value: 'ai_extraction_error',
    label: 'AI Extraction Error',
    description: 'The AI incorrectly extracted or interpreted the information from the document',
  },
  {
    value: 'document_ambiguity',
    label: 'Document Ambiguity',
    description: 'The source document is unclear, has conflicting information, or is difficult to read',
  },
  {
    value: 'farmer_provided_correction',
    label: 'Farmer-Provided Correction',
    description: 'The farmer provided updated or corrected information that differs from the document',
  },
  {
    value: 'data_missing_illegible',
    label: 'Data Missing/Illegible',
    description: 'The required information is missing from the document or cannot be read',
  },
];

/**
 * Field edit data
 */
export interface FieldEdit {
  fieldId: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
}

/**
 * Justification data
 */
export interface Justification {
  reason: JustificationReason;
  notes: string;
}

/**
 * Props for JustificationModal component
 */
export interface JustificationModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Field being edited */
  fieldEdit: FieldEdit | null;
  /** Callback when justification is submitted */
  onSubmit: (justification: Justification) => void;
  /** Callback when modal is closed/cancelled */
  onCancel: () => void;
  /** Loading state during submission */
  loading?: boolean;
}

/**
 * JustificationModal Component
 *
 * Modal for selecting justification reason when editing extracted fields.
 * Enforces selection of one of four standardized reasons with optional notes.
 * Required for audit trail compliance.
 */
export default function JustificationModal({
  isOpen,
  fieldEdit,
  onSubmit,
  onCancel,
  loading = false,
}: JustificationModalProps) {
  const [selectedReason, setSelectedReason] = useState<JustificationReason | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate reason selected
    if (!selectedReason) {
      setError('Please select a justification reason');
      return;
    }

    // Submit justification
    onSubmit({
      reason: selectedReason,
      notes: notes.trim(),
    });
  };

  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    const str = String(value);
    return str.length > 100 ? str.substring(0, 97) + '...' : str;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#0D2233] border border-white/20 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#061623] border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Edit Justification Required</h2>
            <p className="text-sm text-white/60 mt-1">
              Please provide a reason for this field correction
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="justification-form">
            {/* Field being edited */}
            {fieldEdit && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
                <h3 className="text-white font-medium mb-3">Field: {fieldEdit.fieldName}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Original Value:</div>
                    <div className="text-sm text-white bg-white/5 p-2 rounded border border-white/10">
                      {formatValue(fieldEdit.oldValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">New Value:</div>
                    <div className="text-sm text-white bg-[#30714C]/20 p-2 rounded border border-[#30714C]/30">
                      {formatValue(fieldEdit.newValue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Justification reasons */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Reason for Correction <span className="text-red-400">*</span>
              </label>

              <div className="space-y-3">
                {JUSTIFICATION_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedReason === reason.value
                        ? 'border-[#30714C] bg-[#30714C]/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="justification-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => {
                        setSelectedReason(e.target.value as JustificationReason);
                        setError(null);
                      }}
                      disabled={loading}
                      className="mt-1 w-4 h-4 text-[#30714C] border-white/20 focus:ring-[#30714C] focus:ring-offset-0 disabled:opacity-50"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-white font-medium mb-1">{reason.label}</div>
                      <div className="text-sm text-white/60">{reason.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Additional notes */}
            <div className="mb-6">
              <label htmlFor="justification-notes" className="block text-white font-medium mb-2">
                Additional Notes <span className="text-white/60 text-sm font-normal">(Optional)</span>
              </label>
              <textarea
                id="justification-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder="Add any additional context or details about this correction..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <div className="text-xs text-white/60 mt-2">
                {notes.length} characters
              </div>
            </div>

            {/* Audit trail notice */}
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <strong>Audit Trail:</strong> This justification will be permanently recorded in the
                  audit trail for compliance purposes. All field edits require documented justification.
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 bg-[#061623] border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-white bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="justification-form"
            disabled={loading || !selectedReason}
            className="px-6 py-2 text-white bg-[#30714C] hover:bg-[#30714C]/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save with Justification</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
