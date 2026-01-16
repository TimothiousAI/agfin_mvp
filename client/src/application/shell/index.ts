/**
 * Shell component exports
 *
 * Core layout components and hooks for the three-column layout.
 */

// Layout components
export { AppLayout } from './AppLayout';
export { PanelResizer } from './PanelResizer';

// Form save context for global save shortcut
export {
  FormSaveProvider,
  useFormSaveContext,
  useOptionalFormSaveContext,
  useRegisterFormSave,
} from './FormSaveContext';

// Global shortcuts hook
export { useGlobalShortcuts, type GlobalShortcutContext } from './useGlobalShortcuts';

// Panel state management
export { usePanelStore, type Artifact } from './usePanelStore';

// Artifact state management
export {
  useArtifactStore,
  useArtifact,
  useActiveArtifact,
  useArtifactFullScreen,
  useArtifactCount,
  useHasArtifacts,
} from './useArtifactStore';

// Animation variants
export {
  getSidebarVariants,
  getArtifactPanelVariants,
  toggleButtonVariants,
  contentReflowVariants,
} from './animations';

// Progress components
export { default as ProgressPanel } from './ProgressPanel';
export { default as DocumentProgress } from './DocumentProgress';
export { default as ModuleProgressSection } from './ModuleProgressSection';
export { default as OverallProgress } from './OverallProgress';
export * from './WarningBadges';

// Field statistics components
export { SourceStatsBadge, EditedCountBadge } from './SourceStatsBadge';
export { ConfidenceStatsBar } from './ConfidenceStatsBar';
export { FieldDetailTooltip } from './FieldDetailTooltip';

// Field statistics hooks
export { useApplicationFieldStats, useModuleFieldStats } from './useFieldStats';

// Field statistics types
export type {
  FieldStats,
  FieldSourceStats,
  FieldConfidenceStats,
  LowConfidenceField,
  EditedField,
} from './types/fieldStats';
export { calculateFieldStats, getConfidenceLevel } from './types/fieldStats';
export type { ApplicationFieldStats } from './useFieldStats';
