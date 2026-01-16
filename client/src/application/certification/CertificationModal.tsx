import React, { useState } from 'react';
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';

/**
 * Application summary for certification
 */
export interface ApplicationSummary {
  applicationId: string;
  applicantName: string;
  programType: string;
  documentCount: number;
  moduleCount: number;
  submissionDate: string;
}

/**
 * Props for CertificationModal component
 */
export interface CertificationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when certification is confirmed */
  onConfirm: () => void;
  /** Application summary data */
  summary: ApplicationSummary;
  /** Loading state during certification */
  loading?: boolean;
}

/**
 * CertificationModal Component
 *
 * Final confirmation dialog before certifying an application:
 * - Displays application summary
 * - Shows legal certification statement
 * - Requires checkbox agreement
 * - Warns about irreversibility
 * - Certify & Lock button (disabled until agreed)
 *
 * This is the point of no return - once certified, the application
 * is locked and submitted for final processing.
 */
export const CertificationModal: React.FC<CertificationModalProps> = ({
  open,
  onClose,
  onConfirm,
  summary,
  loading = false,
}) => {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (agreed && !loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setAgreed(false);
      onClose();
    }
  };

  // Reset agreement when modal closes
  React.useEffect(() => {
    if (!open) {
      setAgreed(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Lock className="w-6 h-6 text-blue-600" />
            Certify Application
          </DialogTitle>
          <DialogDescription>
            Please review the information below before certifying this application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Application Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Application Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Application ID:</span>
                <span className="font-medium text-gray-900">{summary.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applicant:</span>
                <span className="font-medium text-gray-900">{summary.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Program Type:</span>
                <span className="font-medium text-gray-900">{summary.programType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents Reviewed:</span>
                <span className="font-medium text-gray-900">{summary.documentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modules Completed:</span>
                <span className="font-medium text-gray-900">{summary.moduleCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submission Date:</span>
                <span className="font-medium text-gray-900">{summary.submissionDate}</span>
              </div>
            </div>
          </div>

          {/* Legal Certification Statement */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Certification Statement
            </h3>
            <p className="text-sm text-blue-900 leading-relaxed">
              I hereby certify that I have reviewed all documentation, verified all extracted
              data fields, and confirmed that all information in this application is accurate
              and complete to the best of my knowledge. I understand that this certification
              is a legal attestation of the application's readiness for final processing.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Warning: This Action Cannot Be Undone
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Once certified, this application will be <strong>locked</strong> and
                  submitted for final processing. You will <strong>not be able to edit</strong>{' '}
                  any information after certification. Please ensure all data has been
                  thoroughly reviewed before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-white border-2 border-gray-300 rounded-lg">
            <Checkbox
              id="certification-agreement"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={loading}
              className="mt-1"
            />
            <label
              htmlFor="certification-agreement"
              className="text-sm font-medium text-gray-900 leading-relaxed cursor-pointer select-none"
            >
              I have reviewed all information and agree to certify this application as
              accurate and complete. I understand this action is final and cannot be reversed.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className={`px-6 font-semibold ${
              agreed && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Certifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Certify & Lock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificationModal;
