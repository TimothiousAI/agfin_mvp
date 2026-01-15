import React from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Package,
  List,
  Home,
  Share2,
  Printer,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Props for CertificationSuccess component
 */
export interface CertificationSuccessProps {
  /** Application ID */
  applicationId: string;
  /** Farmer name for display */
  farmerName: string;
  /** Certification timestamp */
  certifiedAt: string;
  /** Certified by analyst ID */
  certifiedBy: string;
  /** PDF URL (optional, may still be generating) */
  pdfUrl?: string;
  /** Callback to download PDF */
  onDownloadPDF?: () => void;
  /** Callback to download ZIP package */
  onDownloadZIP?: () => void;
  /** Callback to view audit trail */
  onViewAuditTrail?: () => void;
  /** Callback to return to dashboard */
  onReturnToDashboard?: () => void;
  /** Callback to share */
  onShare?: () => void;
  /** Callback to print */
  onPrint?: () => void;
  /** Optional className */
  className?: string;
}

/**
 * CertificationSuccess Component
 *
 * Displays success message and download options after certification:
 * - Animated success message
 * - Download PDF button
 * - Download complete ZIP package
 * - View audit trail
 * - Return to dashboard
 * - Share and print options
 *
 * This is the final confirmation screen shown after successful certification.
 */
export const CertificationSuccess: React.FC<CertificationSuccessProps> = ({
  applicationId,
  farmerName,
  certifiedAt,
  certifiedBy,
  pdfUrl,
  onDownloadPDF,
  onDownloadZIP,
  onViewAuditTrail,
  onReturnToDashboard,
  onShare,
  onPrint,
  className = '',
}) => {
  const formattedDate = new Date(certifiedAt).toLocaleString();

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Success Animation and Message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-green-100 animate-bounce">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Certification Complete!
        </h1>
        <p className="text-lg text-gray-600">
          Application for <span className="font-semibold">{farmerName}</span> has
          been successfully certified
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Certified on {formattedDate}
        </p>
      </div>

      {/* Application Details */}
      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Application ID:</span>
            <p className="text-gray-900 font-mono">{applicationId}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Certified By:</span>
            <p className="text-gray-900">{certifiedBy}</p>
          </div>
        </div>
      </Card>

      {/* Download Options */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download Options
        </h2>

        <div className="space-y-3">
          {/* Download PDF */}
          <Button
            onClick={onDownloadPDF}
            disabled={!pdfUrl && !onDownloadPDF}
            variant="default"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <FileText className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Download Certification PDF</div>
              <div className="text-sm opacity-90">
                Official certification document with all application data
              </div>
            </div>
          </Button>

          {/* Download ZIP Package */}
          <Button
            onClick={onDownloadZIP}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <Package className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Download Complete Package (ZIP)</div>
              <div className="text-sm text-gray-600">
                Includes PDF, audit trail, module data, and all exports
              </div>
            </div>
          </Button>

          {/* View Audit Trail */}
          <Button
            onClick={onViewAuditTrail}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <List className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-semibold">View Audit Trail</div>
              <div className="text-sm text-gray-600">
                See complete history of all changes and reviews
              </div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onShare}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          <Button
            onClick={onPrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </Card>

      {/* Return to Dashboard */}
      <div className="text-center">
        <Button
          onClick={onReturnToDashboard}
          variant="ghost"
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This application is now locked and cannot be edited.
          All documents and data have been permanently archived. You can download
          the certification documents at any time from the application details page.
        </p>
      </div>
    </div>
  );
};

export default CertificationSuccess;
