import { useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export interface EditableSessionTitleProps {
  title: string;
  isActive: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
  /** Show subtle animation when AI is generating the title */
  isGeneratingTitle?: boolean;
}

/**
 * Inner component for edit mode only.
 * Receives initialValue as a prop and manages local state.
 * Parent should use `key={editKey}` to reset when entering edit mode.
 */
function EditInput({
  initialValue,
  title,
  isActive,
  isSaving,
  onSave,
  onCancel,
}: {
  initialValue: string;
  title: string;
  isActive: boolean;
  isSaving: boolean;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Use uncontrolled input with defaultValue for simpler state management
  const valueRef = useRef(initialValue);

  // Focus and select on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const trimmed = valueRef.current.trim();
        if (trimmed && trimmed !== title) {
          onSave(trimmed);
        } else {
          onCancel();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [title, onSave, onCancel]
  );

  const handleBlur = useCallback(() => {
    const trimmed = valueRef.current.trim();
    if (trimmed && trimmed !== title) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  }, [title, onSave, onCancel]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    valueRef.current = e.target.value;
  }, []);

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialValue}
        onChange={handleChange}
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

export function EditableSessionTitle({
  title,
  isActive,
  isEditing,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
  isGeneratingTitle = false,
}: EditableSessionTitleProps) {
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
    // Using key to reset the EditInput when entering edit mode
    return (
      <EditInput
        key={`edit-${title}`}
        initialValue={title}
        title={title}
        isActive={isActive}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  // Display mode - clickable title
  const displayTitle = title || 'Untitled conversation';
  const truncatedTitle =
    displayTitle.length > 50
      ? `${displayTitle.substring(0, 50)}...`
      : displayTitle;

  // Show pulse animation for "New Conversation" when AI is generating title
  const showPulse = isGeneratingTitle && title === 'New Conversation';

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
        ${showPulse ? 'animate-pulse text-gray-400' : ''}
      `}
    >
      {truncatedTitle}
    </span>
  );
}

export default EditableSessionTitle;
