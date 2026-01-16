# Implementation Plan: Inline Session Rename

**Scope**: Enable inline session title editing by clicking the title (not just right-click menu)
**Services Affected**: client
**Estimated Steps**: 6

---

## Overview

This feature adds inline session renaming to the conversation sidebar, allowing users to click directly on a session title to edit it. This provides a smooth UX similar to file renaming in file explorers, complementing the existing right-click context menu rename option.

---

## Prerequisites

- [ ] Existing `useUpdateSession` mutation hook is available in `useSessionsApi.ts`
- [ ] Toast notification system is available via `use-toast.ts`

---

## Implementation Steps

### Phase 1: Create EditableSessionTitle Component

**Step 1.1**: Create a new reusable `EditableSessionTitle` component

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\EditableSessionTitle.tsx`
- Purpose: Encapsulate all inline edit logic (edit mode, input handling, keyboard events, loading state)

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export interface EditableSessionTitleProps {
  sessionId: string;
  title: string;
  isActive: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export function EditableSessionTitle({
  sessionId,
  title,
  isActive,
  isEditing,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
}: EditableSessionTitleProps) {
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when title changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== title) {
          onSave(trimmed);
        } else {
          onCancel();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditValue(title);
        onCancel();
      }
    },
    [editValue, title, onSave, onCancel]
  );

  const handleBlur = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  }, [editValue, title, onSave, onCancel]);

  const handleTitleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only enter edit mode on direct click, not during saving
      if (!isSaving) {
        e.stopPropagation();
        onStartEdit();
      }
    },
    [isSaving, onStartEdit]
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter key on focused title starts editing
      if (e.key === 'Enter' && !isEditing && !isSaving) {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit();
      }
    },
    [isEditing, isSaving, onStartEdit]
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className={`
            flex-1 min-w-0
            text-sm font-medium
            bg-white border border-blue-400 rounded px-1 py-0.5
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            ${isActive ? 'text-blue-900' : 'text-gray-900'}
          `}
          aria-label="Edit session title"
        />
        {isSaving && (
          <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
        )}
      </div>
    );
  }

  // Display mode - clickable title
  const displayTitle = title || 'Untitled conversation';
  const truncatedTitle =
    displayTitle.length > 50
      ? `${displayTitle.substring(0, 50)}...`
      : displayTitle;

  return (
    <span
      onClick={handleTitleClick}
      onKeyDown={handleTitleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Edit title: ${truncatedTitle}`}
      className={`
        text-sm font-medium truncate cursor-text
        hover:underline hover:decoration-dotted hover:decoration-gray-400
        focus:outline-none focus:ring-1 focus:ring-blue-400 focus:rounded
        ${isActive ? 'text-blue-900' : 'text-gray-900'}
      `}
    >
      {truncatedTitle}
    </span>
  );
}

export default EditableSessionTitle;
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run lint -- --quiet`

---

### Phase 2: Create useInlineRename Hook

**Step 2.1**: Create a custom hook to manage inline rename state and API calls

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useInlineRename.ts`
- Purpose: Manage editing state, coordinate with `useUpdateSession`, handle toasts

```typescript
import { useState, useCallback } from 'react';
import { useUpdateSession } from './useSessionsApi';
import { toast } from '../../shared/ui/use-toast';

interface UseInlineRenameOptions {
  onSuccess?: (sessionId: string, newTitle: string) => void;
  onError?: (sessionId: string, error: Error) => void;
}

export function useInlineRename(options: UseInlineRenameOptions = {}) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

  const updateSession = useUpdateSession();

  const startEditing = useCallback((sessionId: string) => {
    setEditingSessionId(sessionId);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingSessionId(null);
  }, []);

  const saveTitle = useCallback(
    async (sessionId: string, newTitle: string) => {
      setSavingSessionId(sessionId);

      try {
        await updateSession.mutateAsync({
          sessionId,
          updates: { title: newTitle },
        });

        toast({
          title: 'Session renamed',
          description: `Title updated to "${newTitle}"`,
          variant: 'success',
          duration: 3000,
        });

        options.onSuccess?.(sessionId, newTitle);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to rename session');

        toast({
          title: 'Rename failed',
          description: err.message,
          variant: 'error',
          duration: 5000,
        });

        options.onError?.(sessionId, err);
      } finally {
        setSavingSessionId(null);
        setEditingSessionId(null);
      }
    },
    [updateSession, options]
  );

  const isEditing = useCallback(
    (sessionId: string) => editingSessionId === sessionId,
    [editingSessionId]
  );

  const isSaving = useCallback(
    (sessionId: string) => savingSessionId === sessionId,
    [savingSessionId]
  );

  return {
    editingSessionId,
    savingSessionId,
    startEditing,
    cancelEditing,
    saveTitle,
    isEditing,
    isSaving,
  };
}

export default useInlineRename;
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run lint -- --quiet`

---

### Phase 3: Update SessionList Component

**Step 3.1**: Modify `SessionList.tsx` to integrate inline rename functionality

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\SessionList.tsx`
- Changes:
  - Import `useInlineRename` hook
  - Import `EditableSessionTitle` component
  - Pass rename state to `SessionListItem`
  - Update props interface to accept rename trigger from context menu

Add imports at the top:

```typescript
import { EditableSessionTitle } from './EditableSessionTitle';
import { useInlineRename } from './useInlineRename';
```

Update `SessionListProps` interface:

```typescript
export interface SessionListProps {
  sessions: Session[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
  onNewSession?: () => void;
  onPinSession?: (sessionId: string) => void;
  onUnpinSession?: (sessionId: string) => void;
  onArchiveSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void; // Kept for context menu trigger
  onDeleteSession?: (sessionId: string) => void;
  onCopySessionLink?: (sessionId: string) => void;
}
```

Update `SessionList` function:

```typescript
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

  // Inline rename hook
  const {
    startEditing,
    cancelEditing,
    saveTitle,
    isEditing,
    isSaving,
  } = useInlineRename();

  // Handler for context menu rename - triggers inline edit mode
  const handleRenameFromContextMenu = (sessionId: string) => {
    startEditing(sessionId);
    onRenameSession?.(sessionId);
  };

  // ... rest of component with updated renderSessionItem
```

Update the `renderSessionItem` call in `SessionGroups`:

```tsx
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
      onRename={handleRenameFromContextMenu}
      onDelete={onDeleteSession}
      onCopyLink={onCopySessionLink}
    >
      <SessionListItem
        session={session}
        isActive={isActive}
        onClick={() => onSessionClick(session.id)}
        isEditing={isEditing(session.id)}
        isSaving={isSaving(session.id)}
        onStartEdit={() => startEditing(session.id)}
        onSaveTitle={(newTitle) => saveTitle(session.id, newTitle)}
        onCancelEdit={cancelEditing}
      />
    </SessionContextMenu>
  )}
/>
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run lint -- --quiet`

---

### Phase 4: Update SessionListItem Component

**Step 4.1**: Modify `SessionListItem` to use `EditableSessionTitle`

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\SessionList.tsx`
- Changes: Update `SessionListItem` interface and implementation

Update `SessionListItemProps`:

```typescript
interface SessionListItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onSaveTitle: (newTitle: string) => void;
  onCancelEdit: () => void;
}
```

Update `SessionListItem` implementation:

```tsx
function SessionListItem({
  session,
  isActive,
  onClick,
  isEditing,
  isSaving,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
}: SessionListItemProps) {
  const displayTitle = session.title || session.first_message || 'Untitled conversation';

  // Format relative timestamp
  const relativeTime = formatDistanceToNow(new Date(session.updated_at), {
    addSuffix: true,
  });

  // Handle click - only navigate if not editing
  const handleClick = () => {
    if (!isEditing) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        w-full p-3 text-left border-b border-gray-100 transition-colors
        hover:bg-gray-50
        ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
        ${isEditing ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Editable Session Title */}
          <EditableSessionTitle
            sessionId={session.id}
            title={displayTitle}
            isActive={isActive}
            isEditing={isEditing}
            isSaving={isSaving}
            onStartEdit={onStartEdit}
            onSave={onSaveTitle}
            onCancel={onCancelEdit}
          />

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{relativeTime}</span>
            {session.message_count !== undefined && (
              <>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-500">
                  {session.message_count} {session.message_count === 1 ? 'message' : 'messages'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Active Indicator */}
        {isActive && !isEditing && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run lint -- --quiet`

---

### Phase 5: Update SessionGroups Click Handler

**Step 5.1**: Prevent session click when editing

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\SessionGroups.tsx`
- Changes: The outer div click handler should not interfere with editing

The current implementation wraps each session item in a clickable div. Since we changed `SessionListItem` to be a div instead of button and handle clicks internally, we need to ensure the wrapper doesn't interfere.

Update the session item wrapper in `SessionGroups.tsx`:

```tsx
{group.sessions.map((session) => (
  <div
    key={session.id}
    role="listitem"
  >
    {renderSessionItem(
      session,
      session.id === activeSessionId
    )}
  </div>
))}
```

Note: Remove the `onClick`, `onKeyDown`, `tabIndex`, and `role="button"` from the outer wrapper since click handling is now in `SessionListItem`.

**Validation**: `cd C:\Users\timca\Business\agfin_app\client && npm run lint -- --quiet`

---

### Phase 6: Add Duration to Toast Configuration

**Step 6.1**: Ensure toast duration prop is supported

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\use-toast.ts`
- Changes: Verify `duration` is passed through to toast (already supported by Radix)

The existing toast implementation should already support duration via Radix primitives. No changes needed if `duration` is included in `ToastProps`.

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `client/src/application/conversation/EditableSessionTitle.tsx` | Create | New component for editable title with input mode |
| `client/src/application/conversation/useInlineRename.ts` | Create | New hook for managing rename state and API calls |
| `client/src/application/conversation/SessionList.tsx` | Modify | Integrate inline rename into session list |
| `client/src/application/conversation/SessionGroups.tsx` | Modify | Update wrapper to not interfere with edit clicks |

---

## Acceptance Criteria

- [ ] Clicking on a session title enters edit mode (shows input field)
- [ ] Input field is auto-focused and text is selected on edit start
- [ ] Pressing Enter saves the new title and exits edit mode
- [ ] Pressing Escape cancels editing and reverts to original title
- [ ] Clicking outside the input (blur) saves the new title
- [ ] Loading spinner shows during save operation
- [ ] Success toast appears after successful rename
- [ ] Error toast appears if rename fails
- [ ] Empty or whitespace-only titles are not saved
- [ ] If new title equals old title, no API call is made
- [ ] Context menu "Rename" option triggers inline edit mode
- [ ] Keyboard navigation: pressing Enter on focused title starts editing
- [ ] Session navigation is prevented while editing
- [ ] Double-click does not cause issues (single click to edit)

---

## Final Validation

```bash
# Build and lint client
cd C:\Users\timca\Business\agfin_app\client && npm run build && npm run lint

# Type check
cd C:\Users\timca\Business\agfin_app\client && npx tsc --noEmit
```

---

## Notes

1. **Accessibility**: The editable title has proper ARIA labels, is focusable with Tab, and can be activated with Enter key.

2. **Optimistic Updates**: The `useUpdateSession` hook already implements optimistic updates, so the title will update immediately in the UI before the API confirms.

3. **Context Menu Integration**: The right-click "Rename" option now triggers inline edit mode instead of opening a dialog, providing a consistent experience.

4. **Click Event Propagation**: Care is taken to stop propagation when clicking the title to prevent navigating to the session while trying to edit.

5. **Mobile Consideration**: On touch devices, the inline edit pattern works similarly - tap to edit. Long-press for context menu remains unchanged.
