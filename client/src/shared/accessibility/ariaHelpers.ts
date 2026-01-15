/**
 * ARIA Helpers
 *
 * Utilities for implementing ARIA attributes correctly
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * ARIA label props for icon-only buttons
 */
export interface AriaLabelProps {
  'aria-label': string;
  role?: string;
}

export function iconButtonLabel(label: string): AriaLabelProps {
  return {
    'aria-label': label,
  };
}

/**
 * ARIA props for labeled form fields
 */
export interface AriaLabelledByProps {
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id: string;
}

export function formFieldAria(
  labelId?: string,
  descriptionId?: string,
  fieldId?: string
): AriaLabelledByProps {
  const id = fieldId || generateAriaId('field');
  return {
    id,
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
  };
}

/**
 * ARIA props for collapsible/expandable elements
 */
export interface AriaExpandableProps {
  'aria-expanded': boolean;
  'aria-controls'?: string;
}

export function collapsibleAria(
  isExpanded: boolean,
  contentId?: string
): AriaExpandableProps {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': contentId,
  };
}

/**
 * ARIA props for tabs
 */
export interface AriaTabProps {
  role: 'tab';
  'aria-selected': boolean;
  'aria-controls': string;
  id: string;
  tabIndex: number;
}

export function tabAria(
  isSelected: boolean,
  panelId: string,
  tabId?: string
): AriaTabProps {
  return {
    role: 'tab',
    'aria-selected': isSelected,
    'aria-controls': panelId,
    id: tabId || generateAriaId('tab'),
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * ARIA props for tab panels
 */
export interface AriaTabPanelProps {
  role: 'tabpanel';
  'aria-labelledby': string;
  id: string;
  tabIndex: number;
}

export function tabPanelAria(
  tabId: string,
  panelId?: string
): AriaTabPanelProps {
  return {
    role: 'tabpanel',
    'aria-labelledby': tabId,
    id: panelId || generateAriaId('panel'),
    tabIndex: 0,
  };
}

/**
 * ARIA props for live regions
 */
export interface AriaLiveProps {
  'aria-live': 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
}

export function liveRegionAria(
  politeness: 'off' | 'polite' | 'assertive' = 'polite',
  atomic: boolean = true
): AriaLiveProps {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': 'additions text',
  };
}

/**
 * ARIA props for dialogs/modals
 */
export interface AriaDialogProps {
  role: 'dialog' | 'alertdialog';
  'aria-modal': boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function dialogAria(
  isAlert: boolean = false,
  titleId?: string,
  descId?: string
): AriaDialogProps {
  return {
    role: isAlert ? 'alertdialog' : 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-describedby': descId,
  };
}

/**
 * ARIA props for menus
 */
export interface AriaMenuProps {
  role: 'menu';
  'aria-labelledby'?: string;
  'aria-orientation'?: 'vertical' | 'horizontal';
}

export function menuAria(
  labelId?: string,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): AriaMenuProps {
  return {
    role: 'menu',
    'aria-labelledby': labelId,
    'aria-orientation': orientation,
  };
}

/**
 * ARIA props for menu items
 */
export interface AriaMenuItemProps {
  role: 'menuitem';
  tabIndex: number;
}

export function menuItemAria(): AriaMenuItemProps {
  return {
    role: 'menuitem',
    tabIndex: -1,
  };
}

/**
 * ARIA props for checkboxes
 */
export interface AriaCheckboxProps {
  role: 'checkbox';
  'aria-checked': boolean | 'mixed';
  'aria-labelledby'?: string;
  tabIndex: number;
}

export function checkboxAria(
  isChecked: boolean | 'mixed',
  labelId?: string
): AriaCheckboxProps {
  return {
    role: 'checkbox',
    'aria-checked': isChecked,
    'aria-labelledby': labelId,
    tabIndex: 0,
  };
}

/**
 * ARIA props for radio buttons
 */
export interface AriaRadioProps {
  role: 'radio';
  'aria-checked': boolean;
  tabIndex: number;
}

export function radioAria(isChecked: boolean): AriaRadioProps {
  return {
    role: 'radio',
    'aria-checked': isChecked,
    tabIndex: isChecked ? 0 : -1,
  };
}

/**
 * ARIA props for switches/toggles
 */
export interface AriaSwitchProps {
  role: 'switch';
  'aria-checked': boolean;
  'aria-labelledby'?: string;
  tabIndex: number;
}

export function switchAria(
  isOn: boolean,
  labelId?: string
): AriaSwitchProps {
  return {
    role: 'switch',
    'aria-checked': isOn,
    'aria-labelledby': labelId,
    tabIndex: 0,
  };
}

/**
 * ARIA props for comboboxes/selects
 */
export interface AriaComboboxProps {
  role: 'combobox';
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-activedescendant'?: string;
  'aria-haspopup': 'listbox' | 'menu';
}

export function comboboxAria(
  isExpanded: boolean,
  listboxId: string,
  activeOptionId?: string
): AriaComboboxProps {
  return {
    role: 'combobox',
    'aria-expanded': isExpanded,
    'aria-controls': listboxId,
    'aria-activedescendant': activeOptionId,
    'aria-haspopup': 'listbox',
  };
}

/**
 * ARIA props for alerts
 */
export interface AriaAlertProps {
  role: 'alert';
  'aria-live': 'assertive';
  'aria-atomic': boolean;
}

export function alertAria(): AriaAlertProps {
  return {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': true,
  };
}

/**
 * ARIA props for status messages
 */
export interface AriaStatusProps {
  role: 'status';
  'aria-live': 'polite';
  'aria-atomic': boolean;
}

export function statusAria(): AriaStatusProps {
  return {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': true,
  };
}

/**
 * ARIA props for loading states
 */
export interface AriaLoadingProps {
  'aria-busy': boolean;
  'aria-live'?: 'polite';
}

export function loadingAria(isLoading: boolean): AriaLoadingProps {
  return {
    'aria-busy': isLoading,
    'aria-live': isLoading ? 'polite' : undefined,
  };
}

/**
 * ARIA props for invalid form fields
 */
export interface AriaInvalidProps {
  'aria-invalid': boolean;
  'aria-errormessage'?: string;
}

export function invalidFieldAria(
  isInvalid: boolean,
  errorId?: string
): AriaInvalidProps {
  return {
    'aria-invalid': isInvalid,
    'aria-errormessage': isInvalid ? errorId : undefined,
  };
}

/**
 * ARIA props for required form fields
 */
export interface AriaRequiredProps {
  'aria-required': boolean;
}

export function requiredFieldAria(isRequired: boolean): AriaRequiredProps {
  return {
    'aria-required': isRequired,
  };
}

/**
 * ARIA props for disabled elements
 */
export interface AriaDisabledProps {
  'aria-disabled': boolean;
}

export function disabledAria(isDisabled: boolean): AriaDisabledProps {
  return {
    'aria-disabled': isDisabled,
  };
}

/**
 * Combine multiple ARIA prop objects
 */
export function combineAria<T extends Record<string, any>>(
  ...ariaObjects: (T | undefined)[]
): Partial<T> {
  return Object.assign({}, ...ariaObjects.filter(Boolean));
}
