import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * Module metadata - defines field requirements for each module
 */
interface ModuleMetadata {
  number: number;
  name: string;
  shortName: string;
  requiredFields: string[];
  optionalFields: string[];
  icon: React.ReactNode;
}

const MODULE_METADATA: ModuleMetadata[] = [
  {
    number: 1,
    name: 'Identity & Entity',
    shortName: 'M1',
    requiredFields: [
      'applicant_first_name',
      'applicant_last_name',
      'applicant_dob',
      'applicant_ssn',
      'applicant_address_street',
      'applicant_address_city',
      'applicant_address_state',
      'applicant_address_zip',
      'entity_type',
    ],
    optionalFields: [
      'applicant_middle_name',
      'applicant_address_county',
      'organization_legal_name',
      'organization_ein',
      'organization_structure',
      'organization_members',
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: 2,
    name: 'Lands Farmed',
    shortName: 'M2',
    requiredFields: [
      'tract_number',
      'acres_dry',
      'acres_irrigated',
      'county',
    ],
    optionalFields: [
      'tract_legal_description',
      'ownership_type',
      'map_coordinates',
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    number: 3,
    name: 'Financial Statement',
    shortName: 'M3',
    requiredFields: [
      'current_assets_cash',
      'current_assets_accounts_receivable',
      'current_assets_inventory',
      'fixed_assets_land',
      'fixed_assets_equipment',
      'current_liabilities',
      'long_term_liabilities',
    ],
    optionalFields: [
      'current_assets_other',
      'fixed_assets_buildings',
      'fixed_assets_other',
      'other_assets',
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: 4,
    name: 'Projected Operations',
    shortName: 'M4',
    requiredFields: [
      'crop_type',
      'acres_planted',
      'expected_yield',
      'expected_price',
      'operating_expenses_seed',
      'operating_expenses_fertilizer',
      'operating_expenses_chemicals',
      'operating_expenses_fuel',
      'loan_amount_requested',
    ],
    optionalFields: [
      'crop_insurance_coverage',
      'operating_expenses_labor',
      'operating_expenses_equipment_rental',
      'operating_expenses_other',
    ],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: 5,
    name: 'Summary & Ratios',
    shortName: 'M5',
    requiredFields: [
      'total_projected_income',
      'total_expenses',
      'net_cash_flow',
      'dscr',
    ],
    optionalFields: [],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

/**
 * Module completion status calculated from module_data
 */
export interface ModuleCompletionStatus {
  moduleNumber: number;
  requiredFieldsCompleted: number;
  requiredFieldsTotal: number;
  optionalFieldsCompleted: number;
  optionalFieldsTotal: number;
  completionPercentage: number;
  isComplete: boolean;
  missingRequiredFields: string[];
}

export interface ModuleProgressProps {
  /** Application ID to fetch module data for */
  applicationId: string;
  /** Module completion data from API */
  moduleStatuses?: ModuleCompletionStatus[];
  /** Callback when a module is clicked */
  onModuleClick?: (moduleNumber: number) => void;
  /** Current active module (highlights it) */
  activeModule?: number;
  /** Loading state */
  loading?: boolean;
}

/**
 * Module Progress Indicator Component
 *
 * Displays completion status for all 5 certification modules:
 * - Completion percentage per module
 * - Required vs optional field counts
 * - Missing field indicators
 * - Click to navigate to module
 * - Color-coded status (incomplete, partial, complete)
 */
export default function ModuleProgress({
  applicationId,
  moduleStatuses = [],
  onModuleClick,
  activeModule,
  loading = false,
}: ModuleProgressProps) {
  const getModuleStatus = (moduleNumber: number): ModuleCompletionStatus | undefined => {
    return moduleStatuses.find(status => status.moduleNumber === moduleNumber);
  };

  const getStatusColor = (status: ModuleCompletionStatus | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';

    if (status.isComplete) {
      return 'bg-green-100 text-green-800 border-green-500';
    } else if (status.completionPercentage >= 50) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    } else if (status.completionPercentage > 0) {
      return 'bg-orange-100 text-orange-800 border-orange-500';
    } else {
      return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getProgressBarColor = (status: ModuleCompletionStatus | undefined): string => {
    if (!status) return 'bg-gray-300';

    if (status.isComplete) {
      return 'bg-green-500';
    } else if (status.completionPercentage >= 50) {
      return 'bg-yellow-500';
    } else if (status.completionPercentage > 0) {
      return 'bg-orange-500';
    } else {
      return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: ModuleCompletionStatus | undefined): React.ReactNode => {
    if (!status || status.completionPercentage === 0) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (status.isComplete) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Module Progress
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete all required fields in each module to submit your application
        </p>
      </div>

      <div className="space-y-3">
        {MODULE_METADATA.map(module => {
          const status = getModuleStatus(module.number);
          const isActive = activeModule === module.number;
          const statusColor = getStatusColor(status);
          const progressColor = getProgressBarColor(status);
          const completionPct = status?.completionPercentage ?? 0;

          return (
            <button
              key={module.number}
              onClick={() => onModuleClick?.(module.number)}
              className={`
                w-full text-left border-2 rounded-lg p-4 transition-all
                hover:shadow-md hover:scale-[1.01]
                ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${statusColor}
              `}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-gray-700">
                    {module.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-base">
                      {module.shortName}: {module.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {status ? (
                        <>
                          {status.requiredFieldsCompleted}/{status.requiredFieldsTotal} required
                          {status.optionalFieldsTotal > 0 && (
                            <> • {status.optionalFieldsCompleted}/{status.optionalFieldsTotal} optional</>
                          )}
                        </>
                      ) : (
                        <>
                          {module.requiredFields.length} required
                          {module.optionalFields.length > 0 && (
                            <> • {module.optionalFields.length} optional</>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <div className="text-2xl font-bold">
                      {Math.round(completionPct)}%
                    </div>
                    {status && status.missingRequiredFields.length > 0 && (
                      <div className="text-xs opacity-75">
                        {status.missingRequiredFields.length} missing
                      </div>
                    )}
                  </div>
                  {getStatusIcon(status)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              {/* Missing Fields Warning */}
              {status && status.missingRequiredFields.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  <span className="font-medium">Missing required fields:</span>{' '}
                  {status.missingRequiredFields.slice(0, 3).join(', ')}
                  {status.missingRequiredFields.length > 3 && (
                    <span> (+{status.missingRequiredFields.length - 3} more)</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Overall Progress
          </div>
          <div className="font-semibold text-gray-900">
            {moduleStatuses.length > 0 ? (
              <>
                {moduleStatuses.filter(s => s.isComplete).length}/{MODULE_METADATA.length} modules complete
              </>
            ) : (
              '0/5 modules complete'
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Helper function to calculate module completion status from module_data
 * This would typically be called by the parent component or a hook
 */
export function calculateModuleCompletion(
  moduleNumber: number,
  moduleData: Record<string, any>
): ModuleCompletionStatus {
  const metadata = MODULE_METADATA.find(m => m.number === moduleNumber);
  if (!metadata) {
    throw new Error(`Invalid module number: ${moduleNumber}`);
  }

  const requiredFieldsCompleted = metadata.requiredFields.filter(
    fieldId => {
      const value = moduleData[fieldId];
      return value !== null && value !== undefined && value !== '';
    }
  ).length;

  const optionalFieldsCompleted = metadata.optionalFields.filter(
    fieldId => {
      const value = moduleData[fieldId];
      return value !== null && value !== undefined && value !== '';
    }
  ).length;

  const missingRequiredFields = metadata.requiredFields.filter(
    fieldId => {
      const value = moduleData[fieldId];
      return value === null || value === undefined || value === '';
    }
  );

  const totalFields = metadata.requiredFields.length + metadata.optionalFields.length;
  const completedFields = requiredFieldsCompleted + optionalFieldsCompleted;
  const completionPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return {
    moduleNumber,
    requiredFieldsCompleted,
    requiredFieldsTotal: metadata.requiredFields.length,
    optionalFieldsCompleted,
    optionalFieldsTotal: metadata.optionalFields.length,
    completionPercentage,
    isComplete: missingRequiredFields.length === 0,
    missingRequiredFields,
  };
}
