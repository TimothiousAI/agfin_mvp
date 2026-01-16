/**
 * Default Application Commands
 *
 * Predefined commands for common application actions
 */

import { Home, FileText, Upload, Search, CheckCircle2, Plus, Settings, User, GraduationCap } from 'lucide-react';
import { type CommandDefinition } from './registry';
import { useOnboardingStore } from '@/application/onboarding';

export function getNavigationCommands(navigate: (path: string) => void): CommandDefinition[] {
  return [
    {
      id: 'nav.home',
      label: 'Go to Home',
      description: 'Navigate to the home page',
      category: 'navigation',
      keywords: ['home', 'dashboard', 'main'],
      icon: <Home className="h-4 w-4" />,
      shortcut: { key: 'h', meta: true, shift: true },
      action: () => navigate('/')
    },
    {
      id: 'nav.chat',
      label: 'Go to Chat',
      description: 'Open the chat interface',
      category: 'navigation',
      keywords: ['chat', 'conversation', 'ai', 'assistant'],
      icon: <FileText className="h-4 w-4" />,
      shortcut: { key: 'c', meta: true, shift: true },
      action: () => navigate('/chat')
    },
    {
      id: 'nav.applications',
      label: 'View Applications',
      description: 'See all certification applications',
      category: 'navigation',
      keywords: ['applications', 'list', 'all'],
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate('/applications')
    },
    {
      id: 'nav.settings',
      label: 'Open Settings',
      description: 'Manage application settings',
      category: 'navigation',
      keywords: ['settings', 'preferences', 'config'],
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/settings')
    },
    {
      id: 'nav.profile',
      label: 'View Profile',
      description: 'See your user profile',
      category: 'navigation',
      keywords: ['profile', 'account', 'user'],
      icon: <User className="h-4 w-4" />,
      action: () => navigate('/profile')
    }
  ];
}

export function getActionCommands(handlers: {
  onNewApplication?: () => void;
  onUploadDocument?: () => void;
  onCertifyApplication?: () => void;
}): CommandDefinition[] {
  const commands: CommandDefinition[] = [];

  if (handlers.onNewApplication) {
    commands.push({
      id: 'action.new-application',
      label: 'New Application',
      description: 'Create a new certification application',
      category: 'actions',
      keywords: ['new', 'create', 'application', 'start'],
      icon: <Plus className="h-4 w-4" />,
      shortcut: { key: 'n', meta: true },
      action: handlers.onNewApplication
    });
  }

  if (handlers.onUploadDocument) {
    commands.push({
      id: 'action.upload-document',
      label: 'Upload Document',
      description: 'Upload a document for OCR processing',
      category: 'actions',
      keywords: ['upload', 'document', 'file', 'import'],
      icon: <Upload className="h-4 w-4" />,
      shortcut: { key: 'u', meta: true },
      action: handlers.onUploadDocument
    });
  }

  if (handlers.onCertifyApplication) {
    commands.push({
      id: 'action.certify',
      label: 'Certify Application',
      description: 'Mark application as certified',
      category: 'actions',
      keywords: ['certify', 'approve', 'complete'],
      icon: <CheckCircle2 className="h-4 w-4" />,
      action: handlers.onCertifyApplication
    });
  }

  return commands;
}

export function getSearchCommands(handlers: {
  onSearchApplications?: () => void;
  onSearchDocuments?: () => void;
  onFindInApplication?: () => void;
}): CommandDefinition[] {
  const commands: CommandDefinition[] = [];

  if (handlers.onSearchApplications) {
    commands.push({
      id: 'search.applications',
      label: 'Search Applications',
      description: 'Find certification applications',
      category: 'search',
      keywords: ['search', 'find', 'applications', 'lookup'],
      icon: <Search className="h-4 w-4" />,
      shortcut: { key: 'f', meta: true },
      action: handlers.onSearchApplications
    });
  }

  if (handlers.onSearchDocuments) {
    commands.push({
      id: 'search.documents',
      label: 'Search Documents',
      description: 'Find uploaded documents',
      category: 'search',
      keywords: ['search', 'find', 'documents', 'files'],
      icon: <Search className="h-4 w-4" />,
      action: handlers.onSearchDocuments
    });
  }

  if (handlers.onFindInApplication) {
    commands.push({
      id: 'search.in-application',
      label: 'Find in Application',
      description: 'Search within current application',
      category: 'search',
      keywords: ['find', 'search', 'current', 'application'],
      icon: <Search className="h-4 w-4" />,
      shortcut: { key: 'f', meta: true, shift: true },
      action: handlers.onFindInApplication
    });
  }

  return commands;
}

export function getHelpCommands(): CommandDefinition[] {
  return [
    {
      id: 'help.restart-tour',
      label: 'Restart Feature Tour',
      description: 'Take the guided tour of AgFin features again',
      category: 'help',
      keywords: ['tour', 'onboarding', 'help', 'guide', 'tutorial'],
      icon: <GraduationCap className="h-4 w-4" />,
      action: () => {
        const { resetTour, startTour } = useOnboardingStore.getState();
        resetTour();
        startTour();
      }
    }
  ];
}
