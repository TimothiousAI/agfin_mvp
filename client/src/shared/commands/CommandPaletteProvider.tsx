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
        open={open}
        onOpenChange={setOpen}
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
