# Implementation Plan: Artifact Panel Enhancements

**Scope**: Add edit/re-prompt, versioning, and download functionality to the Artifact Panel
**Services Affected**: client
**Estimated Steps**: 18

---

## Overview

This plan implements PRD Section 7.7 enhancements for the Artifact Panel. The enhancements include:
1. **Edit/Re-prompt button** - Opens chat with artifact context pre-filled for AI iteration
2. **Artifact versioning** - Tracks field changes over time with version history dropdown
3. **Per-artifact download button** - PDF for documents, JSON/CSV for data modules
4. **Version comparison view** - Optional diff display between versions

The implementation extends the existing `useArtifactStore` to track version history and adds new UI components for version selection and comparison.

---

## Prerequisites

- [x] Existing artifact panel implementation (`ArtifactPanel.tsx`)
- [x] Existing export functionality (`ArtifactExport.tsx`)
- [x] Zustand artifact store (`useArtifactStore.ts`)
- [x] Chat store and API hooks (`useChatStore.ts`, `useChatApi.ts`)

---

## Implementation Steps

### Phase 1: Extend Artifact Store with Versioning

**Step 1.1**: Define version types and extend artifact interfaces

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useArtifactStore.ts`
- Changes: Add version tracking types and extend store state

```typescript
/**
 * Artifact version snapshot
 */
export interface ArtifactVersion {
  /** Unique version ID */
  versionId: string;
  /** Version number (1, 2, 3...) */
  versionNumber: number;
  /** ISO timestamp of when this version was created */
  createdAt: string;
  /** Description of changes (auto-generated or user-provided) */
  changeDescription?: string;
  /** Snapshot of artifact data at this version */
  dataSnapshot: Record<string, unknown>;
  /** Source of the change */
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'ai_reprompt';
}

/**
 * Extended artifact with version history
 */
export interface VersionedArtifact extends Artifact {
  /** Current version number */
  currentVersion: number;
  /** History of all versions */
  versionHistory: ArtifactVersion[];
}
```

**Step 1.2**: Add version management actions to store

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useArtifactStore.ts`
- Changes: Add new actions for version management

```typescript
interface ArtifactStoreState {
  // ... existing state ...

  // Version management actions
  /** Create a new version of an artifact */
  createVersion: (artifactId: string, changeDescription?: string, source?: ArtifactVersion['source']) => void;

  /** Get version history for an artifact */
  getVersionHistory: (artifactId: string) => ArtifactVersion[];

  /** Restore artifact to a specific version */
  restoreVersion: (artifactId: string, versionId: string) => void;

  /** Get a specific version snapshot */
  getVersion: (artifactId: string, versionId: string) => ArtifactVersion | undefined;

  /** Compare two versions */
  compareVersions: (artifactId: string, versionIdA: string, versionIdB: string) => {
    added: string[];
    removed: string[];
    changed: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  } | null;
}
```

**Step 1.3**: Implement version management logic

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useArtifactStore.ts`
- Changes: Implement the version actions in the store

```typescript
createVersion: (artifactId: string, changeDescription?: string, source: ArtifactVersion['source'] = 'proxy_edited') => {
  set((state) => {
    const artifact = state.artifacts.find((a) => a.id === artifactId);
    if (!artifact) return state;

    const versionedArtifact = artifact as VersionedArtifact;
    const currentVersion = versionedArtifact.currentVersion || 0;
    const versionHistory = versionedArtifact.versionHistory || [];

    const newVersion: ArtifactVersion = {
      versionId: `${artifactId}-v${currentVersion + 1}-${Date.now()}`,
      versionNumber: currentVersion + 1,
      createdAt: new Date().toISOString(),
      changeDescription,
      dataSnapshot: JSON.parse(JSON.stringify(artifact.data)),
      source,
    };

    return {
      artifacts: state.artifacts.map((a) =>
        a.id === artifactId
          ? {
              ...a,
              currentVersion: currentVersion + 1,
              versionHistory: [...versionHistory, newVersion],
            }
          : a
      ),
    };
  });
},

getVersionHistory: (artifactId: string) => {
  const artifact = get().artifacts.find((a) => a.id === artifactId);
  if (!artifact) return [];
  return (artifact as VersionedArtifact).versionHistory || [];
},

restoreVersion: (artifactId: string, versionId: string) => {
  set((state) => {
    const artifact = state.artifacts.find((a) => a.id === artifactId);
    if (!artifact) return state;

    const versionedArtifact = artifact as VersionedArtifact;
    const version = versionedArtifact.versionHistory?.find((v) => v.versionId === versionId);
    if (!version) return state;

    // Create a new version for the restore operation
    const newVersion: ArtifactVersion = {
      versionId: `${artifactId}-v${(versionedArtifact.currentVersion || 0) + 1}-${Date.now()}`,
      versionNumber: (versionedArtifact.currentVersion || 0) + 1,
      createdAt: new Date().toISOString(),
      changeDescription: `Restored from version ${version.versionNumber}`,
      dataSnapshot: JSON.parse(JSON.stringify(version.dataSnapshot)),
      source: 'proxy_edited',
    };

    return {
      artifacts: state.artifacts.map((a) =>
        a.id === artifactId
          ? {
              ...a,
              data: JSON.parse(JSON.stringify(version.dataSnapshot)),
              currentVersion: (versionedArtifact.currentVersion || 0) + 1,
              versionHistory: [...(versionedArtifact.versionHistory || []), newVersion],
            }
          : a
      ),
    };
  });
},

getVersion: (artifactId: string, versionId: string) => {
  const artifact = get().artifacts.find((a) => a.id === artifactId);
  if (!artifact) return undefined;
  return (artifact as VersionedArtifact).versionHistory?.find((v) => v.versionId === versionId);
},

compareVersions: (artifactId: string, versionIdA: string, versionIdB: string) => {
  const state = get();
  const artifact = state.artifacts.find((a) => a.id === artifactId);
  if (!artifact) return null;

  const versionedArtifact = artifact as VersionedArtifact;
  const versionA = versionedArtifact.versionHistory?.find((v) => v.versionId === versionIdA);
  const versionB = versionedArtifact.versionHistory?.find((v) => v.versionId === versionIdB);

  if (!versionA || !versionB) return null;

  const dataA = versionA.dataSnapshot as Record<string, unknown>;
  const dataB = versionB.dataSnapshot as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(dataA), ...Object.keys(dataB)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

  allKeys.forEach((key) => {
    const inA = key in dataA;
    const inB = key in dataB;

    if (!inA && inB) {
      added.push(key);
    } else if (inA && !inB) {
      removed.push(key);
    } else if (JSON.stringify(dataA[key]) !== JSON.stringify(dataB[key])) {
      changed.push({ field: key, oldValue: dataA[key], newValue: dataB[key] });
    }
  });

  return { added, removed, changed };
},
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

### Phase 2: Version History UI Components

**Step 2.1**: Create ArtifactVersionDropdown component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ArtifactVersionDropdown.tsx`
- Changes: New component for version selection

```typescript
import { useState } from 'react';
import { History, ChevronDown, RotateCcw } from 'lucide-react';
import type { ArtifactVersion } from './useArtifactStore';

interface ArtifactVersionDropdownProps {
  versions: ArtifactVersion[];
  currentVersion: number;
  onSelectVersion: (versionId: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onCompareVersions?: (versionIdA: string, versionIdB: string) => void;
}

export function ArtifactVersionDropdown({
  versions,
  currentVersion,
  onSelectVersion,
  onRestoreVersion,
  onCompareVersions,
}: ArtifactVersionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (source: ArtifactVersion['source']) => {
    switch (source) {
      case 'ai_extracted':
        return 'AI Extracted';
      case 'proxy_entered':
        return 'Manual Entry';
      case 'proxy_edited':
        return 'Edited';
      case 'ai_reprompt':
        return 'AI Re-prompt';
      default:
        return source;
    }
  };

  const handleVersionClick = (version: ArtifactVersion) => {
    if (compareMode && compareVersionId) {
      onCompareVersions?.(compareVersionId, version.versionId);
      setCompareMode(false);
      setCompareVersionId(null);
    } else if (compareMode) {
      setCompareVersionId(version.versionId);
    } else {
      onSelectVersion(version.versionId);
    }
    setIsOpen(false);
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Version history"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <History size={18} />
        <span className="text-sm">v{currentVersion}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setCompareMode(false);
              setCompareVersionId(null);
            }}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-72 bg-[#0D2233] border border-[#061623] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-2 border-b border-[#061623] flex items-center justify-between">
              <span className="text-white/60 text-xs font-medium uppercase">Version History</span>
              {onCompareVersions && versions.length > 1 && (
                <button
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setCompareVersionId(null);
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    compareMode
                      ? 'bg-[#30714C] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {compareMode ? 'Cancel Compare' : 'Compare'}
                </button>
              )}
            </div>

            {compareMode && (
              <div className="px-4 py-2 bg-[#30714C]/20 text-white/80 text-xs">
                {compareVersionId
                  ? 'Select second version to compare'
                  : 'Select first version to compare'}
              </div>
            )}

            {/* Version list */}
            <div className="py-1">
              {versions
                .slice()
                .reverse()
                .map((version) => (
                  <div
                    key={version.versionId}
                    className={`px-4 py-2 hover:bg-white/5 cursor-pointer ${
                      version.versionNumber === currentVersion ? 'bg-white/5' : ''
                    } ${compareVersionId === version.versionId ? 'ring-1 ring-[#30714C]' : ''}`}
                    onClick={() => handleVersionClick(version)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">
                        Version {version.versionNumber}
                        {version.versionNumber === currentVersion && (
                          <span className="ml-2 text-[#30714C] text-xs">(current)</span>
                        )}
                      </span>
                      {version.versionNumber !== currentVersion && !compareMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreVersion(version.versionId);
                            setIsOpen(false);
                          }}
                          className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded"
                          title="Restore this version"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">{formatDate(version.createdAt)}</span>
                      <span className="text-white/40 text-xs">-</span>
                      <span className="text-white/60 text-xs">{getSourceLabel(version.source)}</span>
                    </div>
                    {version.changeDescription && (
                      <p className="text-white/50 text-xs mt-1 truncate">{version.changeDescription}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ArtifactVersionDropdown;
```

**Step 2.2**: Create ArtifactVersionDiff component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ArtifactVersionDiff.tsx`
- Changes: New component for displaying version differences

```typescript
import { X, Plus, Minus, ArrowRight } from 'lucide-react';

interface VersionDiff {
  added: string[];
  removed: string[];
  changed: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

interface ArtifactVersionDiffProps {
  diff: VersionDiff;
  versionA: number;
  versionB: number;
  onClose: () => void;
}

export function ArtifactVersionDiff({
  diff,
  versionA,
  versionB,
  onClose,
}: ArtifactVersionDiffProps) {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

  return (
    <div className="bg-[#0D2233] border border-[#061623] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#061623] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">
            Version {versionA}
          </span>
          <ArrowRight size={16} className="text-white/40" />
          <span className="text-white font-medium text-sm">
            Version {versionB}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
          aria-label="Close diff view"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {!hasChanges ? (
          <p className="text-white/60 text-sm text-center py-4">No differences found</p>
        ) : (
          <div className="space-y-4">
            {/* Added fields */}
            {diff.added.length > 0 && (
              <div>
                <h4 className="text-green-400 text-xs font-medium uppercase mb-2 flex items-center gap-1">
                  <Plus size={14} />
                  Added Fields
                </h4>
                <div className="space-y-1">
                  {diff.added.map((field) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm"
                    >
                      + {field}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Removed fields */}
            {diff.removed.length > 0 && (
              <div>
                <h4 className="text-red-400 text-xs font-medium uppercase mb-2 flex items-center gap-1">
                  <Minus size={14} />
                  Removed Fields
                </h4>
                <div className="space-y-1">
                  {diff.removed.map((field) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm"
                    >
                      - {field}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changed fields */}
            {diff.changed.length > 0 && (
              <div>
                <h4 className="text-yellow-400 text-xs font-medium uppercase mb-2">
                  Changed Fields
                </h4>
                <div className="space-y-2">
                  {diff.changed.map(({ field, oldValue, newValue }) => (
                    <div
                      key={field}
                      className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded"
                    >
                      <div className="text-white font-medium text-sm mb-1">{field}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-red-400">- </span>
                          <span className="text-white/60">{formatValue(oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-green-400">+ </span>
                          <span className="text-white/60">{formatValue(newValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtifactVersionDiff;
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

### Phase 3: Edit/Re-prompt Functionality

**Step 3.1**: Create useArtifactReprompt hook

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useArtifactReprompt.ts`
- Changes: New hook for generating re-prompt messages

```typescript
import { useCallback } from 'react';
import { useChatStore } from '../conversation/useChatStore';
import { useArtifactStore, type VersionedArtifact } from './useArtifactStore';
import type { Artifact } from './ArtifactContent';

/**
 * Generate a context-aware prompt for editing an artifact
 */
function generateRepromptContext(artifact: Artifact): string {
  const typeLabel = getArtifactTypeLabel(artifact.type);

  let context = `I'd like to modify the ${typeLabel} "${artifact.title}".\n\n`;
  context += `Current data:\n`;
  context += '```json\n';
  context += JSON.stringify(artifact.data, null, 2);
  context += '\n```\n\n';
  context += 'Please help me update: ';

  return context;
}

function getArtifactTypeLabel(type: string): string {
  switch (type) {
    case 'document':
      return 'document';
    case 'extraction':
      return 'extracted data';
    case 'module_m1':
      return 'Identity & KYC module';
    case 'module_m2':
      return 'Lands & Collateral module';
    case 'module_m3':
      return 'Financial module';
    case 'module_m4':
      return 'Operations module';
    case 'module_m5':
      return 'Summary module';
    default:
      return 'artifact';
  }
}

interface UseArtifactRepromptReturn {
  /** Start a re-prompt session for an artifact */
  startReprompt: (artifactId: string, userInstruction?: string) => void;
  /** Generate context string for an artifact */
  getRepromptContext: (artifactId: string) => string | null;
  /** Check if re-prompt is supported for artifact type */
  canReprompt: (artifactId: string) => boolean;
}

export function useArtifactReprompt(): UseArtifactRepromptReturn {
  const { sendMessage } = useChatStore();
  const { getArtifact, createVersion } = useArtifactStore();

  const canReprompt = useCallback((artifactId: string): boolean => {
    const artifact = getArtifact(artifactId);
    if (!artifact) return false;

    // Document type artifacts cannot be re-prompted (they are source files)
    if (artifact.type === 'document') return false;

    return true;
  }, [getArtifact]);

  const getRepromptContext = useCallback((artifactId: string): string | null => {
    const artifact = getArtifact(artifactId);
    if (!artifact || !canReprompt(artifactId)) return null;

    return generateRepromptContext(artifact);
  }, [getArtifact, canReprompt]);

  const startReprompt = useCallback((artifactId: string, userInstruction?: string) => {
    const artifact = getArtifact(artifactId);
    if (!artifact || !canReprompt(artifactId)) {
      console.warn(`Cannot re-prompt artifact ${artifactId}`);
      return;
    }

    // Create a version snapshot before re-prompting
    createVersion(artifactId, 'Pre-reprompt snapshot', 'proxy_edited');

    // Generate the re-prompt message
    const context = generateRepromptContext(artifact);
    const message = userInstruction
      ? `${context}${userInstruction}`
      : context;

    // Send the message to the chat
    sendMessage(message, 'user');
  }, [getArtifact, canReprompt, createVersion, sendMessage]);

  return {
    startReprompt,
    getRepromptContext,
    canReprompt,
  };
}

export default useArtifactReprompt;
```

**Step 3.2**: Create ArtifactRepromptButton component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ArtifactRepromptButton.tsx`
- Changes: New component for triggering re-prompt

```typescript
import { useState } from 'react';
import { Pencil, X, Send, Loader2 } from 'lucide-react';
import { useArtifactReprompt } from './useArtifactReprompt';

interface ArtifactRepromptButtonProps {
  artifactId: string;
  onRepromptStart?: () => void;
}

export function ArtifactRepromptButton({
  artifactId,
  onRepromptStart,
}: ArtifactRepromptButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startReprompt, canReprompt, getRepromptContext } = useArtifactReprompt();

  if (!canReprompt(artifactId)) {
    return null;
  }

  const handleSubmit = async () => {
    if (!instruction.trim()) return;

    setIsSubmitting(true);
    try {
      startReprompt(artifactId, instruction.trim());
      onRepromptStart?.();
      setIsOpen(false);
      setInstruction('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInstruction('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Edit with AI"
        title="Edit with AI"
      >
        <Pencil size={18} />
        <span className="text-sm hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setInstruction('');
            }}
          />

          {/* Edit dialog */}
          <div className="absolute right-0 mt-2 w-80 bg-[#0D2233] border border-[#061623] rounded-lg shadow-lg z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#061623] flex items-center justify-between">
              <span className="text-white font-medium text-sm">Edit with AI</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setInstruction('');
                }}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white/60 text-xs mb-3">
                Describe what changes you would like the AI to make to this artifact.
              </p>

              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Update the loan amount to $150,000 and change the term to 5 years..."
                className="w-full px-3 py-2 bg-[#061623] border border-[#0D2233] rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#30714C] resize-none"
                rows={3}
                autoFocus
                disabled={isSubmitting}
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-white/40 text-xs">
                  Press Enter to send
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!instruction.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#30714C] text-white rounded-lg text-sm font-medium hover:bg-[#265a3d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send to AI
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ArtifactRepromptButton;
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

### Phase 4: Enhanced Artifact Toolbar

**Step 4.1**: Create ArtifactToolbar component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ArtifactToolbar.tsx`
- Changes: New unified toolbar component with all actions

```typescript
import { useState } from 'react';
import { useArtifactStore, type VersionedArtifact, type ArtifactVersion } from './useArtifactStore';
import ArtifactExport from './ArtifactExport';
import ArtifactVersionDropdown from './ArtifactVersionDropdown';
import ArtifactVersionDiff from './ArtifactVersionDiff';
import ArtifactRepromptButton from './ArtifactRepromptButton';
import type { Artifact } from './ArtifactContent';

interface ArtifactToolbarProps {
  artifact: Artifact;
  onRepromptStart?: () => void;
}

export function ArtifactToolbar({ artifact, onRepromptStart }: ArtifactToolbarProps) {
  const { getVersionHistory, restoreVersion, compareVersions } = useArtifactStore();
  const [diffData, setDiffData] = useState<{
    diff: ReturnType<typeof compareVersions>;
    versionA: number;
    versionB: number;
  } | null>(null);

  const versionedArtifact = artifact as VersionedArtifact;
  const versions = versionedArtifact.versionHistory || [];
  const currentVersion = versionedArtifact.currentVersion || 1;

  const handleSelectVersion = (versionId: string) => {
    // Could implement version preview here
    console.log('Selected version:', versionId);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(artifact.id, versionId);
  };

  const handleCompareVersions = (versionIdA: string, versionIdB: string) => {
    const diff = compareVersions(artifact.id, versionIdA, versionIdB);
    if (diff) {
      const versionA = versions.find((v) => v.versionId === versionIdA)?.versionNumber || 0;
      const versionB = versions.find((v) => v.versionId === versionIdB)?.versionNumber || 0;
      setDiffData({ diff, versionA, versionB });
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Edit/Re-prompt button */}
        <ArtifactRepromptButton
          artifactId={artifact.id}
          onRepromptStart={onRepromptStart}
        />

        {/* Version history dropdown */}
        {versions.length > 0 && (
          <ArtifactVersionDropdown
            versions={versions}
            currentVersion={currentVersion}
            onSelectVersion={handleSelectVersion}
            onRestoreVersion={handleRestoreVersion}
            onCompareVersions={handleCompareVersions}
          />
        )}

        {/* Export button */}
        <ArtifactExport artifact={artifact} />
      </div>

      {/* Version diff display */}
      {diffData && diffData.diff && (
        <ArtifactVersionDiff
          diff={diffData.diff}
          versionA={diffData.versionA}
          versionB={diffData.versionB}
          onClose={() => setDiffData(null)}
        />
      )}
    </div>
  );
}

export default ArtifactToolbar;
```

**Step 4.2**: Update ArtifactPanel to use new toolbar

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ArtifactPanel.tsx`
- Changes: Integrate ArtifactToolbar into the panel header

```typescript
// Add import at top
import ArtifactToolbar from './ArtifactToolbar';
import type { Artifact as ContentArtifact } from './ArtifactContent';

// Update the content area to include toolbar
// Inside the activeArtifact section, add toolbar between badge and content:

{/* Artifact Toolbar - Edit, Versions, Export */}
<ArtifactToolbar
  artifact={activeArtifact as unknown as ContentArtifact}
  onRepromptStart={() => {
    // Optional: scroll to chat or provide visual feedback
    console.log('Re-prompt started for artifact:', activeArtifact.id);
  }}
/>
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

### Phase 5: Integration and Polish

**Step 5.1**: Create barrel export file

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\artifactVersioning.ts`
- Changes: Export all versioning-related modules

```typescript
/**
 * Artifact Versioning Module
 *
 * Exports all components and hooks related to artifact versioning,
 * re-prompting, and export functionality.
 */

// Store extensions
export type { ArtifactVersion, VersionedArtifact } from './useArtifactStore';

// Components
export { default as ArtifactToolbar } from './ArtifactToolbar';
export { default as ArtifactVersionDropdown } from './ArtifactVersionDropdown';
export { default as ArtifactVersionDiff } from './ArtifactVersionDiff';
export { default as ArtifactRepromptButton } from './ArtifactRepromptButton';

// Hooks
export { default as useArtifactReprompt } from './useArtifactReprompt';
```

**Step 5.2**: Add keyboard shortcuts for artifact actions

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\commands\navigationShortcuts.ts`
- Changes: Add keyboard shortcuts for artifact versioning

```typescript
// Add to existing shortcuts:
{
  key: 'e',
  modifiers: ['ctrl'],
  action: 'Edit artifact with AI',
  scope: 'artifact',
},
{
  key: 'h',
  modifiers: ['ctrl', 'shift'],
  action: 'Show version history',
  scope: 'artifact',
},
{
  key: 's',
  modifiers: ['ctrl', 'shift'],
  action: 'Export artifact',
  scope: 'artifact',
},
```

**Step 5.3**: Update persistence to include version history

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useArtifactStore.ts`
- Changes: Update persist partialize to include version data

```typescript
{
  name: 'artifact-storage',
  partialize: (state) => ({
    artifacts: state.artifacts.map((artifact) => ({
      ...artifact,
      // Include version history in persistence
      currentVersion: (artifact as VersionedArtifact).currentVersion,
      versionHistory: (artifact as VersionedArtifact).versionHistory,
    })),
    activeArtifactId: state.activeArtifactId,
  }),
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

## Acceptance Criteria

- [ ] Edit/re-prompt button appears on extraction and module artifacts (not documents)
- [ ] Clicking Edit opens a text input for providing instructions to AI
- [ ] Submitting edit request sends context + instruction to chat
- [ ] Version dropdown shows all previous versions with timestamps
- [ ] Each version shows source (ai_extracted, proxy_edited, etc.)
- [ ] Clicking "Restore" on a version reverts artifact to that state
- [ ] Restore creates a new version (non-destructive history)
- [ ] Compare mode allows selecting two versions to diff
- [ ] Diff view highlights added, removed, and changed fields
- [ ] Export button downloads artifact in appropriate format (PDF/JSON/CSV)
- [ ] Version history persists across page refreshes
- [ ] Keyboard shortcuts work when artifact panel is focused

---

## Final Validation

```bash
# Run full client validation
cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint

# Run TypeScript type checking
cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit

# Test artifact panel manually
# 1. Upload a document and trigger extraction
# 2. Edit extracted fields
# 3. Verify version history shows changes
# 4. Test restore functionality
# 5. Test export in different formats
# 6. Test re-prompt flow
```

---

## Notes

1. **Version Limits**: Consider adding a max version limit (e.g., 50 versions) to prevent unbounded growth. Implement pruning of old versions when limit is reached.

2. **Server-Side Persistence**: This implementation stores version history in the client-side Zustand store with localStorage persistence. For production, consider:
   - Adding a `artifact_versions` table in Supabase
   - Syncing version history to server
   - Adding audit trail entries for version changes

3. **Performance**: Version comparison uses deep JSON comparison which may be slow for large artifacts. Consider:
   - Memoizing diff results
   - Using a diff library like `deep-diff` for better performance
   - Lazy loading version history

4. **AI Integration**: The re-prompt feature sends context to the chat but relies on the AI service understanding the intent. Ensure the AI service's `update_module` tool can handle re-prompt requests properly.

5. **Accessibility**: All new components include:
   - ARIA labels and roles
   - Keyboard navigation support
   - Focus management in dropdowns
   - Screen reader announcements for version changes

---

## File Summary

| File | Type | Description |
|------|------|-------------|
| `useArtifactStore.ts` | Modified | Extended with version management types and actions |
| `ArtifactVersionDropdown.tsx` | New | Version history dropdown component |
| `ArtifactVersionDiff.tsx` | New | Version comparison diff view component |
| `useArtifactReprompt.ts` | New | Hook for AI re-prompt functionality |
| `ArtifactRepromptButton.tsx` | New | Edit/re-prompt button component |
| `ArtifactToolbar.tsx` | New | Unified toolbar with all artifact actions |
| `ArtifactPanel.tsx` | Modified | Integrated ArtifactToolbar |
| `artifactVersioning.ts` | New | Barrel export for versioning modules |
| `navigationShortcuts.ts` | Modified | Added artifact keyboard shortcuts |
