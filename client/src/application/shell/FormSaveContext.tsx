/**
 * Form Save Context
 *
 * Provides a way for the active form to register its save function
 * so global keyboard shortcuts can trigger saves.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

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
 * Optional hook for forms that want to use FormSaveContext
 *
 * This hook safely tries to use the context and provides no-op functions
 * if the context is not available.
 */
export function useOptionalFormSaveContext() {
  const context = useContext(FormSaveContext);
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
  const context = useOptionalFormSaveContext();

  // Register save function on mount
  useEffect(() => {
    if (!context) return;

    context.registerSave(saveFunction);
    return () => context.unregisterSave();
  }, [context, saveFunction]);

  // Update dirty state
  useEffect(() => {
    if (!context) return;
    context.setIsDirty(isDirty);
  }, [context, isDirty]);

  // Update saving state
  useEffect(() => {
    if (!context) return;
    context.setIsSaving(isSaving);
  }, [context, isSaving]);
}
