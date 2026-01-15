import { useState, useEffect } from 'react';
import { Play, Trash2, RefreshCw } from 'lucide-react';
import {
  commandRegistry,
  registerCommand,
  executeCommand,
  getAllCommands,
  type CommandDefinition
} from '@/shared/commands';

export function CommandRegistryTest() {
  const [commands, setCommands] = useState(getAllCommands());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(getAllCommands());
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const logExecution = (message: string) => {
    setExecutionLog(prev => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev
    ].slice(0, 20));
  };

  // Register test commands on mount
  useEffect(() => {
    // Clear any existing commands
    commandRegistry.clear();

    // Register test commands
    const testCommands: CommandDefinition[] = [
      {
        id: 'test.action1',
        label: 'Test Action 1',
        description: 'Execute test action 1',
        category: 'actions',
        keywords: ['test', 'action', 'first'],
        action: () => {
          logExecution('Test Action 1 executed');
        }
      },
      {
        id: 'test.action2',
        label: 'Test Action 2',
        description: 'Execute test action 2',
        category: 'actions',
        keywords: ['test', 'action', 'second'],
        shortcut: { key: 't', ctrl: true, shift: true },
        action: () => {
          logExecution('Test Action 2 executed (with shortcut: Ctrl+Shift+T)');
        }
      },
      {
        id: 'test.nav1',
        label: 'Navigate to Page 1',
        description: 'Go to test page 1',
        category: 'navigation',
        keywords: ['navigate', 'page', 'first'],
        action: () => {
          logExecution('Navigation to Page 1');
        }
      },
      {
        id: 'test.nav2',
        label: 'Navigate to Page 2',
        description: 'Go to test page 2',
        category: 'navigation',
        keywords: ['navigate', 'page', 'second'],
        action: () => {
          logExecution('Navigation to Page 2');
        }
      },
      {
        id: 'test.search',
        label: 'Search Items',
        description: 'Search for items',
        category: 'search',
        keywords: ['search', 'find', 'lookup'],
        action: () => {
          logExecution('Search executed');
        }
      },
      {
        id: 'test.conditional',
        label: 'Conditional Command',
        description: 'Only available when count > 5',
        category: 'actions',
        keywords: ['conditional', 'dynamic'],
        isAvailable: () => executionLog.length > 5,
        action: () => {
          logExecution('Conditional command executed (only available after 5 logs)');
        }
      }
    ];

    testCommands.forEach(cmd => registerCommand(cmd));
    setCommands(getAllCommands());
    setSearchResults(getAllCommands());
  }, []);

  // Update search results when query changes
  useEffect(() => {
    setSearchResults(commandRegistry.search(searchQuery));
  }, [searchQuery, commands]);

  const handleExecute = async (commandId: string) => {
    const success = await executeCommand(commandId);
    if (success) {
      logExecution(`✓ Executed: ${commandId}`);
    } else {
      logExecution(`✗ Failed to execute: ${commandId}`);
    }
    // Refresh commands list to update availability
    setCommands(getAllCommands());
  };

  const handleClear = () => {
    commandRegistry.clear();
    setCommands([]);
    setSearchResults([]);
    logExecution('Registry cleared');
  };

  const handleRefresh = () => {
    setCommands(getAllCommands());
    setSearchResults(commandRegistry.search(searchQuery));
    logExecution('Registry refreshed');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E3E3E3] p-6">
          <h1 className="text-2xl font-bold text-[#061623] mb-2">Command Registry Test</h1>
          <p className="text-[#6B7280] mb-4">
            Test the command registry system with registration, execution, search, and dynamic availability.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#30714C] text-white rounded-md hover:bg-[#30714C]/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Registry
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-[#C1201C] text-white rounded-md hover:bg-[#C1201C]/90 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Registry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commands List */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E3E3E3] p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#061623] mb-2">
                Registered Commands ({commands.length})
              </h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands..."
                className="w-full px-3 py-2 border border-[#E3E3E3] rounded-md text-sm focus:outline-none focus:border-[#30714C] focus:ring-2 focus:ring-[#30714C]/20"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-[#6B7280]">
                  {commands.length === 0 ? 'No commands registered' : 'No matching commands'}
                </div>
              ) : (
                searchResults.map((cmd) => {
                  const isAvailable = cmd.isAvailable ? cmd.isAvailable() : true;
                  return (
                    <div
                      key={cmd.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isAvailable
                          ? 'border-[#E3E3E3] bg-white hover:bg-[#F3F4F6]'
                          : 'border-[#E3E3E3] bg-[#F9FAFB] opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#061623]">{cmd.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#30714C]/10 text-[#30714C]">
                              {cmd.category}
                            </span>
                            {!isAvailable && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#A0A0A0]/10 text-[#6B7280]">
                                unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280] mb-1">{cmd.description}</p>
                          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                            <code className="font-mono">{cmd.id}</code>
                            {cmd.shortcut && (
                              <span className="px-1.5 py-0.5 bg-[#F3F4F6] rounded border border-[#E3E3E3]">
                                {commandRegistry.formatShortcut(cmd.shortcut)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecute(cmd.id)}
                          disabled={!isAvailable}
                          className="flex-shrink-0 p-2 rounded-md bg-[#30714C] text-white hover:bg-[#30714C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Execution Log */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E3E3E3] p-6">
            <h2 className="text-lg font-semibold text-[#061623] mb-4">
              Execution Log
            </h2>
            <div className="bg-[#061623] rounded-lg p-4 font-mono text-sm h-[500px] overflow-y-auto">
              {executionLog.length === 0 ? (
                <div className="text-[#6B7280]">Waiting for commands...</div>
              ) : (
                <div className="space-y-1">
                  {executionLog.map((log, idx) => (
                    <div key={idx} className="text-[#30714C]">{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-[#30714C]/10 border border-[#30714C]/20 rounded-lg p-4">
          <h3 className="font-semibold text-[#061623] mb-2">Test Features:</h3>
          <ul className="space-y-1 text-sm text-[#6B7280]">
            <li>• <strong>Registration:</strong> Commands are auto-registered on page load</li>
            <li>• <strong>Search:</strong> Type in search box to filter commands (fuzzy matching)</li>
            <li>• <strong>Execution:</strong> Click play button to execute commands</li>
            <li>• <strong>Categories:</strong> Commands grouped by navigation, actions, search</li>
            <li>• <strong>Shortcuts:</strong> Some commands have keyboard shortcuts displayed</li>
            <li>• <strong>Dynamic Availability:</strong> "Conditional Command" only available after 5 executions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
