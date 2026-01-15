import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Individual certification requirement
 */
export interface CertificationRequirement {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  /** Navigation path to fix this requirement */
  fixPath?: string;
}

/**
 * Missing item detail
 */
export interface MissingItem {
  type: 'document' | 'module' | 'field';
  name: string;
  description: string;
  /** Navigation path to resolve */
  fixPath?: string;
}

/**
 * Certification status data
 */
export interface CertificationData {
  /** All certification requirements */
  requirements: CertificationRequirement[];
  /** Specific missing items */
  missingItems: MissingItem[];
  /** Overall ready state */
  isReadyForCertification: boolean;
  /** Application ID being certified */
  applicationId: string;
}

/**
 * Props for CertificationView component
 */
export interface CertificationViewProps {
  /** Certification status data */
  data: CertificationData;
  /** Callback when certify button is clicked */
  onCertify?: () => void;
  /** Callback when navigate to fix is clicked */
  onNavigateToFix?: (path: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * CertificationView Component
 *
 * Displays comprehensive certification checklist and status:
 * - Checklist of all requirements
 * - All documents audited check
 * - All modules complete check
 * - Missing items list with navigation
 * - Certify button (disabled if incomplete)
 * - Navigate to fix issues links
 *
 * Used as the final step before certifying an application for processing.
 */
export const CertificationView: React.FC<CertificationViewProps> = ({
  data,
  onCertify,
  onNavigateToFix,
  loading = false,
  className = '',
}) => {
  const handleCertify = () => {
    if (data.isReadyForCertification && onCertify) {
      onCertify();
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigateToFix) {
      onNavigateToFix(path);
    }
  };

  // Calculate completion stats
  const totalRequirements = data.requirements.length;
  const completedRequirements = data.requirements.filter(r => r.completed).length;
  const completionPercentage = totalRequirements > 0
    ? Math.round((completedRequirements / totalRequirements) * 100)
    : 0;

  // Loading state
  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Certification Checklist
        </h1>
        <p className="text-gray-600">
          Review all requirements before certifying this application for processing.
        </p>
      </div>

      {/* Overall Status Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Overall Completion
            </h2>
            <p className="text-sm text-gray-600">
              {completedRequirements} of {totalRequirements} requirements met
            </p>
          </div>
          {data.isReadyForCertification ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Ready to Certify
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              <AlertCircle className="w-5 h-5" />
              {data.missingItems.length} Issue{data.missingItems.length !== 1 ? 's' : ''} to Resolve
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="text-right text-sm font-medium text-gray-700 mt-1">
          {completionPercentage}%
        </div>
      </Card>

      {/* Requirements Checklist */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Requirements Checklist
        </h2>
        <div className="space-y-3">
          {data.requirements.map((requirement) => (
            <div
              key={requirement.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                requirement.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {requirement.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">
                    {requirement.label}
                  </h3>
                  {requirement.required && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {requirement.description}
                </p>
                {!requirement.completed && requirement.fixPath && (
                  <button
                    onClick={() => handleNavigate(requirement.fixPath!)}
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Go to fix
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Missing Items (if any) */}
      {data.missingItems.length > 0 && (
        <Card className="p-6 mb-6 border-2 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold text-amber-900 mb-1">
                Items Requiring Attention
              </h2>
              <p className="text-sm text-amber-700">
                The following items must be completed before certification:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {data.missingItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-white rounded-lg border border-amber-200"
              >
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-0.5">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                  </div>
                </div>
                {item.fixPath && (
                  <button
                    onClick={() => handleNavigate(item.fixPath!)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 text-white hover:bg-amber-700 rounded transition-colors font-medium"
                  >
                    Resolve
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Certification Action */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Certify?
            </h2>
            {data.isReadyForCertification ? (
              <p className="text-gray-600">
                All requirements have been met. You can now certify this application
                for processing. This action will lock the application and submit it
                for final review.
              </p>
            ) : (
              <p className="text-gray-600">
                Please complete all required items above before certifying. Once all
                requirements are met, the certify button will become available.
              </p>
            )}
          </div>
          <Button
            onClick={handleCertify}
            disabled={!data.isReadyForCertification}
            className={`flex-shrink-0 px-6 py-3 font-semibold ${
              data.isReadyForCertification
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Certify Application
          </Button>
        </div>

        {!data.isReadyForCertification && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Use the "Go to fix" and "Resolve" links above to quickly
              navigate to incomplete sections and complete the required items.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CertificationView;
