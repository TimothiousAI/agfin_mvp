import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

/**
 * Completion status for each category
 */
export interface CategoryCompletion {
  category: 'documents' | 'modules' | 'fields';
  label: string;
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Blocker information
 */
export interface Blocker {
  id: string;
  category: 'documents' | 'modules' | 'fields';
  description: string;
  severity: 'critical' | 'warning';
}

/**
 * Props for OverallProgress component
 */
export interface OverallProgressProps {
  /** Overall completion percentage (0-100) */
  overallPercentage: number;
  /** Breakdown by category */
  categories: CategoryCompletion[];
  /** List of blockers preventing certification */
  blockers?: Blocker[];
  /** Is application ready for certification? */
  readyForCertification: boolean;
  /** Callback when user clicks "Submit for Certification" */
  onSubmit?: () => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Overall Progress Component
 *
 * Displays comprehensive completion status:
 * - Circular progress chart showing overall percentage
 * - Category breakdown (documents, modules, fields)
 * - Ready for certification indicator
 * - Blockers list if not ready
 * - Submit button when ready
 */
export default function OverallProgress({
  overallPercentage,
  categories,
  blockers = [],
  readyForCertification,
  onSubmit,
  loading = false,
}: OverallProgressProps) {
  // Calculate stroke dash offset for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

  // Determine overall status color
  const getStatusColor = () => {
    if (readyForCertification) return '#30714C'; // Green
    if (overallPercentage >= 75) return '#EAB308'; // Yellow
    if (overallPercentage >= 50) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const statusColor = getStatusColor();

  if (loading) {
    return (
      <div className="bg-[#0D2233] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-48 bg-white/10 rounded"></div>
          <div className="space-y-2">
            <div className="h-12 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D2233] rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-[#30714C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overall Progress
        </h2>
        <p className="text-sm text-white/60 mt-1">
          Complete all sections to submit for certification
        </p>
      </div>

      {/* Circular Progress Chart */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-48 h-48">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="#061623"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={statusColor}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white">
              {Math.round(overallPercentage)}%
            </div>
            <div className="text-sm text-white/60 mt-1">Complete</div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-6">
        {readyForCertification ? (
          <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-white font-semibold">Ready for Certification</div>
                <div className="text-white/70 text-sm mt-1">
                  All requirements met. You can submit your application.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-white font-semibold">Not Ready Yet</div>
                <div className="text-white/70 text-sm mt-1">
                  Complete the items below to submit for certification.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3">Progress Breakdown</h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const isComplete = category.completed === category.total;
            const barColor = isComplete ? 'bg-[#30714C]' : 'bg-yellow-500';

            return (
              <div key={category.category} className="bg-[#061623] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="text-white font-medium">{category.label}</span>
                  </div>
                  <div className="text-white/80 text-sm font-medium">
                    {category.completed}/{category.total}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>

                {/* Percentage */}
                <div className="text-right text-white/60 text-xs mt-1">
                  {Math.round(category.percentage)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blockers List */}
      {blockers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Items Blocking Certification
          </h3>
          <div className="space-y-2">
            {blockers.map((blocker) => (
              <div
                key={blocker.id}
                className={`
                  rounded-lg p-3 border-2
                  ${blocker.severity === 'critical'
                    ? 'bg-red-900/20 border-red-500/50'
                    : 'bg-orange-900/20 border-orange-500/50'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      blocker.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm">{blocker.description}</div>
                    <div className="text-white/60 text-xs mt-1 capitalize">
                      {blocker.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {readyForCertification && (
        <button
          onClick={onSubmit}
          className="w-full bg-[#30714C] hover:bg-[#40825C] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Submit for Certification
        </button>
      )}
    </div>
  );
}

/**
 * Calculate overall progress from category data
 */
export function calculateOverallProgress(categories: CategoryCompletion[]): number {
  if (categories.length === 0) return 0;

  const totalItems = categories.reduce((sum, cat) => sum + cat.total, 0);
  const completedItems = categories.reduce((sum, cat) => sum + cat.completed, 0);

  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
}

/**
 * Check if application is ready for certification
 */
export function isReadyForCertification(categories: CategoryCompletion[]): boolean {
  return categories.every(cat => cat.completed === cat.total);
}

/**
 * Example usage with mock data
 */
export const EXAMPLE_CATEGORIES: CategoryCompletion[] = [
  {
    category: 'documents',
    label: 'Documents',
    completed: 7,
    total: 9,
    percentage: 77.8,
  },
  {
    category: 'modules',
    label: 'Modules',
    completed: 4,
    total: 5,
    percentage: 80,
  },
  {
    category: 'fields',
    label: 'Required Fields',
    completed: 28,
    total: 33,
    percentage: 84.8,
  },
];

export const EXAMPLE_BLOCKERS: Blocker[] = [
  {
    id: 'blocker-1',
    category: 'documents',
    description: '2 documents not uploaded: Tax Return, Financial Statement',
    severity: 'critical',
  },
  {
    id: 'blocker-2',
    category: 'modules',
    description: 'Module 5 (Summary & Ratios) incomplete',
    severity: 'critical',
  },
  {
    id: 'blocker-3',
    category: 'fields',
    description: '5 required fields missing in Module 1',
    severity: 'warning',
  },
];
