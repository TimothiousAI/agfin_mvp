import React from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/**
 * Document upload status
 */
export type DocumentStatus = 'empty' | 'uploaded' | 'processing' | 'done' | 'error';

/**
 * Document type definition
 */
export interface DocumentSlot {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  errorMessage?: string;
  uploadedAt?: Date;
  processedAt?: Date;
}

/**
 * Props for DocumentProgress component
 */
export interface DocumentProgressProps {
  /** Array of 9 document slots */
  documents: DocumentSlot[];
  /** Callback when a document slot is clicked */
  onDocumentClick?: (documentId: string) => void;
  /** Active/selected document */
  activeDocumentId?: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Document Progress Component
 *
 * Displays upload status for all 9 required documents:
 * - Visual grid/list of document slots
 * - Status icon per slot (empty, uploaded, processing, done, error)
 * - Document type labels
 * - Click to upload or view
 * - Count of uploaded documents
 */
export default function DocumentProgress({
  documents,
  onDocumentClick,
  activeDocumentId,
  loading = false,
}: DocumentProgressProps) {
  // Calculate upload statistics
  const uploadedCount = documents.filter(
    doc => doc.status !== 'empty'
  ).length;

  const completeCount = documents.filter(
    doc => doc.status === 'done'
  ).length;

  const errorCount = documents.filter(
    doc => doc.status === 'error'
  ).length;

  const processingCount = documents.filter(
    doc => doc.status === 'processing'
  ).length;

  /**
   * Get status icon based on document status
   */
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'empty':
        return <Upload className="w-5 h-5 text-gray-400" />;
      case 'uploaded':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  /**
   * Get status color classes based on document status
   */
  const getStatusColorClasses = (status: DocumentStatus) => {
    switch (status) {
      case 'empty':
        return 'bg-gray-50 border-gray-300 text-gray-700';
      case 'uploaded':
        return 'bg-blue-50 border-blue-400 text-blue-900';
      case 'processing':
        return 'bg-yellow-50 border-yellow-400 text-yellow-900';
      case 'done':
        return 'bg-green-50 border-green-500 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-400 text-red-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  /**
   * Get status text for display
   */
  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'empty':
        return 'Not uploaded';
      case 'uploaded':
        return 'Uploaded';
      case 'processing':
        return 'Processing...';
      case 'done':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D2233] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D2233] rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#30714C]" />
            Document Progress
          </h2>
          <div className="text-white/80 text-sm font-medium">
            {uploadedCount} of 9 uploaded
          </div>
        </div>
        <p className="text-sm text-white/60">
          Upload all required documents to complete your application
        </p>
      </div>

      {/* Status Summary */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="bg-[#061623] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{completeCount}</div>
          <div className="text-xs text-white/60 mt-1">Complete</div>
        </div>
        <div className="bg-[#061623] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-500">{processingCount}</div>
          <div className="text-xs text-white/60 mt-1">Processing</div>
        </div>
        <div className="bg-[#061623] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{errorCount}</div>
          <div className="text-xs text-white/60 mt-1">Errors</div>
        </div>
        <div className="bg-[#061623] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{9 - uploadedCount}</div>
          <div className="text-xs text-white/60 mt-1">Remaining</div>
        </div>
      </div>

      {/* Document Slots Grid */}
      <div className="space-y-2">
        {documents.map((doc) => {
          const isActive = activeDocumentId === doc.id;
          const statusClasses = getStatusColorClasses(doc.status);

          return (
            <button
              key={doc.id}
              onClick={() => onDocumentClick?.(doc.id)}
              className={`
                w-full text-left border-2 rounded-lg p-4 transition-all
                hover:shadow-lg hover:scale-[1.01]
                ${isActive ? 'ring-2 ring-[#30714C] ring-offset-2 ring-offset-[#0D2233]' : ''}
                ${statusClasses}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(doc.status)}
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1">
                    {doc.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <span>{getStatusText(doc.status)}</span>
                    {doc.uploadedAt && (
                      <>
                        <span>•</span>
                        <Clock className="w-3 h-3 inline" />
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {doc.status === 'error' && doc.errorMessage && (
                    <div className="mt-1 text-xs text-red-700 font-medium">
                      {doc.errorMessage}
                    </div>
                  )}
                </div>

                {/* Action Indicator */}
                <div className="flex-shrink-0">
                  {doc.status === 'empty' ? (
                    <div className="text-xs font-medium px-2 py-1 bg-white/20 rounded">
                      Upload
                    </div>
                  ) : doc.status === 'done' ? (
                    <div className="text-xs font-medium px-2 py-1 bg-white/20 rounded">
                      View
                    </div>
                  ) : doc.status === 'error' ? (
                    <div className="text-xs font-medium px-2 py-1 bg-white/20 rounded">
                      Retry
                    </div>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="text-white/60">
            Overall Progress
          </div>
          <div className="font-semibold text-white">
            {Math.round((completeCount / documents.length) * 100)}%
          </div>
        </div>
        <div className="w-full bg-[#061623] rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-500 bg-[#30714C]"
            style={{ width: `${(completeCount / documents.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Default document slots configuration
 * Used to initialize the 9 required documents
 */
export const DEFAULT_DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: 'doc-1',
    type: 'tax_return',
    label: 'Tax Return (Previous Year)',
    status: 'empty',
  },
  {
    id: 'doc-2',
    type: 'financial_statement',
    label: 'Financial Statement',
    status: 'empty',
  },
  {
    id: 'doc-3',
    type: 'bank_statement',
    label: 'Bank Statement (Recent 3 Months)',
    status: 'empty',
  },
  {
    id: 'doc-4',
    type: 'land_deed',
    label: 'Land Deed/Ownership Proof',
    status: 'empty',
  },
  {
    id: 'doc-5',
    type: 'crop_insurance',
    label: 'Crop Insurance Policy',
    status: 'empty',
  },
  {
    id: 'doc-6',
    type: 'equipment_list',
    label: 'Equipment List & Valuation',
    status: 'empty',
  },
  {
    id: 'doc-7',
    type: 'operating_plan',
    label: 'Operating Plan',
    status: 'empty',
  },
  {
    id: 'doc-8',
    type: 'business_license',
    label: 'Business License',
    status: 'empty',
  },
  {
    id: 'doc-9',
    type: 'identification',
    label: 'Government ID',
    status: 'empty',
  },
];
