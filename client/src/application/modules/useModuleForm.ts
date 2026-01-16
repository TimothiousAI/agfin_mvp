import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Module form data types
 */
export interface ModuleFieldData {
  field_id: string;
  value: any;
  source: 'ai_extracted' | 'proxy_entered' | 'proxy_edited' | 'auditor_verified';
  confidence_score?: number;
  source_document_id?: string;
}

export interface ModuleData {
  module_number: number;
  fields: Record<string, ModuleFieldData>;
}

export interface UpdateFieldInput {
  field_id: string;
  value: any;
  source?: 'proxy_entered' | 'proxy_edited';
}

/**
 * Form state tracking
 */
export interface FormState {
  /** Current form data */
  data: Record<string, any>;
  /** Fields that have been modified but not saved */
  dirtyFields: Set<string>;
  /** Fields currently being saved */
  savingFields: Set<string>;
  /** Validation errors by field */
  errors: Record<string, string>;
  /** Fields that have been touched (focused/blurred) */
  touchedFields: Set<string>;
  /** Last save timestamp */
  lastSaveTime: Date | null;
  /** Is form currently submitting */
  isSubmitting: boolean;
}

/**
 * API Helper Functions
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchModuleData(
  applicationId: string,
  moduleNumber: number
): Promise<ModuleData> {
  const response = await fetch(
    `${API_BASE_URL}/api/modules/${applicationId}/${moduleNumber}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch module data');
  }

  const data = await response.json();
  return data.module;
}

async function updateModuleField(
  applicationId: string,
  moduleNumber: number,
  input: UpdateFieldInput
): Promise<ModuleFieldData> {
  const response = await fetch(
    `${API_BASE_URL}/api/modules/${applicationId}/${moduleNumber}/${input.field_id}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: input.value,
        source: input.source || 'proxy_edited',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update field');
  }

  const data = await response.json();
  return data.field;
}


/**
 * Module Form Hook Options
 */
export interface UseModuleFormOptions {
  /** Enable auto-save on blur (default: true) */
  autoSave?: boolean;
  /** Debounce delay for auto-save in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Validation schema (Zod or custom) */
  validationSchema?: any;
  /** Callback when field is saved successfully */
  onFieldSaved?: (fieldId: string, value: any) => void;
  /** Callback when save fails */
  onSaveError?: (fieldId: string, error: Error) => void;
}

/**
 * Module Form Hook Return Type
 */
export interface UseModuleFormReturn {
  /** Current form data */
  formData: Record<string, any>;
  /** Form state metadata */
  formState: FormState;
  /** Is initial data loading */
  isLoading: boolean;
  /** Update a field value */
  setValue: (fieldId: string, value: any) => void;
  /** Handle field blur (triggers auto-save if enabled) */
  handleBlur: (fieldId: string) => void;
  /** Manually save a specific field */
  saveField: (fieldId: string) => Promise<void>;
  /** Manually save all dirty fields */
  saveAllFields: () => Promise<void>;
  /** Reset form to initial data */
  reset: () => void;
  /** Reset form to specific data */
  resetWith: (data: Record<string, any>) => void;
  /** Mark field as touched */
  setTouched: (fieldId: string, touched?: boolean) => void;
  /** Set validation error for field */
  setError: (fieldId: string, error: string) => void;
  /** Clear validation error for field */
  clearError: (fieldId: string) => void;
  /** Check if field is dirty (modified) */
  isDirty: (fieldId: string) => boolean;
  /** Check if field is being saved */
  isSaving: (fieldId: string) => boolean;
}

/**
 * Module Form Hook
 *
 * Manages form state for a certification module with:
 * - Auto-save on blur (debounced)
 * - Validation state management
 * - Dirty field tracking
 * - Reset functionality
 * - Optimistic updates with rollback on error
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   formState,
 *   setValue,
 *   handleBlur,
 *   saveField,
 * } = useModuleForm('app-123', 1, {
 *   autoSave: true,
 *   debounceMs: 1000,
 * });
 *
 * <Input
 *   value={formData.applicant_first_name || ''}
 *   onChange={(e) => setValue('applicant_first_name', e.target.value)}
 *   onBlur={() => handleBlur('applicant_first_name')}
 * />
 * ```
 */
export function useModuleForm(
  applicationId: string,
  moduleNumber: number,
  options: UseModuleFormOptions = {}
): UseModuleFormReturn {
  const {
    autoSave = true,
    debounceMs = 1000,
    validationSchema,
    onFieldSaved,
    onSaveError,
  } = options;

  const queryClient = useQueryClient();

  // Fetch module data
  const {
    data: moduleData,
    isLoading,
    error: _fetchError,
  } = useQuery({
    queryKey: ['modules', applicationId, moduleNumber],
    queryFn: () => fetchModuleData(applicationId, moduleNumber),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for updating fields
  const updateFieldMutation = useMutation({
    mutationFn: (input: UpdateFieldInput & { applicationId: string; moduleNumber: number }) =>
      updateModuleField(input.applicationId, input.moduleNumber, input),
    onSuccess: (data, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ['modules', variables.applicationId, variables.moduleNumber],
        (old: ModuleData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            fields: {
              ...old.fields,
              [variables.field_id]: data,
            },
          };
        }
      );

      // Callback
      if (onFieldSaved) {
        onFieldSaved(variables.field_id, variables.value);
      }
    },
    onError: (error, variables) => {
      // Callback
      if (onSaveError) {
        onSaveError(variables.field_id, error as Error);
      }
    },
  });

  // Form state
  const [formState, setFormState] = useState<FormState>({
    data: {},
    dirtyFields: new Set(),
    savingFields: new Set(),
    errors: {},
    touchedFields: new Set(),
    lastSaveTime: null,
    isSubmitting: false,
  });

  // Initialize form data from module data
  useEffect(() => {
    if (moduleData) {
      const initialData: Record<string, any> = {};
      Object.entries(moduleData.fields).forEach(([fieldId, fieldData]) => {
        initialData[fieldId] = fieldData.value;
      });

      setFormState(prev => ({
        ...prev,
        data: initialData,
      }));
    }
  }, [moduleData]);

  // Track fields pending auto-save
  const pendingSaves = useRef<Map<string, any>>(new Map());
  const saveTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Set field value
   */
  const setValue = useCallback((fieldId: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldId]: value,
      },
      dirtyFields: new Set(prev.dirtyFields).add(fieldId),
    }));

    // Track pending save
    pendingSaves.current.set(fieldId, value);
  }, []);

  /**
   * Handle field blur - triggers auto-save if enabled
   */
  const handleBlur = useCallback(
    (fieldId: string) => {
      // Mark as touched
      setFormState(prev => ({
        ...prev,
        touchedFields: new Set(prev.touchedFields).add(fieldId),
      }));

      // Auto-save if enabled and field is dirty
      if (autoSave && pendingSaves.current.has(fieldId)) {
        // Clear existing timeout for this field
        const existingTimeout = saveTimeouts.current.get(fieldId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new debounced save
        const timeout = setTimeout(() => {
          const value = pendingSaves.current.get(fieldId);
          if (value !== undefined) {
            saveFieldInternal(fieldId, value);
            pendingSaves.current.delete(fieldId);
          }
        }, debounceMs);

        saveTimeouts.current.set(fieldId, timeout);
      }
    },
    [autoSave, debounceMs]
  );

  /**
   * Internal save field function
   */
  const saveFieldInternal = async (fieldId: string, value: any) => {
    // Mark as saving
    setFormState(prev => ({
      ...prev,
      savingFields: new Set(prev.savingFields).add(fieldId),
    }));

    try {
      // Validate if schema provided
      if (validationSchema) {
        try {
          const fieldSchema = (validationSchema.shape as any)?.[fieldId];
          if (fieldSchema) {
            fieldSchema.parse(value);
          }
        } catch (validationError: any) {
          // Set validation error
          setFormState(prev => ({
            ...prev,
            savingFields: new Set(
              Array.from(prev.savingFields).filter(f => f !== fieldId)
            ),
            errors: {
              ...prev.errors,
              [fieldId]: validationError.errors?.[0]?.message || 'Validation failed',
            },
          }));
          return;
        }
      }

      // Save to API
      await updateFieldMutation.mutateAsync({
        applicationId,
        moduleNumber,
        field_id: fieldId,
        value,
      });

      // Mark as saved
      setFormState(prev => {
        const newDirtyFields = new Set(prev.dirtyFields);
        newDirtyFields.delete(fieldId);

        const newSavingFields = new Set(prev.savingFields);
        newSavingFields.delete(fieldId);

        const newErrors = { ...prev.errors };
        delete newErrors[fieldId];

        return {
          ...prev,
          dirtyFields: newDirtyFields,
          savingFields: newSavingFields,
          errors: newErrors,
          lastSaveTime: new Date(),
        };
      });
    } catch (error) {
      // Remove from saving
      setFormState(prev => ({
        ...prev,
        savingFields: new Set(
          Array.from(prev.savingFields).filter(f => f !== fieldId)
        ),
        errors: {
          ...prev.errors,
          [fieldId]: (error as Error).message,
        },
      }));
    }
  };

  /**
   * Manually save a specific field
   */
  const saveField = async (fieldId: string) => {
    const value = formState.data[fieldId];
    await saveFieldInternal(fieldId, value);
  };

  /**
   * Save all dirty fields
   */
  const saveAllFields = async () => {
    const dirtyFieldIds = Array.from(formState.dirtyFields);
    await Promise.all(
      dirtyFieldIds.map(fieldId => saveFieldInternal(fieldId, formState.data[fieldId]))
    );
  };

  /**
   * Reset form to initial data
   */
  const reset = useCallback(() => {
    if (moduleData) {
      const initialData: Record<string, any> = {};
      Object.entries(moduleData.fields).forEach(([fieldId, fieldData]) => {
        initialData[fieldId] = fieldData.value;
      });

      setFormState({
        data: initialData,
        dirtyFields: new Set(),
        savingFields: new Set(),
        errors: {},
        touchedFields: new Set(),
        lastSaveTime: null,
        isSubmitting: false,
      });

      // Clear pending saves
      pendingSaves.current.clear();
      saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
      saveTimeouts.current.clear();
    }
  }, [moduleData]);

  /**
   * Reset with specific data
   */
  const resetWith = useCallback((data: Record<string, any>) => {
    setFormState({
      data,
      dirtyFields: new Set(),
      savingFields: new Set(),
      errors: {},
      touchedFields: new Set(),
      lastSaveTime: null,
      isSubmitting: false,
    });

    // Clear pending saves
    pendingSaves.current.clear();
    saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
    saveTimeouts.current.clear();
  }, []);

  /**
   * Set field as touched
   */
  const setTouched = useCallback((fieldId: string, touched: boolean = true) => {
    setFormState(prev => {
      const newTouchedFields = new Set(prev.touchedFields);
      if (touched) {
        newTouchedFields.add(fieldId);
      } else {
        newTouchedFields.delete(fieldId);
      }
      return {
        ...prev,
        touchedFields: newTouchedFields,
      };
    });
  }, []);

  /**
   * Set validation error
   */
  const setError = useCallback((fieldId: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldId]: error,
      },
    }));
  }, []);

  /**
   * Clear validation error
   */
  const clearError = useCallback((fieldId: string) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldId];
      return {
        ...prev,
        errors: newErrors,
      };
    });
  }, []);

  /**
   * Check if field is dirty
   */
  const isDirty = useCallback(
    (fieldId: string) => formState.dirtyFields.has(fieldId),
    [formState.dirtyFields]
  );

  /**
   * Check if field is being saved
   */
  const isSaving = useCallback(
    (fieldId: string) => formState.savingFields.has(fieldId),
    [formState.savingFields]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    formData: formState.data,
    formState,
    isLoading,
    setValue,
    handleBlur,
    saveField,
    saveAllFields,
    reset,
    resetWith,
    setTouched,
    setError,
    clearError,
    isDirty,
    isSaving,
  };
}
