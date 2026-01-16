/**
 * action-commands.tsx
 *
 * Commands for common application actions.
 */

import {
  Download,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Eye,
  Settings,
  HelpCircle,
  Keyboard
} from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface GetActionCommandsOptions {
  onExportPdf: () => void;
  onCertifyApplication: () => void;
  onRefreshData: () => void;
  onFocusChat: () => void;
  onShowArtifactPanel: () => void;
  onOpenSettings: () => void;
  onShowHelp: () => void;
  onShowKeyboardShortcuts: () => void;
  hasActiveApplication?: boolean;
  canCertify?: boolean;
}

export function getActionCommands({
  onExportPdf,
  onCertifyApplication,
  onRefreshData,
  onFocusChat,
  onShowArtifactPanel,
  onOpenSettings,
  onShowHelp,
  onShowKeyboardShortcuts,
  hasActiveApplication = false,
  canCertify = false,
}: GetActionCommandsOptions): Command[] {
  const commands: Command[] = [
    {
      id: 'action.focus-chat',
      label: 'Focus Chat',
      description: 'Jump to the chat input',
      group: 'actions' as const,
      keywords: ['chat', 'input', 'message', 'focus', 'type'],
      icon: <MessageSquare className="h-4 w-4" />,
      onSelect: onFocusChat,
    },
    {
      id: 'action.show-artifacts',
      label: 'Show Artifact Panel',
      description: 'Open the artifact viewer panel',
      group: 'actions' as const,
      keywords: ['artifact', 'panel', 'viewer', 'documents', 'show'],
      icon: <Eye className="h-4 w-4" />,
      onSelect: onShowArtifactPanel,
    },
    {
      id: 'action.refresh',
      label: 'Refresh Data',
      description: 'Reload application data from server',
      group: 'actions' as const,
      keywords: ['refresh', 'reload', 'sync', 'update', 'fetch'],
      icon: <RefreshCw className="h-4 w-4" />,
      onSelect: onRefreshData,
    },
    {
      id: 'action.settings',
      label: 'Open Settings',
      description: 'Configure application preferences',
      group: 'navigation' as const,
      keywords: ['settings', 'preferences', 'config', 'options'],
      icon: <Settings className="h-4 w-4" />,
      onSelect: onOpenSettings,
    },
    {
      id: 'action.help',
      label: 'Help & Documentation',
      description: 'View help documentation',
      group: 'navigation' as const,
      keywords: ['help', 'docs', 'documentation', 'guide', 'support'],
      icon: <HelpCircle className="h-4 w-4" />,
      onSelect: onShowHelp,
    },
    {
      id: 'action.shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      group: 'navigation' as const,
      keywords: ['keyboard', 'shortcuts', 'keys', 'hotkeys', 'bindings'],
      icon: <Keyboard className="h-4 w-4" />,
      onSelect: onShowKeyboardShortcuts,
    },
  ];

  // Application-specific commands
  if (hasActiveApplication) {
    commands.push({
      id: 'action.export-pdf',
      label: 'Export to PDF',
      description: 'Download the application as a PDF document',
      group: 'actions' as const,
      keywords: ['export', 'pdf', 'download', 'print', 'save'],
      icon: <Download className="h-4 w-4" />,
      onSelect: onExportPdf,
    });

    if (canCertify) {
      commands.push({
        id: 'action.certify',
        label: 'Certify Application',
        description: 'Mark the application as certified and lock it',
        group: 'actions' as const,
        keywords: ['certify', 'approve', 'complete', 'lock', 'submit'],
        icon: <CheckCircle2 className="h-4 w-4" />,
        onSelect: onCertifyApplication,
      });
    }
  }

  return commands;
}
