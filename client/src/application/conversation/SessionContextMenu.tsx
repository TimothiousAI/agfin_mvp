import { useState } from 'react';
import type { ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  Pin,
  PinOff,
  Archive,
  Edit2,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

/**
 * Session Context Menu Component
 * Right-click menu for session actions
 */

export interface SessionContextMenuProps {
  children: ReactNode;
  sessionId: string;
  sessionTitle?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  onPin?: (sessionId: string) => void;
  onUnpin?: (sessionId: string) => void;
  onArchive?: (sessionId: string) => void;
  onRename?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  onCopyLink?: (sessionId: string) => void;
}

export function SessionContextMenu({
  children,
  sessionId,
  sessionTitle: _sessionTitle,
  isPinned = false,
  isArchived = false,
  onPin,
  onUnpin,
  onArchive,
  onRename,
  onDelete,
  onCopyLink,
}: SessionContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePinToggle = () => {
    if (isPinned && onUnpin) {
      onUnpin(sessionId);
    } else if (!isPinned && onPin) {
      onPin(sessionId);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm && onDelete) {
      onDelete(sessionId);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(sessionId);
    }
    // Also copy to clipboard
    const url = `${window.location.origin}/conversations/${sessionId}`;
    navigator.clipboard.writeText(url).catch(console.error);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="
            min-w-[220px]
            bg-white
            rounded-md
            shadow-lg
            border border-gray-200
            p-1
            z-50
          "
        >
          {/* Pin/Unpin */}
          {(onPin || onUnpin) && (
            <ContextMenu.Item
              onClick={handlePinToggle}
              className="
                flex items-center gap-2
                px-3 py-2
                text-sm text-gray-700
                rounded
                cursor-pointer
                outline-none
                hover:bg-gray-100
                focus:bg-gray-100
              "
            >
              {isPinned ? (
                <>
                  <PinOff className="w-4 h-4" />
                  <span>Unpin</span>
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4" />
                  <span>Pin</span>
                </>
              )}
            </ContextMenu.Item>
          )}

          {/* Rename */}
          {onRename && (
            <ContextMenu.Item
              onClick={() => onRename(sessionId)}
              className="
                flex items-center gap-2
                px-3 py-2
                text-sm text-gray-700
                rounded
                cursor-pointer
                outline-none
                hover:bg-gray-100
                focus:bg-gray-100
              "
            >
              <Edit2 className="w-4 h-4" />
              <span>Rename</span>
            </ContextMenu.Item>
          )}

          {/* Archive */}
          {onArchive && !isArchived && (
            <ContextMenu.Item
              onClick={() => onArchive(sessionId)}
              className="
                flex items-center gap-2
                px-3 py-2
                text-sm text-gray-700
                rounded
                cursor-pointer
                outline-none
                hover:bg-gray-100
                focus:bg-gray-100
              "
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </ContextMenu.Item>
          )}

          {/* Copy Link */}
          {onCopyLink && (
            <ContextMenu.Item
              onClick={handleCopyLink}
              className="
                flex items-center gap-2
                px-3 py-2
                text-sm text-gray-700
                rounded
                cursor-pointer
                outline-none
                hover:bg-gray-100
                focus:bg-gray-100
              "
            >
              <LinkIcon className="w-4 h-4" />
              <span>Copy Link</span>
            </ContextMenu.Item>
          )}

          {/* Separator */}
          {onDelete && (
            <ContextMenu.Separator className="h-px bg-gray-200 my-1" />
          )}

          {/* Delete */}
          {onDelete && (
            <ContextMenu.Item
              onClick={handleDelete}
              onBlur={() => setShowDeleteConfirm(false)}
              className="
                flex items-center gap-2
                px-3 py-2
                text-sm
                rounded
                cursor-pointer
                outline-none
                hover:bg-red-50
                focus:bg-red-50
                text-red-600
              "
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
              </span>
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export default SessionContextMenu;
