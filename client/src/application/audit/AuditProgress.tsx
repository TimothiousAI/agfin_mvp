import React from 'react';
import { CheckCircle2, AlertCircle, Clock, FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Document audit status
 */
export interface DocumentAuditStatus {
  id: string;
  name: string;
  status: 'pending' | 'audited' | 'needs_review';
  fieldsRequiringReview: number;
  totalFields: number;
}

/**
 * Overall audit progress data
 */
export interface AuditProgressData {
  documentsAudited: number;
  totalDocuments: number;
  fieldsRequiringReview: number;
  totalFields: number;
  documents: DocumentAuditStatus[];
  isReadyForCertification: boolean;
}

/**
 * Props for AuditProgress component
 */
export interface AuditProgressProps {
  /** Audit progress data */
  progress: AuditProgressData;
  /** Loading state */
  loading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * AuditProgress Component
 *
 * Displays comprehensive audit status for an application:
 * - Overall completion percentage
 * - Documents audited count
 * - Fields requiring review count
 * - Per-document audit status
 * - Ready for certification indicator
 *
 * Used in application detail view to track audit workflow progress.
 */
export const AuditProgress: React.FC<AuditProgressProps> = ({
  progress,
  loading = false,
  className = '',
}) => {
  // Calculate overall completion percentage
  const completionPercentage = progress.totalDocuments > 0
    ? Math.round((progress.documentsAudited / progress.totalDocuments) * 100)
    : 0;

  // Loading state
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Audit Progress</h3>
        {progress.isReadyForCertification ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Ready for Certification
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            In Progress
          </div>
        )}
      </div>

      {/* Overall Completion */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Completion</span>
          <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Documents Audited */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Documents Audited</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.documentsAudited}
            <span className="text-sm font-normal text-gray-600">
              {' '}/ {progress.totalDocuments}
            </span>
          </div>
        </div>

        {/* Fields Requiring Review */}
        <div className="p-4 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Fields to Review</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.fieldsRequiringReview}
            <span className="text-sm font-normal text-gray-600">
              {' '}/ {progress.totalFields}
            </span>
          </div>
        </div>
      </div>

      {/* Per-Document Status */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Document Status</h4>
        <div className="space-y-2">
          {progress.documents.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No documents uploaded yet</p>
          ) : (
            progress.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {doc.status === 'audited' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : doc.status === 'needs_review' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-600">
                      {doc.fieldsRequiringReview > 0
                        ? `${doc.fieldsRequiringReview} field${doc.fieldsRequiringReview > 1 ? 's' : ''} to review`
                        : 'All fields reviewed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.status === 'audited'
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'needs_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {doc.status === 'audited'
                      ? 'Audited'
                      : doc.status === 'needs_review'
                      ? 'Review Required'
                      : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ready Indicator Message */}
      {progress.isReadyForCertification && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Ready for Certification</p>
              <p className="text-sm text-green-700 mt-1">
                All documents have been audited and all fields reviewed. This application can now
                proceed to certification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Review Warning */}
      {!progress.isReadyForCertification && progress.fieldsRequiringReview > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Review Required</p>
              <p className="text-sm text-amber-700 mt-1">
                {progress.fieldsRequiringReview} field{progress.fieldsRequiringReview > 1 ? 's' : ''} with
                low confidence scores need to be reviewed before proceeding to certification.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AuditProgress;
