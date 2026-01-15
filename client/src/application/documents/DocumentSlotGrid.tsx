import React from 'react';
import { DOCUMENT_TYPES, DocumentType } from './DocumentTypeSelector';

export type DocumentStatus = 'empty' | 'uploaded' | 'processing' | 'processed' | 'audited';

export interface DocumentSlot {
  documentType: DocumentType;
  status: DocumentStatus;
  documentId?: string;
  filename?: string;
  uploadedAt?: string;
  processedAt?: string;
  auditedAt?: string;
}

interface DocumentSlotGridProps {
  slots: DocumentSlot[];
  onSlotClick: (slot: DocumentSlot) => void;
  disabled?: boolean;
}

interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<DocumentStatus, StatusInfo> = {
  empty: {
    label: 'Upload Required',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  uploaded: {
    label: 'Uploaded',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  processing: {
    label: 'Processing...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: (
      <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  processed: {
    label: 'Processed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  audited: {
    label: 'Audited',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
};

export default function DocumentSlotGrid({
  slots,
  onSlotClick,
  disabled = false,
}: DocumentSlotGridProps) {
  // Calculate completion statistics
  const totalSlots = slots.length;
  const uploadedCount = slots.filter(s => s.status !== 'empty').length;
  const processedCount = slots.filter(s => s.status === 'processed' || s.status === 'audited').length;
  const auditedCount = slots.filter(s => s.status === 'audited').length;

  // Get document type info
  const getDocTypeInfo = (docType: DocumentType) => {
    return DOCUMENT_TYPES.find(dt => dt.id === docType);
  };

  return (
    <div className="space-y-4">
      {/* Completion Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Document Upload Progress</h3>
          <span className="text-sm font-semibold text-gray-900">
            {uploadedCount} / {totalSlots}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(uploadedCount / totalSlots) * 100}%` }}
          />
        </div>

        {/* Status breakdown */}
        <div className="flex gap-4 mt-3 text-xs text-gray-600">
          <span>
            <span className="font-medium text-blue-600">{uploadedCount}</span> uploaded
          </span>
          <span>
            <span className="font-medium text-green-600">{processedCount}</span> processed
          </span>
          <span>
            <span className="font-medium text-purple-600">{auditedCount}</span> audited
          </span>
        </div>
      </div>

      {/* Document Slots Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => {
          const docTypeInfo = getDocTypeInfo(slot.documentType);
          const statusInfo = STATUS_CONFIG[slot.status];

          if (!docTypeInfo) return null;

          const isClickable = !disabled;
          const isRequired = docTypeInfo.required;

          return (
            <button
              key={slot.documentType}
              type="button"
              onClick={() => isClickable && onSlotClick(slot)}
              disabled={disabled}
              className={`
                relative flex flex-col p-4 rounded-lg border-2 text-left
                transition-all duration-200
                ${statusInfo.bgColor} ${statusInfo.borderColor}
                ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-not-allowed opacity-50'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {/* Header with icon and status */}
              <div className="flex items-start justify-between mb-3">
                {/* Document type icon */}
                <div className="text-gray-400">
                  {docTypeInfo.icon}
                </div>

                {/* Status icon */}
                <div className={statusInfo.color}>
                  {statusInfo.icon}
                </div>
              </div>

              {/* Document type label */}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {docTypeInfo.label}
                  {isRequired && (
                    <span className="ml-1 text-red-500" title="Required">
                      *
                    </span>
                  )}
                </h4>

                {/* Status label */}
                <p className={`text-xs font-medium mb-2 ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>

                {/* Filename if uploaded */}
                {slot.filename && (
                  <p className="text-xs text-gray-600 truncate" title={slot.filename}>
                    {slot.filename}
                  </p>
                )}

                {/* Empty state prompt */}
                {slot.status === 'empty' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Click to upload
                  </p>
                )}
              </div>

              {/* Timestamp footer */}
              {slot.uploadedAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {slot.status === 'audited' && slot.auditedAt
                      ? `Audited: ${new Date(slot.auditedAt).toLocaleDateString()}`
                      : slot.status === 'processed' && slot.processedAt
                      ? `Processed: ${new Date(slot.processedAt).toLocaleDateString()}`
                      : `Uploaded: ${new Date(slot.uploadedAt).toLocaleDateString()}`}
                  </p>
                </div>
              )}

              {/* Required badge for empty required slots */}
              {slot.status === 'empty' && isRequired && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Required
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> Required documents must be uploaded before submission
      </p>
    </div>
  );
}
