/**
 * Progress Panel Navigation Utilities
 *
 * Handles click-to-navigate functionality for documents, modules, and warnings
 * Provides deep linking and keyboard navigation support
 */

/**
 * Navigation target types
 */
export type NavigationTarget =
  | { type: 'document'; documentId: string }
  | { type: 'module'; moduleNumber: number }
  | { type: 'field'; moduleNumber: number; fieldId: string }
  | { type: 'warning'; documentId?: string; moduleNumber?: number; fieldId?: string };

/**
 * Navigation options
 */
export interface NavigationOptions {
  /** Update browser URL for deep linking */
  updateUrl?: boolean;
  /** Smooth scroll to target */
  smoothScroll?: boolean;
  /** Focus target element for keyboard navigation */
  focusTarget?: boolean;
  /** Callback after navigation completes */
  onNavigate?: () => void;
}

/**
 * Navigation result
 */
export interface NavigationResult {
  success: boolean;
  target: NavigationTarget;
  error?: string;
}

/**
 * Navigate to a document in the artifact panel
 */
export function navigateToDocument(
  documentId: string,
  options: NavigationOptions = {}
): NavigationResult {
  const {
    updateUrl = true,
    smoothScroll = true,
    focusTarget = true,
    onNavigate,
  } = options;

  try {
    // Update URL for deep linking
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('document', documentId);
      window.history.pushState({}, '', url.toString());
    }

    // Find and focus the artifact panel
    if (focusTarget) {
      const artifactPanel = document.querySelector('[data-artifact-panel]');
      if (artifactPanel instanceof HTMLElement) {
        artifactPanel.focus();
      }
    }

    // Trigger navigation callback
    onNavigate?.();

    return {
      success: true,
      target: { type: 'document', documentId },
    };
  } catch (error) {
    return {
      success: false,
      target: { type: 'document', documentId },
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to a module form in the artifact panel
 */
export function navigateToModule(
  moduleNumber: number,
  options: NavigationOptions = {}
): NavigationResult {
  const {
    updateUrl = true,
    smoothScroll = true,
    focusTarget = true,
    onNavigate,
  } = options;

  try {
    // Validate module number
    if (moduleNumber < 1 || moduleNumber > 5) {
      throw new Error(`Invalid module number: ${moduleNumber}`);
    }

    // Update URL for deep linking
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('module', moduleNumber.toString());
      window.history.pushState({}, '', url.toString());
    }

    // Find and focus the module form
    if (focusTarget) {
      const moduleForm = document.querySelector(`[data-module="${moduleNumber}"]`);
      if (moduleForm instanceof HTMLElement) {
        moduleForm.focus();
      }
    }

    // Trigger navigation callback
    onNavigate?.();

    return {
      success: true,
      target: { type: 'module', moduleNumber },
    };
  } catch (error) {
    return {
      success: false,
      target: { type: 'module', moduleNumber },
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to a specific field (scroll and focus)
 */
export function navigateToField(
  moduleNumber: number,
  fieldId: string,
  options: NavigationOptions = {}
): NavigationResult {
  const {
    updateUrl = true,
    smoothScroll = true,
    focusTarget = true,
    onNavigate,
  } = options;

  try {
    // Update URL for deep linking
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('module', moduleNumber.toString());
      url.searchParams.set('field', fieldId);
      window.history.pushState({}, '', url.toString());
    }

    // Find the field element
    const fieldElement = document.getElementById(fieldId) ||
                        document.querySelector(`[name="${fieldId}"]`) ||
                        document.querySelector(`[data-field-id="${fieldId}"]`);

    if (fieldElement instanceof HTMLElement) {
      // Scroll to field
      if (smoothScroll) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        fieldElement.scrollIntoView({ block: 'center' });
      }

      // Focus the field
      if (focusTarget) {
        // Wait for scroll to complete before focusing
        setTimeout(() => {
          fieldElement.focus();
          // Add highlight effect
          fieldElement.classList.add('field-highlight');
          setTimeout(() => {
            fieldElement.classList.remove('field-highlight');
          }, 2000);
        }, smoothScroll ? 500 : 0);
      }
    }

    // Trigger navigation callback
    onNavigate?.();

    return {
      success: true,
      target: { type: 'field', moduleNumber, fieldId },
    };
  } catch (error) {
    return {
      success: false,
      target: { type: 'field', moduleNumber, fieldId },
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to a warning (document or field with low confidence)
 */
export function navigateToWarning(
  warning: {
    documentId?: string;
    moduleNumber?: number;
    fieldId?: string;
  },
  options: NavigationOptions = {}
): NavigationResult {
  try {
    // Navigate to field if specified
    if (warning.moduleNumber && warning.fieldId) {
      return navigateToField(warning.moduleNumber, warning.fieldId, options);
    }

    // Navigate to module if specified
    if (warning.moduleNumber) {
      return navigateToModule(warning.moduleNumber, options);
    }

    // Navigate to document if specified
    if (warning.documentId) {
      return navigateToDocument(warning.documentId, options);
    }

    throw new Error('Invalid warning target: no document, module, or field specified');
  } catch (error) {
    return {
      success: false,
      target: {
        type: 'warning',
        documentId: warning.documentId,
        moduleNumber: warning.moduleNumber,
        fieldId: warning.fieldId,
      },
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Parse navigation target from URL parameters
 */
export function parseNavigationFromUrl(): NavigationTarget | null {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Check for field navigation
  const moduleParam = params.get('module');
  const fieldParam = params.get('field');
  if (moduleParam && fieldParam) {
    const moduleNumber = parseInt(moduleParam, 10);
    if (!isNaN(moduleNumber)) {
      return { type: 'field', moduleNumber, fieldId: fieldParam };
    }
  }

  // Check for module navigation
  if (moduleParam) {
    const moduleNumber = parseInt(moduleParam, 10);
    if (!isNaN(moduleNumber)) {
      return { type: 'module', moduleNumber };
    }
  }

  // Check for document navigation
  const documentParam = params.get('document');
  if (documentParam) {
    return { type: 'document', documentId: documentParam };
  }

  return null;
}

/**
 * Apply navigation from URL on page load (for deep linking)
 */
export function applyDeepLinkNavigation(options: NavigationOptions = {}): void {
  const target = parseNavigationFromUrl();
  if (!target) return;

  // Apply navigation based on target type
  switch (target.type) {
    case 'document':
      navigateToDocument(target.documentId, { ...options, updateUrl: false });
      break;
    case 'module':
      navigateToModule(target.moduleNumber, { ...options, updateUrl: false });
      break;
    case 'field':
      navigateToField(target.moduleNumber, target.fieldId, { ...options, updateUrl: false });
      break;
  }
}

/**
 * Keyboard navigation handler
 */
export interface KeyboardNavigationConfig {
  /** Enable arrow key navigation */
  enableArrowKeys?: boolean;
  /** Enable number key shortcuts (1-5 for modules) */
  enableNumberKeys?: boolean;
  /** Enable Enter/Space to activate */
  enableActivation?: boolean;
  /** Callback when navigation key is pressed */
  onNavigate?: (target: NavigationTarget) => void;
}

/**
 * Setup keyboard navigation event listeners
 */
export function setupKeyboardNavigation(
  config: KeyboardNavigationConfig = {}
): () => void {
  const {
    enableArrowKeys = true,
    enableNumberKeys = true,
    enableActivation = true,
    onNavigate,
  } = config;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Number keys (1-5) for module navigation
    if (enableNumberKeys && event.key >= '1' && event.key <= '5') {
      const moduleNumber = parseInt(event.key, 10);
      const result = navigateToModule(moduleNumber);
      if (result.success) {
        onNavigate?.(result.target);
      }
      event.preventDefault();
      return;
    }

    // Arrow keys for navigation between items
    if (enableArrowKeys) {
      const focusedElement = document.activeElement;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // Find next/previous focusable item
        const items = Array.from(
          document.querySelectorAll('[data-progress-item]')
        ) as HTMLElement[];

        const currentIndex = items.indexOf(focusedElement as HTMLElement);
        if (currentIndex !== -1) {
          const nextIndex = event.key === 'ArrowDown'
            ? Math.min(currentIndex + 1, items.length - 1)
            : Math.max(currentIndex - 1, 0);

          items[nextIndex]?.focus();
          event.preventDefault();
        }
      }
    }

    // Enter or Space to activate focused item
    if (enableActivation && (event.key === 'Enter' || event.key === ' ')) {
      const focusedElement = document.activeElement;
      if (focusedElement instanceof HTMLElement && focusedElement.dataset.progressItem) {
        focusedElement.click();
        event.preventDefault();
      }
    }
  };

  // Add event listener
  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Create click handler for document navigation
 */
export function createDocumentClickHandler(
  documentId: string,
  onNavigate?: () => void
): () => void {
  return () => {
    navigateToDocument(documentId, {
      updateUrl: true,
      smoothScroll: true,
      focusTarget: true,
      onNavigate,
    });
  };
}

/**
 * Create click handler for module navigation
 */
export function createModuleClickHandler(
  moduleNumber: number,
  onNavigate?: () => void
): () => void {
  return () => {
    navigateToModule(moduleNumber, {
      updateUrl: true,
      smoothScroll: true,
      focusTarget: true,
      onNavigate,
    });
  };
}

/**
 * Create click handler for field navigation (warnings)
 */
export function createFieldClickHandler(
  moduleNumber: number,
  fieldId: string,
  onNavigate?: () => void
): () => void {
  return () => {
    navigateToField(moduleNumber, fieldId, {
      updateUrl: true,
      smoothScroll: true,
      focusTarget: true,
      onNavigate,
    });
  };
}
