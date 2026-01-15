import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SessionGroups } from './SessionGroups';
import { NewConversationButton } from './NewConversationButton';
import { SessionSearch, useSessionFilter, EmptySearchResults } from './SessionSearch';
import { SessionContextMenu } from './SessionContextMenu';

/**
 * Session List Component
 * Displays a list of chat sessions in the conversation sidebar with date-based grouping, search, and context menu
 */

export interface Session {
  id: string;
  title?: string;
  first_message?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface SessionListProps {
  sessions: Session[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
  onNewSession?: () => void;
  onPinSession?: (sessionId: string) => void;
  onUnpinSession?: (sessionId: string) => void;
  onArchiveSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onCopySessionLink?: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionClick,
  onNewSession,
  onPinSession,
  onUnpinSession,
  onArchiveSession,
  onRenameSession,
  onDeleteSession,
  onCopySessionLink,
}: SessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredSessions = useSessionFilter(sessions, searchQuery);

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Start a new conversation to get help with your application
          </p>
        </div>
        {onNewSession && (
          <NewConversationButton onClick={onNewSession} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Session Button */}
      {onNewSession && (
        <div className="p-3 border-b border-gray-200">
          <NewConversationButton onClick={onNewSession} />
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <SessionSearch onSearchChange={setSearchQuery} />
      </div>

      {/* Sessions List with Grouping */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 && searchQuery ? (
          <EmptySearchResults query={searchQuery} />
        ) : (
          <SessionGroups
            sessions={filteredSessions}
            activeSessionId={activeSessionId}
            onSessionClick={onSessionClick}
            renderSessionItem={(session, isActive) => (
              <SessionContextMenu
                sessionId={session.id}
                sessionTitle={session.title}
                onPin={onPinSession}
                onUnpin={onUnpinSession}
                onArchive={onArchiveSession}
                onRename={onRenameSession}
                onDelete={onDeleteSession}
                onCopyLink={onCopySessionLink}
              >
                <SessionListItem
                  session={session}
                  isActive={isActive}
                  onClick={() => onSessionClick(session.id)}
                />
              </SessionContextMenu>
            )}
          />
        )}
      </div>
    </div>
  );
}

interface SessionListItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
}

function SessionListItem({ session, isActive, onClick }: SessionListItemProps) {
  // Get display title - use title if available, otherwise first message preview
  const displayTitle = session.title || session.first_message || 'Untitled conversation';
  const truncatedTitle = displayTitle.length > 50
    ? `${displayTitle.substring(0, 50)}...`
    : displayTitle;

  // Format relative timestamp
  const relativeTime = formatDistanceToNow(new Date(session.updated_at), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 text-left border-b border-gray-100 transition-colors
        hover:bg-gray-50
        ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Session Title */}
          <h3
            className={`
              text-sm font-medium truncate
              ${isActive ? 'text-blue-900' : 'text-gray-900'}
            `}
          >
            {truncatedTitle}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{relativeTime}</span>
            {session.message_count !== undefined && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  {session.message_count} {session.message_count === 1 ? 'message' : 'messages'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          </div>
        )}
      </div>
    </button>
  );
}

export default SessionList;
