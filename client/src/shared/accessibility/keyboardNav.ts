/**
 * Keyboard Navigation Utilities
 *
 * Provides comprehensive keyboard support for interactive elements:
 * - Tab order management
 * - Arrow key navigation for lists/menus
 * - Enter/Space activation
 * - Escape key handling
 * - Skip links for main content
 */

/**
 * Traps focus within a container (useful for modals/dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus first element
  firstElement.focus();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    // Shift + Tab (backwards)
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    }
    // Tab (forwards)
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter(el => {
      // Exclude hidden elements
      return el.offsetParent !== null &&
             getComputedStyle(el).visibility !== 'hidden';
    });
}

/**
 * Arrow key navigation for lists and menus
 */
export interface ArrowNavigationOptions {
  onSelect?: (element: HTMLElement, index: number) => void;
  wrap?: boolean; // Whether to wrap around at start/end
  orientation?: 'vertical' | 'horizontal' | 'both';
  onEscape?: () => void;
}

export function enableArrowNavigation(
  container: HTMLElement,
  options: ArrowNavigationOptions = {}
): () => void {
  const {
    onSelect,
    wrap = true,
    orientation = 'vertical',
    onEscape,
  } = options;

  const handleKeyDown = (e: KeyboardEvent) => {
    const items = getFocusableElements(container);
    if (items.length === 0) return;

    const currentIndex = items.findIndex(el => el === document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = items.length - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onSelect && document.activeElement instanceof HTMLElement) {
          e.preventDefault();
          onSelect(document.activeElement, currentIndex);
          handled = true;
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
          handled = true;
        }
        break;
    }

    if (handled && newIndex !== currentIndex) {
      e.preventDefault();

      // Handle wrapping
      if (wrap) {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      }

      items[newIndex]?.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Skip link component helper
 * Creates a skip link that appears on focus for keyboard users
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'skip-link';

  // Styling (should be in CSS, but providing defaults)
  Object.assign(link.style, {
    position: 'absolute',
    left: '-9999px',
    zIndex: '999',
    padding: '1rem',
    backgroundColor: '#30714C',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '0.25rem',
  });

  link.addEventListener('focus', () => {
    link.style.left = '1rem';
    link.style.top = '1rem';
  });

  link.addEventListener('blur', () => {
    link.style.left = '-9999px';
  });

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return link;
}

/**
 * Manages tab order for custom components
 */
export function setTabOrder(elements: HTMLElement[], startIndex: number = 0): void {
  elements.forEach((el, i) => {
    el.setAttribute('tabindex', String(startIndex + i));
  });
}

/**
 * Removes an element from tab order
 */
export function removeFromTabOrder(element: HTMLElement): void {
  element.setAttribute('tabindex', '-1');
}

/**
 * Makes an element tabbable
 */
export function makeTabable(element: HTMLElement, index: number = 0): void {
  element.setAttribute('tabindex', String(index));
}

/**
 * Handle button activation with Enter/Space
 */
export function handleButtonKeyboard(element: HTMLElement, onClick: () => void): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * React hook for keyboard navigation
 */
export function useKeyboardNavigation(
  ref: React.RefObject<HTMLElement>,
  options: ArrowNavigationOptions = {}
) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return enableArrowNavigation(element, options);
  }, [ref, options]);
}

/**
 * React hook for focus trap
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element || !isActive) return;

    return trapFocus(element);
  }, [ref, isActive]);
}

/**
 * Restore focus to a previous element
 */
export class FocusManager {
  private previousElement: HTMLElement | null = null;

  save(): void {
    this.previousElement = document.activeElement as HTMLElement;
  }

  restore(): void {
    if (this.previousElement) {
      this.previousElement.focus();
      this.previousElement = null;
    }
  }
}

// Re-export React for hooks
import * as React from 'react';
