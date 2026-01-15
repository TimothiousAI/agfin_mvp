import { useState } from 'react';
import {
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
  startOfDay,
} from 'date-fns';
import { Session } from './SessionList';

/**
 * Session Groups Component
 * Groups sessions chronologically into collapsible sections:
 * - Today
 * - Yesterday
 * - Previous 7 Days
 * - Older
 */

export interface SessionGroupsProps {
  sessions: Session[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
  renderSessionItem: (session: Session, isActive: boolean) => React.ReactNode;
}

interface SessionGroup {
  label: string;
  sessions: Session[];
}

function groupSessionsByDate(sessions: Session[]): SessionGroup[] {
  const now = new Date();
  const sevenDaysAgo = startOfDay(subDays(now, 7));

  const groups: SessionGroup[] = [
    { label: 'Today', sessions: [] },
    { label: 'Yesterday', sessions: [] },
    { label: 'Previous 7 Days', sessions: [] },
    { label: 'Older', sessions: [] },
  ];

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updated_at);

    if (isToday(sessionDate)) {
      groups[0].sessions.push(session);
    } else if (isYesterday(sessionDate)) {
      groups[1].sessions.push(session);
    } else if (
      isWithinInterval(sessionDate, {
        start: sevenDaysAgo,
        end: startOfDay(subDays(now, 2)),
      })
    ) {
      groups[2].sessions.push(session);
    } else {
      groups[3].sessions.push(session);
    }
  });

  // Filter out empty groups
  return groups.filter((group) => group.sessions.length > 0);
}

export function SessionGroups({
  sessions,
  activeSessionId,
  onSessionClick,
  renderSessionItem,
}: SessionGroupsProps) {
  const groups = groupSessionsByDate(sessions);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.label);

        return (
          <div key={group.label} className="mb-2">
            {/* Section Header - Sticky */}
            <button
              onClick={() => toggleGroup(group.label)}
              className="sticky top-0 z-10 w-full px-3 py-2 bg-gray-50 border-b border-gray-200 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Collapse/Expand Icon */}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isCollapsed ? '-rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {group.label}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {group.sessions.length}
              </span>
            </button>

            {/* Session Items */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100">
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSessionClick(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSessionClick(session.id);
                      }
                    }}
                  >
                    {renderSessionItem(
                      session,
                      session.id === activeSessionId
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SessionGroups;
