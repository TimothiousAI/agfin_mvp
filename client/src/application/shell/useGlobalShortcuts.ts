/**
 * Global Keyboard Shortcuts Hook
 *
 * Connects keyboard shortcut definitions to actual application handlers.
 * Must be used within a component that has access to routing and store context.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts, type ShortcutRegistration } from '../../shared/commands/useKeyboardShortcuts';
import { getDefaultShortcuts } from '../../shared/commands/defaultShortcuts';
import { getNavigationShortcuts } from '../../shared/commands/navigationShortcuts';
import { usePanelStore } from './usePanelStore';
import { useArtifactStore } from './useArtifactStore';
import { toast } from '../../shared/ui/use-toast';

export interface GlobalShortcutContext {
  /** Current application ID (if any) */
  applicationId?: string;
  /** Current module number being viewed (1-5) */
  currentModule?: number;
  /** Current document index in artifact list */
  currentDocumentIndex?: number;
  /** Total number of documents */
  totalDocuments?: number;
  /** Function to trigger save on active form */
  onSaveActiveForm?: () => Promise<void>;
  /** Whether save is available (form is dirty) */
  canSave?: boolean;
  /** Function to open new application dialog */
  onOpenNewApplicationDialog?: () => void;
}

export function useGlobalShortcuts(context: GlobalShortcutContext = {}) {
  const navigate = useNavigate();
  const toggleArtifactPanel = usePanelStore((state) => state.toggleArtifactPanel);
  const artifacts = useArtifactStore((state) => state.artifacts);
  const activeArtifactId = useArtifactStore((state) => state.activeArtifactId);
  const setActiveArtifact = useArtifactStore((state) => state.setActiveArtifact);

  // Destructure context for stable dependencies
  const {
    onOpenNewApplicationDialog,
    onSaveActiveForm,
    canSave,
    applicationId,
  } = context;

  // Handler: Create new application
  // Note: Prevents browser's "new window" default behavior
  const handleNewApplication = useCallback(() => {
    if (onOpenNewApplicationDialog) {
      onOpenNewApplicationDialog();
    } else {
      // Default behavior: navigate to new application route or trigger via chat
      navigate('/applications/new');
    }
  }, [navigate, onOpenNewApplicationDialog]);

  // Handler: Save current form (updated with toast feedback)
  const handleSave = useCallback(async () => {
    if (onSaveActiveForm && canSave) {
      try {
        await onSaveActiveForm();
        toast({
          title: 'Saved',
          description: 'Form saved successfully',
          variant: 'success',
        });
      } catch (error) {
        toast({
          title: 'Save failed',
          description: (error as Error).message,
          variant: 'error',
        });
      }
    } else if (!canSave) {
      toast({
        title: 'No changes to save',
        description: 'The form has no unsaved changes',
        variant: 'default',
      });
    }
  }, [onSaveActiveForm, canSave]);

  // Handler: Navigate to next document/module
  const handleNext = useCallback(() => {
    if (!artifacts.length || !activeArtifactId) return;

    const currentIndex = artifacts.findIndex(a => a.id === activeArtifactId);
    if (currentIndex < artifacts.length - 1) {
      setActiveArtifact(artifacts[currentIndex + 1].id);
    }
  }, [artifacts, activeArtifactId, setActiveArtifact]);

  // Handler: Navigate to previous document/module
  const handlePrevious = useCallback(() => {
    if (!artifacts.length || !activeArtifactId) return;

    const currentIndex = artifacts.findIndex(a => a.id === activeArtifactId);
    if (currentIndex > 0) {
      setActiveArtifact(artifacts[currentIndex - 1].id);
    }
  }, [artifacts, activeArtifactId, setActiveArtifact]);

  // Handler: Jump to specific module
  const handleJumpToModule = useCallback((moduleNumber: number) => {
    if (applicationId) {
      navigate(`/applications/${applicationId}/modules/${moduleNumber}`);
    }
  }, [navigate, applicationId]);

  // Check if navigation is available
  const isNavigationAvailable = useCallback(() => {
    return artifacts.length > 1;
  }, [artifacts.length]);

  // Check if save is available
  const isSaveAvailable = useCallback(() => {
    return !!canSave;
  }, [canSave]);

  // Build shortcuts array
  const shortcuts = useMemo(() => {
    const allShortcuts: ShortcutRegistration[] = [];

    // Default shortcuts (New Application, Toggle Artifact, etc.)
    const defaultShortcuts = getDefaultShortcuts({
      onNewApplication: handleNewApplication,
      onToggleArtifactPanel: toggleArtifactPanel,
    });
    allShortcuts.push(...defaultShortcuts);

    // Navigation shortcuts (Next, Previous, Save, Module Jump)
    const navigationShortcuts = getNavigationShortcuts({
      onNext: handleNext,
      onPrevious: handlePrevious,
      onJumpToModule: applicationId ? handleJumpToModule : undefined,
      onSave: handleSave,
      isNavigationAvailable,
      isSaveAvailable,
    });
    allShortcuts.push(...navigationShortcuts);

    return allShortcuts;
  }, [
    handleNewApplication,
    toggleArtifactPanel,
    handleNext,
    handlePrevious,
    handleJumpToModule,
    handleSave,
    isNavigationAvailable,
    isSaveAvailable,
    applicationId,
  ]);

  // Register all shortcuts
  useKeyboardShortcuts(shortcuts);

  return {
    handleNewApplication,
    handleSave,
    handleNext,
    handlePrevious,
    handleJumpToModule,
  };
}
