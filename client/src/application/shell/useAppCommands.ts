/**
 * useAppCommands.ts
 *
 * Aggregates all command sources for the application shell.
 * Handles dynamic command availability based on application state.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Command } from '@/shared/ui/CommandPalette';
import { getDocumentCommands, type DocumentType } from '@/shared/commands/document-commands';
import { getModuleCommands } from '@/shared/commands/module-commands';
import { getApplicationCommands } from '@/shared/commands/application-commands';
import { getSearchCommands } from '@/shared/commands/search-commands';
import { getActionCommands } from '@/shared/commands/action-commands';
import { usePanelStore } from './usePanelStore';

interface UseAppCommandsOptions {
  /** Current application ID */
  applicationId?: string;
  /** List of applications for switching */
  applications?: Array<{
    id: string;
    farmerName: string;
    status: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
    updatedAt: Date;
  }>;
  /** Currently active module number */
  activeModule?: number;
  /** Module completion status */
  moduleCompletion?: Array<{
    moduleNumber: number;
    completionPercentage: number;
    isComplete: boolean;
  }>;
  /** Document types already uploaded */
  uploadedDocuments?: DocumentType[];
  /** Whether application can be certified */
  canCertify?: boolean;
  /** Callbacks */
  onUploadDocument?: (type: DocumentType) => void;
  onNavigateToModule?: (moduleNumber: number) => void;
  onSelectApplication?: (id: string) => void;
  onCreateApplication?: () => void;
  onCertifyApplication?: () => void;
  onExportPdf?: () => void;
  onRefreshData?: () => void;
}

export function useAppCommands({
  applicationId,
  applications = [],
  activeModule,
  moduleCompletion = [],
  uploadedDocuments = [],
  canCertify = false,
  onUploadDocument = () => {},
  onNavigateToModule = () => {},
  onSelectApplication = () => {},
  onCreateApplication = () => {},
  onCertifyApplication = () => {},
  onExportPdf = () => {},
  onRefreshData = () => {},
}: UseAppCommandsOptions): Command[] {
  const navigate = useNavigate();
  const setArtifactPanelOpen = usePanelStore(state => state.setArtifactPanelOpen);

  const hasActiveApplication = !!applicationId;

  // Focus chat input
  const focusChat = useCallback(() => {
    const chatInput = document.querySelector<HTMLTextAreaElement>('[data-chat-input]');
    chatInput?.focus();
  }, []);

  // Show artifact panel
  const showArtifactPanel = useCallback(() => {
    setArtifactPanelOpen(true);
  }, [setArtifactPanelOpen]);

  // Navigation callbacks
  const openSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const showHelp = useCallback(() => {
    // Open help dialog or navigate to help page
    console.log('Show help');
  }, []);

  const showKeyboardShortcuts = useCallback(() => {
    // Dispatch event to open keyboard shortcuts dialog
    window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
  }, []);

  // Search callbacks
  const searchApplications = useCallback(() => {
    // Open search modal for applications
    console.log('Search applications');
  }, []);

  const searchDocuments = useCallback(() => {
    // Open search modal for documents
    console.log('Search documents');
  }, []);

  const findInCurrentApplication = useCallback(() => {
    // Open find in application modal
    console.log('Find in current application');
  }, []);

  const commands = useMemo(() => {
    const allCommands: Command[] = [];

    // Document commands (only when application is active)
    if (hasActiveApplication) {
      const docCommands = getDocumentCommands({
        onUploadDocument,
        uploadedDocuments,
        hasActiveApplication: true,
      });
      // Change group to 'documents' for categorization
      docCommands.forEach(cmd => {
        allCommands.push({ ...cmd, group: 'documents' as const });
      });
    }

    // Module navigation commands
    if (hasActiveApplication) {
      allCommands.push(...getModuleCommands({
        onNavigateToModule,
        moduleCompletion,
        hasActiveApplication: true,
        activeModule,
      }));
    }

    // Application commands
    allCommands.push(...getApplicationCommands({
      applications,
      activeApplicationId: applicationId,
      onSelectApplication,
      onCreateApplication,
    }));

    // Search commands
    allCommands.push(...getSearchCommands({
      onSearchApplications: searchApplications,
      onSearchDocuments: searchDocuments,
      onFindInCurrentApplication: findInCurrentApplication,
      hasActiveApplication,
    }));

    // Action commands
    allCommands.push(...getActionCommands({
      onExportPdf,
      onCertifyApplication,
      onRefreshData,
      onFocusChat: focusChat,
      onShowArtifactPanel: showArtifactPanel,
      onOpenSettings: openSettings,
      onShowHelp: showHelp,
      onShowKeyboardShortcuts: showKeyboardShortcuts,
      hasActiveApplication,
      canCertify,
    }));

    return allCommands;
  }, [
    hasActiveApplication,
    applicationId,
    applications,
    activeModule,
    moduleCompletion,
    uploadedDocuments,
    canCertify,
    onUploadDocument,
    onNavigateToModule,
    onSelectApplication,
    onCreateApplication,
    onCertifyApplication,
    onExportPdf,
    onRefreshData,
    focusChat,
    showArtifactPanel,
    openSettings,
    showHelp,
    showKeyboardShortcuts,
    searchApplications,
    searchDocuments,
    findInCurrentApplication,
  ]);

  return commands;
}
