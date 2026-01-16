# Implementation Plan: Missing Keyboard Shortcuts from PRD

**Scope**: Implement missing keyboard shortcuts (Cmd/Ctrl+N, Cmd/Ctrl+S, Cmd/Ctrl+[, Cmd/Ctrl+]) per PRD Section 7.9
**Services Affected**: client
**Estimated Steps**: 12

---

## Overview

This plan adds four missing keyboard shortcuts to AgFin per PRD requirements. The existing keyboard shortcut system (`useKeyboardShortcuts.ts`) provides excellent infrastructure for cross-platform support. The shortcuts for navigation (Cmd/Ctrl+[ and ]) and save (Cmd/Ctrl+S) are already defined in `navigationShortcuts.ts` but need to be wired up with actual handlers. The new application shortcut (Cmd/Ctrl+N) is defined in `defaultShortcuts.ts` but similarly needs handler implementation.

---

## Prerequisites

- [ ] Understand existing shortcut registration pattern in `useKeyboardShortcuts.ts`
- [ ] Review current shortcut definitions in `defaultShortcuts.ts` and `navigationShortcuts.ts`
- [ ] Identify integration points in `AppLayout.tsx` and related shell components

---

## Current State Analysis

### Existing Infrastructure (Already Complete)
The codebase already has:
1. **`useKeyboardShortcuts.ts`** - Full shortcut system with cross-platform normalization (Cmd/Ctrl)
2. **`defaultShortcuts.ts`** - Defines `onNewApplication` handler interface and shortcut registration
3. **`navigationShortcuts.ts`** - Defines `onNext`, `onPrevious`, `onSave` handler interfaces
4. **`KeyboardShortcutsHelp.tsx`** - Help modal that displays all shortcuts from categories
5. **`progressNavigation.ts`** - Navigation utilities for documents/modules

### What's Missing
1. **Handler connections** - The shortcuts are defined but handlers are not wired up at the application level
2. **Global shortcut provider** - A component to register shortcuts with actual implementations
3. **Form save context** - Mechanism to trigger save on the currently active form
4. **Navigation state tracking** - Tracking current document/module index for next/previous navigation

---

## Implementation Steps

### Phase 1: Create Global Shortcut Provider Hook

**Step 1.1**: Create a new hook to wire up global shortcuts with handlers

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useGlobalShortcuts.ts`
- Changes: Create new hook that connects shortcut definitions to actual handlers

```typescript
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
  const { artifacts, activeArtifactId, setActiveArtifact } = useArtifactStore();

  // Handler: Create new application
  const handleNewApplication = useCallback(() => {
    if (context.onOpenNewApplicationDialog) {
      context.onOpenNewApplicationDialog();
    } else {
      // Default behavior: navigate to new application route or trigger via chat
      navigate('/applications/new');
    }
  }, [navigate, context.onOpenNewApplicationDialog]);

  // Handler: Save current form
  const handleSave = useCallback(async () => {
    if (context.onSaveActiveForm && context.canSave) {
      await context.onSaveActiveForm();
    }
  }, [context.onSaveActiveForm, context.canSave]);

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
    if (context.applicationId) {
      navigate(`/applications/${context.applicationId}/modules/${moduleNumber}`);
    }
  }, [navigate, context.applicationId]);

  // Check if navigation is available
  const isNavigationAvailable = useCallback(() => {
    return artifacts.length > 1;
  }, [artifacts.length]);

  // Check if save is available
  const isSaveAvailable = useCallback(() => {
    return !!context.canSave;
  }, [context.canSave]);

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
      onJumpToModule: context.applicationId ? handleJumpToModule : undefined,
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
    context.applicationId,
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
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 2: Create Form Save Context

**Step 2.1**: Create a context for tracking the active form's save function

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\FormSaveContext.tsx`
- Changes: Create new context provider for form save functionality

```typescript
/**
 * Form Save Context
 *
 * Provides a way for the active form to register its save function
 * so global keyboard shortcuts can trigger saves.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface FormSaveState {
  /** Whether the active form has unsaved changes */
  isDirty: boolean;
  /** Whether the form is currently saving */
  isSaving: boolean;
  /** Function to trigger save on the active form */
  save: (() => Promise<void>) | null;
}

interface FormSaveContextValue extends FormSaveState {
  /** Register a form's save function */
  registerSave: (saveFunction: () => Promise<void>) => void;
  /** Unregister the save function (when form unmounts) */
  unregisterSave: () => void;
  /** Update dirty state */
  setIsDirty: (dirty: boolean) => void;
  /** Update saving state */
  setIsSaving: (saving: boolean) => void;
}

const FormSaveContext = createContext<FormSaveContextValue | null>(null);

export function FormSaveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormSaveState>({
    isDirty: false,
    isSaving: false,
    save: null,
  });

  const registerSave = useCallback((saveFunction: () => Promise<void>) => {
    setState(prev => ({ ...prev, save: saveFunction }));
  }, []);

  const unregisterSave = useCallback(() => {
    setState(prev => ({ ...prev, save: null, isDirty: false, isSaving: false }));
  }, []);

  const setIsDirty = useCallback((dirty: boolean) => {
    setState(prev => ({ ...prev, isDirty: dirty }));
  }, []);

  const setIsSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, isSaving: saving }));
  }, []);

  return (
    <FormSaveContext.Provider
      value={{
        ...state,
        registerSave,
        unregisterSave,
        setIsDirty,
        setIsSaving,
      }}
    >
      {children}
    </FormSaveContext.Provider>
  );
}

export function useFormSaveContext() {
  const context = useContext(FormSaveContext);
  if (!context) {
    throw new Error('useFormSaveContext must be used within a FormSaveProvider');
  }
  return context;
}

/**
 * Hook for forms to register their save function
 *
 * @example
 * ```tsx
 * const { saveAllFields, formState } = useModuleForm(appId, moduleNumber);
 *
 * useRegisterFormSave(
 *   saveAllFields,
 *   formState.dirtyFields.size > 0
 * );
 * ```
 */
export function useRegisterFormSave(
  saveFunction: () => Promise<void>,
  isDirty: boolean,
  isSaving: boolean = false
) {
  const { registerSave, unregisterSave, setIsDirty, setIsSaving } = useFormSaveContext();

  // Register save function on mount
  useEffect(() => {
    registerSave(saveFunction);
    return () => unregisterSave();
  }, [registerSave, unregisterSave, saveFunction]);

  // Update dirty state
  useEffect(() => {
    setIsDirty(isDirty);
  }, [setIsDirty, isDirty]);

  // Update saving state
  useEffect(() => {
    setIsSaving(isSaving);
  }, [setIsSaving, isSaving]);
}

// Need to import useEffect
import { useEffect } from 'react';
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 3: Integrate Global Shortcuts into AppLayout

**Step 3.1**: Update AppLayout to use global shortcuts hook

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\AppLayout.tsx`
- Changes: Add FormSaveProvider and useGlobalShortcuts integration

Add import at top of file:
```typescript
import { FormSaveProvider, useFormSaveContext } from './FormSaveContext';
import { useGlobalShortcuts } from './useGlobalShortcuts';
```

Wrap the component with FormSaveProvider and add shortcut hook usage. Update the component structure:

```typescript
// Inside AppLayout, after the existing state hooks:
function AppLayoutInner({ children, sidebar, artifactPanel }: AppLayoutProps) {
  // ... existing code ...

  // Get form save context
  const formSaveContext = useFormSaveContext();

  // Setup global shortcuts
  useGlobalShortcuts({
    onSaveActiveForm: formSaveContext.save || undefined,
    canSave: formSaveContext.isDirty && !formSaveContext.isSaving,
  });

  // ... rest of existing component ...
}

// Export wrapped component
export function AppLayout(props: AppLayoutProps) {
  return (
    <FormSaveProvider>
      <AppLayoutInner {...props} />
    </FormSaveProvider>
  );
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 4: Update Module Forms to Register Save Functions

**Step 4.1**: Update useModuleForm hook to integrate with FormSaveContext

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\useModuleForm.ts`
- Changes: Export a wrapper hook that can optionally register with FormSaveContext

Add new export at the end of the file:

```typescript
/**
 * Hook to connect module form to global save shortcut
 *
 * Call this in module form components after useModuleForm
 */
export function useModuleFormWithGlobalSave(
  applicationId: string,
  moduleNumber: number,
  options: UseModuleFormOptions = {}
) {
  const form = useModuleForm(applicationId, moduleNumber, options);

  // Note: Forms using this hook should also call useRegisterFormSave
  // from FormSaveContext to enable Cmd/Ctrl+S global shortcut

  return form;
}
```

**Step 4.2**: Update M1IdentityForm to register save function

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\M1IdentityForm.tsx`
- Changes: Add useRegisterFormSave to connect to global shortcut

Add import:
```typescript
import { useRegisterFormSave } from '../shell/FormSaveContext';
```

Inside the component, after the form hook:
```typescript
// Register save function for global Cmd/Ctrl+S shortcut
useRegisterFormSave(
  saveAllFields,
  formState.dirtyFields.size > 0,
  formState.isSubmitting
);
```

**Step 4.3**: Update remaining module forms (M2-M5) similarly

- Files:
  - `C:\Users\timca\Business\agfin_app\client\src\application\modules\M2LandsForm.tsx`
  - `C:\Users\timca\Business\agfin_app\client\src\application\modules\M3FinancialForm.tsx`
  - `C:\Users\timca\Business\agfin_app\client\src\application\modules\M4OperationsForm.tsx`
  - `C:\Users\timca\Business\agfin_app\client\src\application\modules\M5SummaryForm.tsx`
- Changes: Same pattern as M1IdentityForm

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit`

---

### Phase 5: Add Browser Default Prevention

**Step 5.1**: Ensure shortcuts don't conflict with browser defaults

The existing `useKeyboardShortcuts.ts` already calls `event.preventDefault()` when a shortcut matches. However, we should verify specific browser behaviors:

- **Cmd/Ctrl+N**: Opens new window in most browsers - MUST prevent default
- **Cmd/Ctrl+S**: Opens save dialog - MUST prevent default
- **Cmd/Ctrl+[**: No browser default (safe)
- **Cmd/Ctrl+]**: No browser default (safe)

The current implementation in `useKeyboardShortcuts.ts` lines 198-199 already handles this:
```typescript
// Prevent default browser behavior
event.preventDefault();
event.stopPropagation();
```

No changes needed, but add a comment in the shortcut definitions for documentation.

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\commands\defaultShortcuts.ts`
- Changes: Add comment about browser default prevention

```typescript
// Cmd/Ctrl+N: New application
// Note: Prevents browser's "new window" default behavior
if (handlers.onNewApplication) {
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build`

---

### Phase 6: Update KeyboardShortcutsHelp Modal

**Step 6.1**: Verify shortcuts are properly displayed in help modal

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\KeyboardShortcutsHelp.tsx`
- Changes: Verify all shortcuts are included (they should already be via SHORTCUT_CATEGORIES and NAVIGATION_CATEGORIES imports)

Current implementation already includes:
- SHORTCUT_CATEGORIES (messaging, navigation, interface) - includes Cmd/Ctrl+N
- NAVIGATION_CATEGORIES (document navigation, module jumping, form actions) - includes Cmd/Ctrl+S, Cmd/Ctrl+[, Cmd/Ctrl+]

**No changes needed** - the help modal automatically picks up all shortcuts from the category exports.

**Step 6.2**: Add visual feedback for save shortcut

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\commands\navigationShortcuts.ts`
- Changes: Ensure FORM_ACTIONS category has descriptive text

Current implementation at line 173 is sufficient:
```typescript
FORM_ACTIONS: {
  name: 'Form Actions',
  shortcuts: [
    { key: NAVIGATION_SHORTCUT_LABELS.SAVE, description: 'Save current form' }
  ]
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build`

---

### Phase 7: Add Toast Notifications for Shortcuts

**Step 7.1**: Add visual feedback when shortcuts are used

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\useGlobalShortcuts.ts`
- Changes: Add toast notifications for shortcut actions

Update handlers to show toasts:

```typescript
import { toast } from '../../shared/ui/toast';

// Handler: Save current form (updated)
const handleSave = useCallback(async () => {
  if (context.onSaveActiveForm && context.canSave) {
    try {
      await context.onSaveActiveForm();
      toast({
        title: 'Saved',
        description: 'Form saved successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  } else if (!context.canSave) {
    toast({
      title: 'No changes to save',
      description: 'The form has no unsaved changes',
      variant: 'default',
    });
  }
}, [context.onSaveActiveForm, context.canSave]);
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build`

---

### Phase 8: Export New Components

**Step 8.1**: Add exports to shell index

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\index.ts`
- Changes: Export new components (create file if doesn't exist)

```typescript
// Shell component exports
export { AppLayout } from './AppLayout';
export { FormSaveProvider, useFormSaveContext, useRegisterFormSave } from './FormSaveContext';
export { useGlobalShortcuts, type GlobalShortcutContext } from './useGlobalShortcuts';
export { usePanelStore, type Artifact } from './usePanelStore';
export { useArtifactStore } from './useArtifactStore';
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint`

---

## Acceptance Criteria

- [ ] **Cmd/Ctrl+N** creates a new application (opens dialog or navigates to new application page)
- [ ] **Cmd/Ctrl+S** saves the current form when a form is active and has unsaved changes
- [ ] **Cmd/Ctrl+S** shows "No changes to save" toast when form has no dirty fields
- [ ] **Cmd/Ctrl+[** navigates to the previous artifact in the artifact panel
- [ ] **Cmd/Ctrl+]** navigates to the next artifact in the artifact panel
- [ ] Shortcuts do NOT trigger when typing in input fields (except where allowInInputs is true)
- [ ] Browser default behaviors are prevented (no new window on Cmd+N, no save dialog on Cmd+S)
- [ ] All shortcuts appear in KeyboardShortcutsHelp modal (Cmd/Ctrl+?)
- [ ] Toast notifications provide feedback for save actions
- [ ] Cross-platform support works (Cmd on Mac, Ctrl on Windows/Linux)

---

## Final Validation

```bash
# Run full client validation
cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint

# Type check
cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit

# Run tests if available
cd C:\Users\timca\Business\agfin_app\client && npm run test --if-present
```

---

## Notes

1. **Existing Infrastructure**: The keyboard shortcut system is well-designed with cross-platform support already built in. The main work is wiring up handlers.

2. **Browser Compatibility**: `event.preventDefault()` is already called in the shortcut handler, which prevents browser defaults like Cmd+N (new window) and Cmd+S (save page).

3. **Form Save Mechanism**: The `useModuleForm` hook already has `saveAllFields()` method. We just need to expose it to the global shortcut system via context.

4. **Navigation Context**: For Cmd/Ctrl+[ and ] to work meaningfully, we navigate through artifacts in the artifact store. If a different navigation pattern is preferred (e.g., modules only), the handlers can be easily modified.

5. **Testing**: Manual testing should verify:
   - Shortcuts work in Chrome, Firefox, Safari, Edge
   - Shortcuts work on both Mac and Windows
   - No interference with browser DevTools shortcuts (F12, Cmd+Option+I)

6. **Future Enhancements**:
   - Add shortcut customization in settings
   - Add visual shortcut hints in UI (e.g., "S" badge on Save button)
   - Support for vim-style shortcuts (optional)
