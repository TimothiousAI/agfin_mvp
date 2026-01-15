import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DocumentProgress, { DocumentSlot, DEFAULT_DOCUMENT_SLOTS } from './DocumentProgress';
import ModuleProgressSection, { ModuleStatus, DEFAULT_MODULES } from './ModuleProgressSection';
import { WarningSummary } from './WarningBadges';
import OverallProgress, { CategoryCompletion, Blocker } from './OverallProgress';

/**
 * Progress panel section configuration
 */
export interface ProgressSection {
  id: string;
  title: string;
  defaultExpanded: boolean;
  order: number;
}

/**
 * Props for ProgressPanel component
 */
export interface ProgressPanelProps {
  /** Application ID being tracked */
  applicationId?: string;
  /** Document slots data */
  documents?: DocumentSlot[];
  /** Module progress data */
  modules?: ModuleStatus[];
  /** Overall progress categories */
  categories?: CategoryCompletion[];
  /** Blockers preventing certification */
  blockers?: Blocker[];
  /** Overall completion percentage */
  overallPercentage?: number;
  /** Ready for certification flag */
  readyForCertification?: boolean;
  /** Callback when document is clicked */
  onDocumentClick?: (documentId: string) => void;
  /** Callback when module is clicked */
  onModuleClick?: (moduleNumber: number) => void;
  /** Callback when submit button clicked */
  onSubmit?: () => void;
  /** Active document ID */
  activeDocumentId?: string;
  /** Active module number */
  activeModuleNumber?: number;
  /** Loading state */
  loading?: boolean;
  /** Initial expanded sections */
  initialExpandedSections?: string[];
}

/**
 * Collapsible section component
 */
interface CollapsibleSectionProps {
  id: string;
  title: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  badge?: number;
}

function CollapsibleSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
  badge,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      {/* Section Header */}
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem] text-center">
              {badge}
            </span>
          )}
        </div>
        <div className="text-white/60">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div
          id={`section-${id}`}
          className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Progress Panel Container Component
 *
 * Main container for all progress tracking sections:
 * - Overall progress summary (sticky at top)
 * - Collapsible sections for documents, modules, and warnings
 * - Scroll area with overflow handling
 * - Responsive layout
 * - Section expand/collapse with persistent state
 */
export default function ProgressPanel({
  applicationId,
  documents = DEFAULT_DOCUMENT_SLOTS,
  modules = DEFAULT_MODULES,
  categories = [],
  blockers = [],
  overallPercentage = 0,
  readyForCertification = false,
  onDocumentClick,
  onModuleClick,
  onSubmit,
  activeDocumentId,
  activeModuleNumber,
  loading = false,
  initialExpandedSections = ['overall', 'documents', 'modules'],
}: ProgressPanelProps) {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(initialExpandedSections)
  );

  /**
   * Toggle section expanded state
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Calculate warning count for badge
  const warningCount = blockers.filter((b) => b.severity === 'critical').length;
  const documentWarnings = documents.filter((d) => d.status === 'error').length;
  const moduleWarnings = modules.filter(
    (m) => m.completionPercentage < 100 && m.requiredFieldsCompleted < m.requiredFieldsTotal
  ).length;

  return (
    <div className="flex flex-col h-full bg-[#061623]">
      {/* Sticky Application Header */}
      <div className="sticky top-0 z-10 bg-[#0D2233] border-b border-white/10 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Progress Tracker</h1>
            {applicationId && (
              <p className="text-sm text-white/60 mt-1">
                Application ID: {applicationId}
              </p>
            )}
          </div>
          {!loading && (
            <div className="text-right">
              <div className="text-4xl font-bold text-white">
                {Math.round(overallPercentage)}%
              </div>
              <div className="text-sm text-white/60">Complete</div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-white/10">
          {/* Overall Progress Section - Always expanded and pinned */}
          <div className="bg-[#0D2233] p-4">
            <OverallProgress
              overallPercentage={overallPercentage}
              categories={categories}
              blockers={blockers}
              readyForCertification={readyForCertification}
              onSubmit={onSubmit}
              loading={loading}
            />
          </div>

          {/* Document Progress Section */}
          <CollapsibleSection
            id="documents"
            title="Documents"
            isExpanded={expandedSections.has('documents')}
            onToggle={toggleSection}
            badge={documentWarnings}
          >
            <DocumentProgress
              documents={documents}
              onDocumentClick={onDocumentClick}
              activeDocumentId={activeDocumentId}
              loading={loading}
            />
          </CollapsibleSection>

          {/* Module Progress Section */}
          <CollapsibleSection
            id="modules"
            title="Modules"
            isExpanded={expandedSections.has('modules')}
            onToggle={toggleSection}
            badge={moduleWarnings}
          >
            <ModuleProgressSection
              modules={modules}
              onModuleClick={onModuleClick}
              activeModuleNumber={activeModuleNumber}
              loading={loading}
            />
          </CollapsibleSection>

          {/* Warning Summary Section - Only show if warnings exist */}
          {(warningCount > 0 || documentWarnings > 0 || moduleWarnings > 0) && (
            <CollapsibleSection
              id="warnings"
              title="Attention Required"
              isExpanded={expandedSections.has('warnings')}
              onToggle={toggleSection}
              badge={warningCount + documentWarnings + moduleWarnings}
            >
              <div className="space-y-4">
                <WarningSummary
                  totalWarnings={warningCount + documentWarnings + moduleWarnings}
                  breakdown={{
                    documents: documentWarnings,
                    modules: moduleWarnings,
                  }}
                  onViewAll={() => {
                    // Expand document and module sections
                    setExpandedSections((prev) => {
                      const newSet = new Set(prev);
                      newSet.add('documents');
                      newSet.add('modules');
                      return newSet;
                    });
                  }}
                />

                {/* Show blockers if any exist */}
                {blockers.length > 0 && (
                  <div className="bg-[#0D2233] rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Critical Issues</h4>
                    <div className="space-y-2">
                      {blockers.map((blocker) => (
                        <div
                          key={blocker.id}
                          className={`
                            rounded-lg p-3 border-2
                            ${blocker.severity === 'critical'
                              ? 'bg-red-900/20 border-red-500/50 text-red-200'
                              : 'bg-orange-900/20 border-orange-500/50 text-orange-200'
                            }
                          `}
                        >
                          <div className="text-sm font-medium">{blocker.description}</div>
                          <div className="text-xs opacity-75 mt-1 capitalize">
                            {blocker.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Bottom Padding for Mobile */}
      <div className="h-4 bg-[#061623]" />
    </div>
  );
}

/**
 * Hook to manage progress panel state persistence
 */
export function useProgressPanelState(applicationId: string) {
  const storageKey = `progress-panel-${applicationId}`;

  // Load saved state from localStorage
  const loadState = (): string[] => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load progress panel state:', error);
    }
    return ['overall', 'documents', 'modules'];
  };

  // Save state to localStorage
  const saveState = (expandedSections: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(expandedSections));
    } catch (error) {
      console.error('Failed to save progress panel state:', error);
    }
  };

  return { loadState, saveState };
}
