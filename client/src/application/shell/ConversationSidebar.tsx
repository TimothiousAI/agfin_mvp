import { Plus, PanelLeftClose, MessageSquare } from 'lucide-react';
import { usePanelStore } from './usePanelStore';

interface ConversationSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
}

interface ConversationSidebarProps {
  sessions?: ConversationSession[];
  onNewConversation?: () => void;
  onSelectSession?: (sessionId: string) => void;
  activeSessionId?: string;
}

export function ConversationSidebar({
  sessions = [],
  onNewConversation,
  onSelectSession,
  activeSessionId,
}: ConversationSidebarProps) {
  const sidebarCollapsed = usePanelStore((state) => state.sidebarCollapsed);
  const toggleSidebar = usePanelStore((state) => state.toggleSidebar);

  return (
    <div
      className={`
        flex flex-col h-full bg-[#061623]
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-[280px] opacity-100'}
      `}
    >
      {/* Header with Agrellus Logo */}
      <div className="h-16 bg-[#30714C] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Agrellus Logo */}
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#30714C] font-bold text-lg">A</span>
          </div>
          <h1 className="text-white font-semibold text-lg">AgFin</h1>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 flex-shrink-0">
        <button
          onClick={onNewConversation}
          aria-label="Start new conversation"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#30714C] hover:bg-[#3d8a5f] text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Scrollable Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 px-4 text-center">
            <MessageSquare size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new conversation above</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession?.(session.id)}
                aria-label={`Open conversation: ${session.title}`}
                className={`
                  w-full text-left px-3 py-3 rounded-lg transition-colors
                  ${
                    activeSessionId === session.id
                      ? 'bg-[#0D2233] text-white'
                      : 'text-white/60 hover:bg-[#0D2233]/50 hover:text-white'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare size={16} className="flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    {session.lastMessage && (
                      <p className="text-xs opacity-60 truncate mt-1">
                        {session.lastMessage}
                      </p>
                    )}
                    <p className="text-xs opacity-40 mt-1">
                      {formatTimestamp(session.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format timestamp
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
