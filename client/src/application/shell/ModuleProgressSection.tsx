import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/**
 * Module completion status
 */
export interface ModuleStatus {
  moduleNumber: number;
  moduleName: string;
  shortName: string;
  completionPercentage: number;
  requiredFieldsCompleted: number;
  requiredFieldsTotal: number;
  isComplete: boolean;
}

/**
 * Props for ModuleProgressSection component
 */
export interface ModuleProgressSectionProps {
  /** Array of 5 module statuses */
  modules: ModuleStatus[];
  /** Callback when a module is clicked */
  onModuleClick?: (moduleNumber: number) => void;
  /** Active/selected module */
  activeModuleNumber?: number;
  /** Loading state */
  loading?: boolean;
}

/**
 * Module Progress Section Component
 *
 * Compact module progress display for the Progress Panel:
 * - Lists all 5 modules (M1-M5)
 * - Progress bar per module
 * - Completion percentage
 * - Required fields indicator
 * - Click to open module form
 */
export default function ModuleProgressSection({
  modules,
  onModuleClick,
  activeModuleNumber,
  loading = false,
}: ModuleProgressSectionProps) {
  // Calculate overall statistics
  const completedModules = modules.filter(m => m.isComplete).length;
  const averageCompletion = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.completionPercentage, 0) / modules.length)
    : 0;

  /**
   * Get status icon based on completion
   */
  const getStatusIcon = (module: ModuleStatus) => {
    if (module.isComplete) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (module.completionPercentage >= 50) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else if (module.completionPercentage > 0) {
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  /**
   * Get progress bar color based on completion
   */
  const getProgressBarColor = (percentage: number, isComplete: boolean) => {
    if (isComplete) {
      return 'bg-green-500';
    } else if (percentage >= 50) {
      return 'bg-yellow-500';
    } else if (percentage > 0) {
      return 'bg-orange-500';
    } else {
      return 'bg-gray-400';
    }
  };

  /**
   * Get card background color based on completion
   */
  const getCardColor = (percentage: number, isComplete: boolean) => {
    if (isComplete) {
      return 'bg-green-900/20 border-green-500/30';
    } else if (percentage >= 50) {
      return 'bg-yellow-900/20 border-yellow-500/30';
    } else if (percentage > 0) {
      return 'bg-orange-900/20 border-orange-500/30';
    } else {
      return 'bg-[#061623] border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D2233] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
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
            <svg className="w-6 h-6 text-[#30714C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Module Progress
          </h2>
          <div className="text-white/80 text-sm font-medium">
            {completedModules} of 5 complete
          </div>
        </div>
        <p className="text-sm text-white/60">
          Complete all required fields in each module
        </p>
      </div>

      {/* Overall Summary */}
      <div className="mb-4 bg-[#061623] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Overall Progress</span>
          <span className="text-white font-bold text-lg">{averageCompletion}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-500 bg-[#30714C]"
            style={{ width: `${averageCompletion}%` }}
          />
        </div>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {modules.map((module) => {
          const isActive = activeModuleNumber === module.moduleNumber;
          const cardColor = getCardColor(module.completionPercentage, module.isComplete);
          const progressBarColor = getProgressBarColor(module.completionPercentage, module.isComplete);

          return (
            <button
              key={module.moduleNumber}
              onClick={() => onModuleClick?.(module.moduleNumber)}
              className={`
                w-full text-left border-2 rounded-lg p-4 transition-all
                hover:shadow-lg hover:scale-[1.01]
                ${isActive ? 'ring-2 ring-[#30714C] ring-offset-2 ring-offset-[#0D2233]' : ''}
                ${cardColor}
              `}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(module)}
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {module.shortName}: {module.moduleName}
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      {module.requiredFieldsCompleted}/{module.requiredFieldsTotal} required fields
                    </div>
                  </div>
                </div>

                {/* Completion Percentage */}
                <div className="text-right">
                  <div className="text-white font-bold text-2xl">
                    {Math.round(module.completionPercentage)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${progressBarColor}`}
                  style={{ width: `${module.completionPercentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Default module configuration
 * Used to initialize the 5 certification modules
 */
export const DEFAULT_MODULES: ModuleStatus[] = [
  {
    moduleNumber: 1,
    moduleName: 'Identity & Entity',
    shortName: 'M1',
    completionPercentage: 0,
    requiredFieldsCompleted: 0,
    requiredFieldsTotal: 9,
    isComplete: false,
  },
  {
    moduleNumber: 2,
    moduleName: 'Lands Farmed',
    shortName: 'M2',
    completionPercentage: 0,
    requiredFieldsCompleted: 0,
    requiredFieldsTotal: 4,
    isComplete: false,
  },
  {
    moduleNumber: 3,
    moduleName: 'Financial Statement',
    shortName: 'M3',
    completionPercentage: 0,
    requiredFieldsCompleted: 0,
    requiredFieldsTotal: 7,
    isComplete: false,
  },
  {
    moduleNumber: 4,
    moduleName: 'Projected Operations',
    shortName: 'M4',
    completionPercentage: 0,
    requiredFieldsCompleted: 0,
    requiredFieldsTotal: 9,
    isComplete: false,
  },
  {
    moduleNumber: 5,
    moduleName: 'Summary & Ratios',
    shortName: 'M5',
    completionPercentage: 0,
    requiredFieldsCompleted: 0,
    requiredFieldsTotal: 4,
    isComplete: false,
  },
];
