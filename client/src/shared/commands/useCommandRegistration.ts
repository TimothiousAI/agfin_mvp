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
