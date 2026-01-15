import { useState } from 'react';
import { CommandPalette, type Command } from '@/shared/ui/CommandPalette';
import { Home, FileText, Settings, User, Download, Upload, Trash2, Copy, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CommandPaletteTest() {
  const navigate = useNavigate();
  const [recentCommands, setRecentCommands] = useState<string[]>(['home', 'settings']);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const logAction = (action: string) => {
    setActionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${action}`]);
  };

  const addToRecent = (commandId: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      return [commandId, ...filtered].slice(0, 5); // Keep last 5
    });
  };

  const commands: Command[] = [
    // Navigation commands
    {
      id: 'home',
      label: 'Go to Home',
      description: 'Navigate to the home page',
      group: 'navigation',
      keywords: ['dashboard', 'main'],
      icon: <Home className="h-4 w-4" />,
      onSelect: () => {
        logAction('Navigate to Home');
        addToRecent('home');
        navigate('/');
      }
    },
    {
      id: 'chat',
      label: 'Go to Chat',
      description: 'Open the chat interface',
      group: 'navigation',
      keywords: ['conversation', 'messages'],
      icon: <FileText className="h-4 w-4" />,
      onSelect: () => {
        logAction('Navigate to Chat');
        addToRecent('chat');
        navigate('/chat');
      }
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Manage your preferences',
      group: 'navigation',
      keywords: ['preferences', 'config'],
      icon: <Settings className="h-4 w-4" />,
      onSelect: () => {
        logAction('Open Settings');
        addToRecent('settings');
      }
    },
    {
      id: 'profile',
      label: 'View Profile',
      description: 'See your user profile',
      group: 'navigation',
      keywords: ['account', 'user'],
      icon: <User className="h-4 w-4" />,
      onSelect: () => {
        logAction('View Profile');
        addToRecent('profile');
      }
    },

    // Action commands
    {
      id: 'download',
      label: 'Download Report',
      description: 'Download the current report as PDF',
      group: 'actions',
      keywords: ['export', 'pdf', 'save'],
      icon: <Download className="h-4 w-4" />,
      onSelect: () => {
        logAction('Download Report');
        addToRecent('download');
      }
    },
    {
      id: 'upload',
      label: 'Upload Document',
      description: 'Upload a new document',
      group: 'actions',
      keywords: ['import', 'file', 'add'],
      icon: <Upload className="h-4 w-4" />,
      onSelect: () => {
        logAction('Upload Document');
        addToRecent('upload');
      }
    },
    {
      id: 'delete',
      label: 'Delete Item',
      description: 'Remove the selected item',
      group: 'actions',
      keywords: ['remove', 'trash', 'discard'],
      icon: <Trash2 className="h-4 w-4" />,
      onSelect: () => {
        logAction('Delete Item');
        addToRecent('delete');
      }
    },
    {
      id: 'copy',
      label: 'Copy to Clipboard',
      description: 'Copy the current content',
      group: 'actions',
      keywords: ['clipboard', 'duplicate'],
      icon: <Copy className="h-4 w-4" />,
      onSelect: () => {
        logAction('Copy to Clipboard');
        addToRecent('copy');
      }
    },
    {
      id: 'search',
      label: 'Search Applications',
      description: 'Search through all applications',
      group: 'actions',
      keywords: ['find', 'lookup', 'query'],
      icon: <Search className="h-4 w-4" />,
      onSelect: () => {
        logAction('Search Applications');
        addToRecent('search');
      }
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-[#E3E3E3] p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#061623] mb-2">Command Palette Test</h1>
          <p className="text-[#6B7280] mb-4">
            Test the command palette functionality with keyboard shortcuts and fuzzy search.
          </p>

          <div className="space-y-4">
            <div className="bg-[#30714C]/10 border border-[#30714C]/20 rounded-lg p-4">
              <h3 className="font-semibold text-[#061623] mb-2">How to Use:</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>• Press <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">Cmd+K</kbd> or <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">Ctrl+K</kbd> to open the command palette</li>
                <li>• Type to search commands with fuzzy matching (e.g., "stgs" finds "Settings")</li>
                <li>• Use <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">↑</kbd> and <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">↓</kbd> arrow keys to navigate</li>
                <li>• Press <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">Enter</kbd> to select a command</li>
                <li>• Press <kbd className="px-2 py-1 bg-white border border-[#E3E3E3] rounded text-xs font-mono">Escape</kbd> to close</li>
              </ul>
            </div>

            <div className="bg-[#F3F4F6] rounded-lg p-4">
              <h3 className="font-semibold text-[#061623] mb-2">Recent Commands:</h3>
              <div className="flex flex-wrap gap-2">
                {recentCommands.length > 0 ? (
                  recentCommands.map(id => {
                    const cmd = commands.find(c => c.id === id);
                    return cmd ? (
                      <span key={id} className="px-3 py-1 bg-white border border-[#E3E3E3] rounded-full text-sm text-[#061623]">
                        {cmd.label}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-[#6B7280]">No recent commands yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#E3E3E3] p-6">
          <h2 className="text-lg font-semibold text-[#061623] mb-3">Action Log</h2>
          <div className="bg-[#061623] rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
            {actionLog.length === 0 ? (
              <div className="text-[#6B7280]">Waiting for commands...</div>
            ) : (
              <div className="space-y-1">
                {actionLog.map((log, idx) => (
                  <div key={idx} className="text-[#30714C]">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette Component */}
      <CommandPalette
        commands={commands}
        recentCommands={recentCommands}
        placeholder="Search commands..."
      />
    </div>
  );
}
