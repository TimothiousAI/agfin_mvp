# Implementation Plan: Command Palette Integration

**Scope**: Integrate the existing CommandPalette component into the main UI with full command support for navigation, documents, actions, and search.
**Services Affected**: client
**Estimated Steps**: 12

---

## Overview

This plan integrates the existing CommandPalette UI component (`client/src/shared/ui/CommandPalette.tsx`) into the main AppLayout, wiring it up with dynamic commands based on application state. The palette will provide quick access to document uploads, module navigation, application switching, and common actions via Cmd/Ctrl+K keyboard shortcut.

---

## Prerequisites

- [x] CommandPalette UI component exists (`client/src/shared/ui/CommandPalette.tsx`)
- [x] Command registry system exists (`client/src/shared/commands/registry.ts`)
- [x] Fuzzy search algorithm exists (`client/src/shared/commands/search.ts`)
- [x] Default commands defined (`client/src/shared/commands/default-commands.tsx`)
- [ ] AppLayout component ready for integration (`client/src/application/shell/AppLayout.tsx`)

---

## Implementation Steps

### Phase 1: Create Command Palette Hook and Context

**Step 1.1**: Create CommandPaletteProvider context for global state management
- File: `client/src/shared/commands/CommandPaletteProvider.tsx`
- Changes: Create a React context that manages command palette state, recent commands persistence, and command registration

```tsx
/**
 * CommandPaletteProvider.tsx
 *
 * Global context for command palette state management.
 * Handles recent commands persistence and command availability.
 */

import * as React from 'react';
import { CommandPalette, type Command } from '@/shared/ui/CommandPalette';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  recentCommands: string[];
  addToRecent: (commandId: string) => void;
  registerCommands: (commands: Command[]) => void;
  unregisterCommands: (commandIds: string[]) => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

const RECENT_COMMANDS_KEY = 'agfin_recent_commands';
const MAX_RECENT_COMMANDS = 5;

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [commands, setCommands] = React.useState<Map<string, Command>>(new Map());
  const [recentCommands, setRecentCommands] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist recent commands to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recentCommands));
    } catch (e) {
      console.warn('Failed to persist recent commands:', e);
    }
  }, [recentCommands]);

  const addToRecent = React.useCallback((commandId: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      return [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS);
    });
  }, []);

  const registerCommands = React.useCallback((newCommands: Command[]) => {
    setCommands(prev => {
      const updated = new Map(prev);
      newCommands.forEach(cmd => updated.set(cmd.id, cmd));
      return updated;
    });
  }, []);

  const unregisterCommands = React.useCallback((commandIds: string[]) => {
    setCommands(prev => {
      const updated = new Map(prev);
      commandIds.forEach(id => updated.delete(id));
      return updated;
    });
  }, []);

  const commandsArray = React.useMemo(() => Array.from(commands.values()), [commands]);

  const contextValue = React.useMemo(() => ({
    open,
    setOpen,
    recentCommands,
    addToRecent,
    registerCommands,
    unregisterCommands,
  }), [open, recentCommands, addToRecent, registerCommands, unregisterCommands]);

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandPalette
        commands={commandsArray}
        recentCommands={recentCommands}
        placeholder="Search commands..."
      />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}
```

**Step 1.2**: Create useCommandRegistration hook for component-level command registration
- File: `client/src/shared/commands/useCommandRegistration.ts`
- Changes: Hook that registers/unregisters commands when component mounts/unmounts

```tsx
/**
 * useCommandRegistration.ts
 *
 * Hook for registering commands at component level.
 * Commands are automatically unregistered on unmount.
 */

import { useEffect, useMemo } from 'react';
import type { Command } from '@/shared/ui/CommandPalette';
import { useCommandPalette } from './CommandPaletteProvider';

export function useCommandRegistration(
  commands: Command[],
  deps: React.DependencyList = []
) {
  const { registerCommands, unregisterCommands, addToRecent } = useCommandPalette();

  // Wrap commands with recent tracking
  const wrappedCommands = useMemo(() => {
    return commands.map(cmd => ({
      ...cmd,
      onSelect: () => {
        addToRecent(cmd.id);
        cmd.onSelect();
      }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToRecent, ...deps]);

  useEffect(() => {
    registerCommands(wrappedCommands);
    return () => {
      unregisterCommands(wrappedCommands.map(cmd => cmd.id));
    };
  }, [wrappedCommands, registerCommands, unregisterCommands]);
}
```

**Validation**:
```bash
cd client && npx tsc --noEmit
```

---

### Phase 2: Document Commands

**Step 2.1**: Create document-specific commands
- File: `client/src/shared/commands/document-commands.tsx`
- Changes: Define commands for each document type slot upload

```tsx
/**
 * document-commands.tsx
 *
 * Commands for document upload slots.
 * Each document type gets its own upload command.
 */

import * as React from 'react';
import { Upload, FileText, CreditCard, Landmark, Calculator, Shield, FileCheck } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

export type DocumentType =
  | 'drivers_license'
  | 'schedule_f'
  | 'organization_docs'
  | 'balance_sheet'
  | 'fsa_578'
  | 'current_crop_insurance'
  | 'prior_crop_insurance'
  | 'lease_agreement'
  | 'equipment_list';

interface DocumentCommandConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  required: boolean;
}

const DOCUMENT_CONFIGS: DocumentCommandConfig[] = [
  {
    type: 'drivers_license',
    label: "Upload Driver's License",
    description: 'Government-issued photo identification',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['id', 'identification', 'photo', 'license', 'dl'],
    required: true,
  },
  {
    type: 'schedule_f',
    label: 'Upload Schedule F',
    description: 'IRS Schedule F - Profit or Loss from Farming',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['tax', 'irs', 'profit', 'loss', 'farming', 'schedule'],
    required: true,
  },
  {
    type: 'organization_docs',
    label: 'Upload Organization Documents',
    description: 'LLC, corporation, or partnership documents',
    icon: <Landmark className="h-4 w-4" />,
    keywords: ['llc', 'corp', 'partnership', 'articles', 'incorporation', 'entity'],
    required: true,
  },
  {
    type: 'balance_sheet',
    label: 'Upload Balance Sheet',
    description: 'Current financial statement of assets and liabilities',
    icon: <Calculator className="h-4 w-4" />,
    keywords: ['financial', 'assets', 'liabilities', 'statement', 'balance'],
    required: true,
  },
  {
    type: 'fsa_578',
    label: 'Upload FSA-578 Form',
    description: 'USDA Farm Service Agency application form',
    icon: <FileCheck className="h-4 w-4" />,
    keywords: ['usda', 'fsa', 'farm', 'service', 'agency', '578'],
    required: true,
  },
  {
    type: 'current_crop_insurance',
    label: 'Upload Current Crop Insurance',
    description: 'Active crop insurance policy documentation',
    icon: <Shield className="h-4 w-4" />,
    keywords: ['insurance', 'crop', 'policy', 'current', 'coverage'],
    required: true,
  },
  {
    type: 'prior_crop_insurance',
    label: 'Upload Prior Year Crop Insurance',
    description: 'Previous year crop insurance records',
    icon: <Shield className="h-4 w-4" />,
    keywords: ['insurance', 'crop', 'prior', 'previous', 'last year'],
    required: false,
  },
  {
    type: 'lease_agreement',
    label: 'Upload Lease Agreement',
    description: 'Land or equipment lease contracts',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['lease', 'rent', 'agreement', 'contract', 'land'],
    required: false,
  },
  {
    type: 'equipment_list',
    label: 'Upload Equipment List',
    description: 'Inventory of farm machinery and equipment',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['equipment', 'machinery', 'inventory', 'tractor', 'farm'],
    required: false,
  },
];

interface GetDocumentCommandsOptions {
  onUploadDocument: (documentType: DocumentType) => void;
  /** Document types that have already been uploaded */
  uploadedDocuments?: DocumentType[];
  /** Whether an application is currently selected */
  hasActiveApplication?: boolean;
}

export function getDocumentCommands({
  onUploadDocument,
  uploadedDocuments = [],
  hasActiveApplication = false,
}: GetDocumentCommandsOptions): Command[] {
  return DOCUMENT_CONFIGS.map(config => ({
    id: `doc.upload.${config.type}`,
    label: config.label,
    description: uploadedDocuments.includes(config.type)
      ? `${config.description} (Already uploaded)`
      : config.description + (config.required ? ' (Required)' : ''),
    group: 'actions' as const,
    keywords: ['upload', 'document', ...config.keywords],
    icon: config.icon,
    onSelect: () => {
      if (!hasActiveApplication) {
        console.warn('No active application selected');
        return;
      }
      onUploadDocument(config.type);
    },
  }));
}

export { DOCUMENT_CONFIGS };
```

**Validation**:
```bash
cd client && npx tsc --noEmit
```

---

### Phase 3: Navigation Commands

**Step 3.1**: Create module navigation commands
- File: `client/src/shared/commands/module-commands.tsx`
- Changes: Define commands for navigating to each data module (M1-M5)

```tsx
/**
 * module-commands.tsx
 *
 * Commands for navigating to data modules M1-M5.
 */

import * as React from 'react';
import { User, Map, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface ModuleConfig {
  number: number;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    number: 1,
    name: 'Identity & Entity',
    shortName: 'M1',
    description: 'Applicant identification and entity information',
    icon: <User className="h-4 w-4" />,
    keywords: ['identity', 'entity', 'applicant', 'name', 'ssn', 'address', 'm1'],
  },
  {
    number: 2,
    name: 'Lands Farmed',
    shortName: 'M2',
    description: 'Land tracts, acreage, and ownership details',
    icon: <Map className="h-4 w-4" />,
    keywords: ['lands', 'farm', 'acres', 'tract', 'property', 'ownership', 'm2'],
  },
  {
    number: 3,
    name: 'Financial Statement',
    shortName: 'M3',
    description: 'Assets, liabilities, and financial position',
    icon: <DollarSign className="h-4 w-4" />,
    keywords: ['financial', 'assets', 'liabilities', 'balance', 'statement', 'm3'],
  },
  {
    number: 4,
    name: 'Projected Operations',
    shortName: 'M4',
    description: 'Crop plans, expenses, and loan request',
    icon: <TrendingUp className="h-4 w-4" />,
    keywords: ['operations', 'crop', 'expenses', 'loan', 'projected', 'm4'],
  },
  {
    number: 5,
    name: 'Summary & Ratios',
    shortName: 'M5',
    description: 'Financial ratios and loan decision summary',
    icon: <Calculator className="h-4 w-4" />,
    keywords: ['summary', 'ratios', 'dscr', 'decision', 'final', 'm5'],
  },
];

interface ModuleCompletionInfo {
  moduleNumber: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface GetModuleCommandsOptions {
  onNavigateToModule: (moduleNumber: number) => void;
  /** Module completion status from application */
  moduleCompletion?: ModuleCompletionInfo[];
  /** Whether an application is currently selected */
  hasActiveApplication?: boolean;
  /** Currently active module number */
  activeModule?: number;
}

export function getModuleCommands({
  onNavigateToModule,
  moduleCompletion = [],
  hasActiveApplication = false,
  activeModule,
}: GetModuleCommandsOptions): Command[] {
  return MODULE_CONFIGS.map(config => {
    const completion = moduleCompletion.find(m => m.moduleNumber === config.number);
    const isActive = activeModule === config.number;

    let description = config.description;
    if (completion) {
      const status = completion.isComplete
        ? 'Complete'
        : `${Math.round(completion.completionPercentage)}% complete`;
      description = `${description} (${status})`;
    }
    if (isActive) {
      description = `${description} - Currently viewing`;
    }

    return {
      id: `nav.module.${config.number}`,
      label: `Go to ${config.shortName}: ${config.name}`,
      description,
      group: 'navigation' as const,
      keywords: ['go', 'navigate', 'module', ...config.keywords],
      icon: config.icon,
      onSelect: () => {
        if (!hasActiveApplication) {
          console.warn('No active application selected');
          return;
        }
        onNavigateToModule(config.number);
      },
    };
  });
}

export { MODULE_CONFIGS };
```

**Step 3.2**: Create application switching commands
- File: `client/src/shared/commands/application-commands.tsx`
- Changes: Define commands for switching between applications

```tsx
/**
 * application-commands.tsx
 *
 * Commands for application management and switching.
 */

import * as React from 'react';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, Lock } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface ApplicationSummary {
  id: string;
  farmerName: string;
  status: 'draft' | 'awaiting_documents' | 'awaiting_audit' | 'certified' | 'locked';
  updatedAt: Date;
}

const STATUS_ICONS: Record<ApplicationSummary['status'], React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  awaiting_documents: <AlertTriangle className="h-4 w-4" />,
  awaiting_audit: <FileText className="h-4 w-4" />,
  certified: <CheckCircle className="h-4 w-4" />,
  locked: <Lock className="h-4 w-4" />,
};

const STATUS_LABELS: Record<ApplicationSummary['status'], string> = {
  draft: 'Draft',
  awaiting_documents: 'Awaiting Documents',
  awaiting_audit: 'Awaiting Audit',
  certified: 'Certified',
  locked: 'Locked',
};

interface GetApplicationCommandsOptions {
  applications: ApplicationSummary[];
  activeApplicationId?: string;
  onSelectApplication: (applicationId: string) => void;
  onCreateApplication: () => void;
}

export function getApplicationCommands({
  applications,
  activeApplicationId,
  onSelectApplication,
  onCreateApplication,
}: GetApplicationCommandsOptions): Command[] {
  const commands: Command[] = [
    {
      id: 'app.new',
      label: 'New Application',
      description: 'Create a new loan application',
      group: 'actions' as const,
      keywords: ['new', 'create', 'application', 'start', 'loan'],
      icon: <Plus className="h-4 w-4" />,
      onSelect: onCreateApplication,
    },
  ];

  // Add switch commands for each application
  applications.forEach(app => {
    const isActive = app.id === activeApplicationId;
    const timeAgo = formatTimeAgo(app.updatedAt);

    commands.push({
      id: `app.switch.${app.id}`,
      label: `Switch to: ${app.farmerName}`,
      description: `${STATUS_LABELS[app.status]} - Updated ${timeAgo}${isActive ? ' (Current)' : ''}`,
      group: 'navigation' as const,
      keywords: ['switch', 'application', app.farmerName.toLowerCase(), 'open'],
      icon: STATUS_ICONS[app.status],
      onSelect: () => {
        if (!isActive) {
          onSelectApplication(app.id);
        }
      },
    });
  });

  return commands;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
```

**Validation**:
```bash
cd client && npx tsc --noEmit
```

---

### Phase 4: Search and Action Commands

**Step 4.1**: Create search commands
- File: `client/src/shared/commands/search-commands.tsx`
- Changes: Define commands for searching within the application

```tsx
/**
 * search-commands.tsx
 *
 * Commands for search functionality.
 */

import * as React from 'react';
import { Search, FileSearch, Users } from 'lucide-react';
import type { Command } from '@/shared/ui/CommandPalette';

interface GetSearchCommandsOptions {
  onSearchApplications: () => void;
  onSearchDocuments: () => void;
  onFindInCurrentApplication: () => void;
  hasActiveApplication?: boolean;
}

export function getSearchCommands({
  onSearchApplications,
  onSearchDocuments,
  onFindInCurrentApplication,
  hasActiveApplication = false,
}: GetSearchCommandsOptions): Command[] {
  const commands: Command[] = [
    {
      id: 'search.applications',
      label: 'Search Applications',
      description: 'Find loan applications by farmer name or status',
      group: 'actions' as const,
      keywords: ['search', 'find', 'applications', 'lookup', 'farmer'],
      icon: <Users className="h-4 w-4" />,
      onSelect: onSearchApplications,
    },
    {
      id: 'search.documents',
      label: 'Search Documents',
      description: 'Find uploaded documents across all applications',
      group: 'actions' as const,
      keywords: ['search', 'find', 'documents', 'files', 'uploaded'],
      icon: <FileSearch className="h-4 w-4" />,
      onSelect: onSearchDocuments,
    },
  ];

  if (hasActiveApplication) {
    commands.push({
      id: 'search.current',
      label: 'Find in Current Application',
      description: 'Search within the current application data',
      group: 'actions' as const,
      keywords: ['find', 'search', 'current', 'application', 'data'],
      icon: <Search className="h-4 w-4" />,
      onSelect: onFindInCurrentApplication,
    });
  }

  return commands;
}
```

**Step 4.2**: Create action commands
- File: `client/src/shared/commands/action-commands.tsx`
- Changes: Define commands for common actions

```tsx
/**
 * action-commands.tsx
 *
 * Commands for common application actions.
 */

import * as React from 'react';
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
```

**Validation**:
```bash
cd client && npx tsc --noEmit
```

---

### Phase 5: Update CommandPalette Component

**Step 5.1**: Enhance CommandPalette to support controlled open state
- File: `client/src/shared/ui/CommandPalette.tsx`
- Changes: Add controlled mode support and export internal state setter

```tsx
// Add to existing CommandPaletteProps interface:
interface CommandPaletteProps {
  commands: Command[]
  recentCommands?: string[]
  placeholder?: string
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
}

// Update the component to support controlled mode:
export function CommandPalette({
  commands,
  recentCommands = [],
  placeholder = "Search commands...",
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])

  // ... rest of component remains the same
```

**Step 5.2**: Add category support for 'documents' group
- File: `client/src/shared/ui/CommandPalette.tsx`
- Changes: Update Command interface and filtering to support 'documents' category

```tsx
// Update Command interface:
export interface Command {
  id: string
  label: string
  description?: string
  group: 'navigation' | 'actions' | 'recent' | 'documents'
  keywords?: string[]
  onSelect: () => void
  icon?: React.ReactNode
}

// Update filteredCommands to handle documents:
const filteredCommands = React.useMemo(() => {
  const recent = commands.filter(cmd =>
    recentCommands.includes(cmd.id) &&
    (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
  ).map(cmd => ({ ...cmd, group: 'recent' as const }))

  const navigation = commands.filter(cmd =>
    cmd.group === 'navigation' &&
    !recentCommands.includes(cmd.id) &&
    (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
  )

  const documents = commands.filter(cmd =>
    cmd.group === 'documents' &&
    !recentCommands.includes(cmd.id) &&
    (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
  )

  const actions = commands.filter(cmd =>
    cmd.group === 'actions' &&
    !recentCommands.includes(cmd.id) &&
    (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
  )

  return { recent, navigation, documents, actions }
}, [commands, recentCommands, search])

// Update allResults to include documents:
const allResults = [
  ...filteredCommands.recent,
  ...filteredCommands.navigation,
  ...filteredCommands.documents,
  ...filteredCommands.actions
]

// Update render to include Documents group:
{renderGroup('Recent', filteredCommands.recent, 0)}
{renderGroup('Navigation', filteredCommands.navigation, filteredCommands.recent.length)}
{renderGroup('Documents', filteredCommands.documents, filteredCommands.recent.length + filteredCommands.navigation.length)}
{renderGroup('Actions', filteredCommands.actions, filteredCommands.recent.length + filteredCommands.navigation.length + filteredCommands.documents.length)}
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

### Phase 6: Integration with AppLayout

**Step 6.1**: Create useAppCommands hook to aggregate all commands
- File: `client/src/application/shell/useAppCommands.ts`
- Changes: Hook that combines all command sources with application state

```tsx
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
```

**Step 6.2**: Mount CommandPaletteProvider in App.tsx
- File: `client/src/App.tsx`
- Changes: Wrap the app with CommandPaletteProvider

```tsx
// Add import at top of file:
import { CommandPaletteProvider } from './shared/commands/CommandPaletteProvider';

// Wrap BrowserRouter content with CommandPaletteProvider:
function App() {
  // ... existing code ...

  return (
    <AnnouncerProvider>
      <CommandPaletteProvider>
        <BrowserRouter>
          <SkipLinks />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* ... existing routes ... */}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CommandPaletteProvider>
    </AnnouncerProvider>
  );
}
```

**Step 6.3**: Register commands in ChatPage component
- File: `client/src/App.tsx`
- Changes: Use useAppCommands and useCommandRegistration in ChatPage

```tsx
// Add imports:
import { useCommandRegistration } from './shared/commands/useCommandRegistration';
import { useAppCommands } from './application/shell/useAppCommands';

// Inside ChatPage component, before return:
const ChatPage = memo(function ChatPage() {
  // ... existing code ...

  // Get application-specific commands
  const commands = useAppCommands({
    applicationId: '1', // Would come from actual app state
    applications: mockSessions.map(s => ({
      id: s.id,
      farmerName: s.title,
      status: 'draft' as const,
      updatedAt: s.timestamp,
    })),
    activeModule: 1,
    onUploadDocument: (type) => {
      console.log('Upload document:', type);
      // Trigger document upload UI
    },
    onNavigateToModule: (moduleNumber) => {
      console.log('Navigate to module:', moduleNumber);
      // Update artifact panel to show module form
    },
    onSelectApplication: (id) => {
      console.log('Select application:', id);
      // Switch to selected application
    },
    onCreateApplication: () => {
      console.log('Create new application');
      // Open new application flow
    },
  });

  // Register commands
  useCommandRegistration(commands, []);

  // ... rest of component ...
});
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

### Phase 7: Export Commands Index

**Step 7.1**: Create index file for commands module
- File: `client/src/shared/commands/index.ts`
- Changes: Export all command-related utilities

```tsx
/**
 * Commands Module Index
 *
 * Exports all command-related utilities for the application.
 */

// Provider and hooks
export { CommandPaletteProvider, useCommandPalette } from './CommandPaletteProvider';
export { useCommandRegistration } from './useCommandRegistration';

// Command generators
export { getDocumentCommands, DOCUMENT_CONFIGS, type DocumentType } from './document-commands';
export { getModuleCommands, MODULE_CONFIGS } from './module-commands';
export { getApplicationCommands } from './application-commands';
export { getSearchCommands } from './search-commands';
export { getActionCommands } from './action-commands';

// Registry (for advanced use cases)
export {
  commandRegistry,
  registerCommand,
  registerCommands,
  executeCommand,
  getCommand,
  getAllCommands,
  getAvailableCommands,
  type CommandDefinition,
  type CommandCategory,
  type CommandShortcut,
  type RegisteredCommand,
} from './registry';

// Search utilities
export {
  searchCommands,
  highlightMatches,
  getHighlightRanges,
  type SearchResult,
  type SearchMatch,
} from './search';

// Navigation shortcuts
export {
  getNavigationShortcuts,
  NAVIGATION_SHORTCUT_LABELS,
  NAVIGATION_CATEGORIES,
  isValidModuleNumber,
  formatModuleShortcut,
} from './navigationShortcuts';
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

## Acceptance Criteria

- [ ] Command palette opens with Cmd/Ctrl+K keyboard shortcut
- [ ] Fuzzy search filters commands as user types
- [ ] Recent commands section shows last 5 used commands
- [ ] Recent commands persist across page refreshes (localStorage)
- [ ] Document upload commands show for each document type (9 types)
- [ ] Module navigation commands show M1-M5 with completion status
- [ ] Application switching commands show available applications
- [ ] Commands are dynamically available based on application state
- [ ] Keyboard navigation works (Arrow Up/Down, Enter, Escape)
- [ ] Focus is trapped within palette when open
- [ ] Palette closes on command selection
- [ ] Palette closes on Escape key
- [ ] Palette closes on click outside
- [ ] Selected command is visually highlighted
- [ ] Command descriptions update to show current status

---

## Final Validation

```bash
# Run full client validation
cd client && npm run build && npm run lint && npx tsc --noEmit

# Manual testing steps:
# 1. Open http://localhost:5173/chat
# 2. Press Cmd/Ctrl+K to open command palette
# 3. Type "schedule" and verify Schedule F upload command appears
# 4. Type "m1" and verify Module 1 navigation command appears
# 5. Use arrow keys to navigate, Enter to select
# 6. Press Escape to close
# 7. Verify recent commands persist after page refresh
```

---

## Notes

1. **Type Safety**: All command types are strictly typed. The `Command` interface is shared between the UI component and command generators.

2. **Performance**: Commands are memoized in `useAppCommands` and only recalculated when dependencies change. The `useCommandRegistration` hook handles cleanup on unmount.

3. **Accessibility**: The CommandPalette component already includes:
   - Screen reader accessible title
   - Keyboard navigation (Arrow keys, Enter, Escape)
   - Focus management
   - ARIA attributes

4. **Future Enhancements**:
   - Add command shortcuts display in palette
   - Add command categories/sections in search results
   - Add command history beyond recent (full audit log)
   - Add voice command support
   - Add command aliases

5. **Integration Points**: The command palette integrates with:
   - `usePanelStore` for artifact panel control
   - React Router for navigation
   - Application state for dynamic availability
   - localStorage for persistence
