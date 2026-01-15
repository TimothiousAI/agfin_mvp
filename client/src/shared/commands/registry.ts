/**
 * Command Registry System
 *
 * Centralized system for managing application commands with keyboard shortcuts,
 * metadata, and dynamic availability.
 */

import { searchCommands as enhancedSearch, type SearchResult } from './search';

export type CommandCategory = 'navigation' | 'actions' | 'search';

export interface CommandShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface CommandDefinition {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  shortcut?: CommandShortcut;
  keywords?: string[];
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  /** Function to determine if command is available in current context */
  isAvailable?: () => boolean;
}

export interface RegisteredCommand extends CommandDefinition {
  registeredAt: Date;
}

class CommandRegistry {
  private commands: Map<string, RegisteredCommand> = new Map();
  private shortcuts: Map<string, string> = new Map(); // shortcut key -> command id

  /**
   * Register a new command
   */
  register(command: CommandDefinition): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command with id "${command.id}" is already registered. Overwriting.`);
    }

    const registered: RegisteredCommand = {
      ...command,
      registeredAt: new Date()
    };

    this.commands.set(command.id, registered);

    // Register shortcut if provided
    if (command.shortcut) {
      const shortcutKey = this.getShortcutKey(command.shortcut);
      this.shortcuts.set(shortcutKey, command.id);
    }
  }

  /**
   * Register multiple commands at once
   */
  registerMany(commands: CommandDefinition[]): void {
    commands.forEach(cmd => this.register(cmd));
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;

    // Remove shortcut mapping
    if (command.shortcut) {
      const shortcutKey = this.getShortcutKey(command.shortcut);
      this.shortcuts.delete(shortcutKey);
    }

    return this.commands.delete(commandId);
  }

  /**
   * Get a command by ID
   */
  getCommand(commandId: string): RegisteredCommand | undefined {
    return this.commands.get(commandId);
  }

  /**
   * Get all registered commands
   */
  getAllCommands(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get available commands (respects isAvailable function)
   */
  getAvailableCommands(): RegisteredCommand[] {
    return this.getAllCommands().filter(cmd => {
      if (!cmd.isAvailable) return true;
      return cmd.isAvailable();
    });
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): RegisteredCommand[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Execute a command by ID
   */
  async execute(commandId: string): Promise<boolean> {
    const command = this.commands.get(commandId);
    if (!command) {
      console.warn(`Command "${commandId}" not found`);
      return false;
    }

    // Check availability
    if (command.isAvailable && !command.isAvailable()) {
      console.warn(`Command "${commandId}" is not available in current context`);
      return false;
    }

    try {
      await command.action();
      return true;
    } catch (error) {
      console.error(`Error executing command "${commandId}":`, error);
      return false;
    }
  }

  /**
   * Find command by keyboard shortcut
   */
  getCommandByShortcut(shortcut: CommandShortcut): RegisteredCommand | undefined {
    const shortcutKey = this.getShortcutKey(shortcut);
    const commandId = this.shortcuts.get(shortcutKey);
    return commandId ? this.commands.get(commandId) : undefined;
  }

  /**
   * Search commands by query (enhanced fuzzy search with scoring)
   */
  search(query: string, maxResults?: number): RegisteredCommand[] {
    const results = enhancedSearch(this.getAvailableCommands(), query, { maxResults });
    return results.map(r => r.command);
  }

  /**
   * Search commands with detailed results (includes scores and match info)
   */
  searchWithDetails(query: string, maxResults?: number): SearchResult[] {
    return enhancedSearch(this.getAvailableCommands(), query, { maxResults });
  }

  /**
   * Clear all registered commands
   */
  clear(): void {
    this.commands.clear();
    this.shortcuts.clear();
  }

  /**
   * Get shortcut key string for mapping
   */
  private getShortcutKey(shortcut: CommandShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Meta');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: CommandShortcut): string {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');

    // Format key
    const key = shortcut.key.length === 1
      ? shortcut.key.toUpperCase()
      : shortcut.key;
    parts.push(key);

    return parts.join(isMac ? '' : '+');
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();

// Convenience exports
export const registerCommand = (cmd: CommandDefinition) => commandRegistry.register(cmd);
export const registerCommands = (cmds: CommandDefinition[]) => commandRegistry.registerMany(cmds);
export const executeCommand = (id: string) => commandRegistry.execute(id);
export const getCommand = (id: string) => commandRegistry.getCommand(id);
export const getAllCommands = () => commandRegistry.getAllCommands();
export const getAvailableCommands = () => commandRegistry.getAvailableCommands();
