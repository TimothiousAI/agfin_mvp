/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts grouped by category.
 * Shows Mac/Windows variants and includes search functionality.
 */

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Input } from './input';
import { Search, ExternalLink, Command } from 'lucide-react';
import { SHORTCUT_CATEGORIES } from '../commands/defaultShortcuts';
import { NAVIGATION_CATEGORIES } from '../commands/navigationShortcuts';

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutItem[];
}

export interface KeyboardShortcutsHelpProps {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when modal is closed */
  onOpenChange?: (open: boolean) => void;
  /** Additional custom shortcuts to display */
  customShortcuts?: ShortcutCategory[];
  /** Link to documentation */
  docsUrl?: string;
}

/**
 * Keyboard Shortcuts Help Modal Component
 *
 * @example
 * ```tsx
 * const [helpOpen, setHelpOpen] = useState(false);
 *
 * // Open with Cmd/Ctrl+?
 * useKeyboardShortcut({
 *   key: '?',
 *   ctrl: true,
 *   handler: () => setHelpOpen(true)
 * });
 *
 * <KeyboardShortcutsHelp
 *   open={helpOpen}
 *   onOpenChange={setHelpOpen}
 *   docsUrl="https://docs.example.com/shortcuts"
 * />
 * ```
 */
export function KeyboardShortcutsHelp({
  open = false,
  onOpenChange,
  customShortcuts = [],
  docsUrl
}: KeyboardShortcutsHelpProps) {
  const [search, setSearch] = React.useState('');

  // Combine all shortcuts
  const allCategories: ShortcutCategory[] = React.useMemo(() => {
    return [
      { name: SHORTCUT_CATEGORIES.CHAT.name, shortcuts: [...SHORTCUT_CATEGORIES.CHAT.shortcuts] },
      { name: SHORTCUT_CATEGORIES.MESSAGING.name, shortcuts: [...SHORTCUT_CATEGORIES.MESSAGING.shortcuts] },
      { name: SHORTCUT_CATEGORIES.NAVIGATION.name, shortcuts: [...SHORTCUT_CATEGORIES.NAVIGATION.shortcuts] },
      { name: SHORTCUT_CATEGORIES.INTERFACE.name, shortcuts: [...SHORTCUT_CATEGORIES.INTERFACE.shortcuts] },
      { name: NAVIGATION_CATEGORIES.DOCUMENT_NAVIGATION.name, shortcuts: [...NAVIGATION_CATEGORIES.DOCUMENT_NAVIGATION.shortcuts] },
      { name: NAVIGATION_CATEGORIES.MODULE_JUMPING.name, shortcuts: [...NAVIGATION_CATEGORIES.MODULE_JUMPING.shortcuts] },
      { name: NAVIGATION_CATEGORIES.FORM_ACTIONS.name, shortcuts: [...NAVIGATION_CATEGORIES.FORM_ACTIONS.shortcuts] },
      ...customShortcuts
    ] as ShortcutCategory[];
  }, [customShortcuts]);

  // Filter shortcuts based on search
  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return allCategories;

    const query = search.toLowerCase();
    return allCategories
      .map(category => ({
        ...category,
        shortcuts: category.shortcuts.filter(
          shortcut =>
            shortcut.key.toLowerCase().includes(query) ||
            shortcut.description.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.shortcuts.length > 0);
  }, [allCategories, search]);

  // Reset search when modal closes
  React.useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#061623]">
            <Command className="h-5 w-5 text-[#30714C]" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              No shortcuts found matching "{search}"
            </div>
          ) : (
            filteredCategories.map((category, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-sm font-semibold text-[#30714C] uppercase tracking-wider">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIdx) => (
                    <ShortcutRow
                      key={shortcutIdx}
                      keyCombo={shortcut.key}
                      description={shortcut.description}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E3E3E3]">
          <div className="text-xs text-[#6B7280]">
            {filteredCategories.reduce((acc, cat) => acc + cat.shortcuts.length, 0)} shortcuts
          </div>
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#30714C] hover:text-[#25563A] transition-colors"
            >
              View Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Platform hint */}
        <div className="text-xs text-[#A0A0A0] text-center">
          {typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
            ? '⌘ = Command key'
            : 'Ctrl = Control key'}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual shortcut row component
 */
interface ShortcutRowProps {
  keyCombo: string;
  description: string;
}

function ShortcutRow({ keyCombo, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-[#F3F4F6] transition-colors">
      <span className="text-sm text-[#061623]">{description}</span>
      <kbd className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[#6B7280] bg-white rounded border border-[#E3E3E3] shadow-sm">
        {keyCombo}
      </kbd>
    </div>
  );
}

/**
 * Hook to open shortcuts help with Cmd/Ctrl+?
 */
export function useShortcutsHelpTrigger(onOpen: () => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+? or Cmd/Ctrl+Shift+/
      if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
