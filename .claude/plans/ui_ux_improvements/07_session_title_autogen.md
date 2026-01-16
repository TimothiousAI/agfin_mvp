# Implementation Plan: Auto-Generate Session Titles from First Exchange

**Scope**: Auto-generate meaningful conversation titles from the first user message and AI response
**Services Affected**: client | server | ai-service
**Estimated Steps**: 8

---

## Overview

Implement automatic session title generation that creates meaningful, context-aware titles (e.g., "John Smith Farm Loan Application") after the first message exchange. The feature will call Claude to generate a concise title from the first user message and assistant response, with fallback to a truncated first message if generation fails. The sidebar will update in real-time via optimistic UI updates.

---

## Prerequisites

- [ ] AI service running with Claude API access
- [ ] Session CRUD operations working (verified in `useSessionsApi.ts`)
- [ ] Existing session update endpoint in AI service (`PATCH /api/agfin-ai-bot/sessions/{session_id}`)

---

## Implementation Steps

### Phase 1: AI Service - Title Generation Endpoint

**Step 1.1**: Create title generation utility function

- File: `C:\Users\timca\Business\agfin_app\ai-service\src\utils\title_generator.py`
- Changes: Add new utility module for generating session titles using Claude

```python
"""
Session title generator using Claude.

Generates concise, meaningful titles from conversation context.
"""

import logging
from typing import Optional

from ..claude.client import get_client as get_claude_client

logger = logging.getLogger(__name__)

TITLE_PROMPT = """Generate a brief, descriptive title (5-8 words max) for this conversation based on the first exchange.
The title should:
- Capture the main topic or intent
- Include relevant names, entities, or specifics if mentioned
- Be concise and scannable for a sidebar list
- NOT include quotes around the title
- NOT start with "Title:" or similar prefixes

Examples of good titles:
- "John Smith Farm Loan Application"
- "Corn Yield Documentation Review"
- "Missing Tax Records Follow-up"
- "2024 Operating Budget Questions"

USER MESSAGE:
{user_message}

ASSISTANT RESPONSE:
{assistant_response}

Generate only the title, nothing else:"""


async def generate_session_title(
    user_message: str,
    assistant_response: str,
    max_length: int = 50
) -> str:
    """
    Generate a session title from the first exchange.

    Args:
        user_message: First user message in the conversation
        assistant_response: First assistant response
        max_length: Maximum title length (default 50 chars)

    Returns:
        Generated title string

    Raises:
        Exception: If Claude API call fails
    """
    try:
        claude = get_claude_client()

        prompt = TITLE_PROMPT.format(
            user_message=user_message[:500],  # Limit input size
            assistant_response=assistant_response[:500]
        )

        response = await claude.send_message(
            message=prompt,
            system="You are a title generator. Output only the title, nothing else.",
            max_tokens=50
        )

        # Extract text from response
        title = ""
        for block in response.get("content", []):
            if block.get("type") == "text":
                title += block.get("text", "")

        # Clean up the title
        title = title.strip().strip('"\'')

        # Enforce max length
        if len(title) > max_length:
            title = title[:max_length-3] + "..."

        return title or "New Conversation"

    except Exception as e:
        logger.error(f"Title generation failed: {str(e)}")
        raise


def create_fallback_title(user_message: str, max_length: int = 50) -> str:
    """
    Create a fallback title from the first user message.

    Args:
        user_message: First user message
        max_length: Maximum title length

    Returns:
        Truncated message as title
    """
    # Clean up whitespace
    clean_message = " ".join(user_message.split())

    if len(clean_message) <= max_length:
        return clean_message

    # Truncate at word boundary
    truncated = clean_message[:max_length-3]
    last_space = truncated.rfind(" ")

    if last_space > max_length // 2:
        truncated = truncated[:last_space]

    return truncated + "..."
```

**Step 1.2**: Add title generation endpoint to sessions router

- File: `C:\Users\timca\Business\agfin_app\ai-service\src\routers\sessions.py`
- Changes: Add new POST endpoint for generating and applying session title

```python
# Add to imports at top of file
from ..utils.title_generator import generate_session_title, create_fallback_title

# Add new request model after existing models
class GenerateTitleRequest(BaseModel):
    """Request model for title generation."""
    user_message: str = Field(..., min_length=1, description="First user message")
    assistant_response: str = Field(..., min_length=1, description="First assistant response")


class GenerateTitleResponse(BaseModel):
    """Response model for title generation."""
    session_id: str
    title: str
    generated: bool  # True if AI-generated, False if fallback


# Add new endpoint before delete_session
@router.post("/sessions/{session_id}/generate-title", response_model=GenerateTitleResponse)
async def generate_and_apply_title(
    session_id: str,
    request: GenerateTitleRequest
):
    """
    Generate a title for a session from the first exchange.

    Uses Claude to generate a meaningful title from the first user message
    and assistant response. Falls back to truncated user message on failure.

    Args:
        session_id: UUID of the session to update
        request: GenerateTitleRequest with first exchange content

    Returns:
        GenerateTitleResponse with generated title

    Raises:
        HTTPException: If session not found or update fails
    """
    try:
        db = await get_db_client()

        # Verify session exists
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )

        # Skip if title already customized (not default)
        if session.get("title") != "New Conversation":
            return GenerateTitleResponse(
                session_id=session_id,
                title=session.get("title"),
                generated=False
            )

        # Try AI generation, fall back to truncation
        generated = True
        try:
            title = await generate_session_title(
                user_message=request.user_message,
                assistant_response=request.assistant_response
            )
        except Exception as e:
            logger.warning(f"AI title generation failed, using fallback: {e}")
            title = create_fallback_title(request.user_message)
            generated = False

        # Update session title in database
        query = """
            UPDATE agfin_ai_bot_sessions
            SET title = $2, updated_at = now()
            WHERE id = $1
            RETURNING id
        """
        await db.pool.execute(query, session_id, title)

        logger.info(f"Updated session {session_id} title to: {title}")

        return GenerateTitleResponse(
            session_id=session_id,
            title=title,
            generated=generated
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate title error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate title: {str(e)}"
        )
```

**Validation**:
```bash
cd ai-service && python -m pytest tests/ -v
cd ai-service && python -c "from src.utils.title_generator import generate_session_title; print('Import OK')"
```

---

### Phase 2: Backend Proxy (Optional - if routing through Express)

**Step 2.1**: Add title generation proxy route (if needed)

- File: `C:\Users\timca\Business\agfin_app\server\src\application\sessions\sessions.routes.ts`
- Changes: Add proxy route if Express middleware is handling AI service requests

Note: If the frontend calls the AI service directly (as appears to be the case from `useChatApi.ts`), this step can be skipped. The frontend already uses `/api/agfin-ai-bot/*` routes directly.

**Validation**:
```bash
cd server && npm run build && npm run lint
```

---

### Phase 3: Frontend - Hook and Integration

**Step 3.1**: Add title generation API function to useSessionsApi

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useSessionsApi.ts`
- Changes: Add mutation hook for generating session title

```typescript
// Add after existing API helper functions (around line 105)

interface GenerateTitleRequest {
  userMessage: string;
  assistantResponse: string;
}

interface GenerateTitleResponse {
  session_id: string;
  title: string;
  generated: boolean;
}

async function generateSessionTitleApi(
  sessionId: string,
  request: GenerateTitleRequest
): Promise<GenerateTitleResponse> {
  const response = await fetch(`/api/agfin-ai-bot/sessions/${sessionId}/generate-title`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_message: request.userMessage,
      assistant_response: request.assistantResponse,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to generate title' }));
    throw new Error(error.detail || 'Failed to generate title');
  }

  return response.json();
}

// Add new hook after useDeleteSession (around line 305)

/**
 * Generate session title from first exchange
 * Calls AI service to create meaningful title, updates store optimistically
 */
export function useGenerateSessionTitle() {
  const queryClient = useQueryClient();
  const { updateSession } = useSessionStore();

  return useMutation({
    mutationFn: ({
      sessionId,
      userMessage,
      assistantResponse,
    }: {
      sessionId: string;
      userMessage: string;
      assistantResponse: string;
    }) => generateSessionTitleApi(sessionId, { userMessage, assistantResponse }),

    onSuccess: (data, variables) => {
      // Update local store with generated title
      updateSession(variables.sessionId, { title: data.title });

      // Invalidate sessions query to refetch from server
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },

    onError: (error) => {
      console.error('Failed to generate session title:', error);
      // Silent failure - title remains "New Conversation"
    },
  });
}
```

**Step 3.2**: Create hook to detect first exchange and trigger title generation

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useAutoTitle.ts`
- Changes: Create new hook that monitors messages and triggers title generation

```typescript
import { useEffect, useRef } from 'react';
import { useChatStore } from './useChatStore';
import { useSessionStore } from './useSessionStore';
import { useGenerateSessionTitle } from './useSessionsApi';

/**
 * useAutoTitle Hook
 *
 * Automatically generates a session title after the first complete exchange.
 * Monitors for:
 * - First user message
 * - First complete assistant response (not streaming)
 * - Session still has default title
 */
export function useAutoTitle(sessionId: string | null) {
  const { messages } = useChatStore();
  const { getSession } = useSessionStore();
  const generateTitle = useGenerateSessionTitle();

  // Track if we've already attempted title generation for this session
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip if no session
    if (!sessionId) return;

    // Skip if already attempted for this session
    if (attemptedRef.current.has(sessionId)) return;

    // Get current session
    const session = getSession(sessionId);
    if (!session) return;

    // Skip if title is already customized
    if (session.title !== 'New Conversation') {
      attemptedRef.current.add(sessionId);
      return;
    }

    // Find first user message and first complete assistant response
    const userMessages = messages.filter(m => m.role === 'user' && !m.isStreaming);
    const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.isStreaming);

    // Need at least one of each, and assistant must be complete (not streaming)
    if (userMessages.length === 0 || assistantMessages.length === 0) {
      return;
    }

    const firstUserMessage = userMessages[0];
    const firstAssistantMessage = assistantMessages[0];

    // Verify assistant message has content (not empty or placeholder)
    if (!firstAssistantMessage.content || firstAssistantMessage.content.length < 10) {
      return;
    }

    // Mark as attempted to prevent duplicate calls
    attemptedRef.current.add(sessionId);

    // Generate title
    generateTitle.mutate({
      sessionId,
      userMessage: firstUserMessage.content,
      assistantResponse: firstAssistantMessage.content,
    });

  }, [sessionId, messages, getSession, generateTitle]);

  // Clear attempted set when session changes
  useEffect(() => {
    return () => {
      // Keep the set but it will naturally not trigger for new sessions
    };
  }, [sessionId]);

  return {
    isGenerating: generateTitle.isPending,
    error: generateTitle.error,
  };
}

export default useAutoTitle;
```

**Step 3.3**: Integrate useAutoTitle into the chat interface

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ChatCenter.tsx` (or wherever chat is rendered)
- Changes: Add useAutoTitle hook call

```typescript
// Add import at top
import { useAutoTitle } from '../conversation/useAutoTitle';

// Inside the component, add hook call after other hooks:
// const { currentSessionId } = useSessionStore();
useAutoTitle(currentSessionId);
```

**Validation**:
```bash
cd client && npm run build && npm run lint && npm run typecheck
```

---

### Phase 4: Stream Completion Integration

**Step 3.4**: Trigger title generation when streaming completes

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\useChatApi.ts`
- Changes: Add title generation trigger to stream completion handler

The `useAutoTitle` hook approach (Step 3.2-3.3) is preferred as it:
- Works with both streaming and non-streaming responses
- Decouples title generation from chat API logic
- Uses reactive state watching for clean integration

However, if a more direct approach is needed, modify `useStreamMessage`:

```typescript
// In useChatApi.ts, modify handleEnd in useStreamMessage:
const handleEnd = () => {
  completeStreamingMessage();
  // Invalidate chat history to refetch and get the final message from server
  queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });

  // Title generation will be handled by useAutoTitle hook
  // watching the messages state change
};
```

**Validation**:
```bash
cd client && npm run build
```

---

### Phase 5: UI Polish - Loading State in Sidebar

**Step 5.1**: Add visual feedback for title generation in session list

- File: `C:\Users\timca\Business\agfin_app\client\src\application\conversation\SessionList.tsx`
- Changes: Show subtle loading indicator while title is being generated

```typescript
// Add to session item rendering, check for default title + recent creation
// This is optional polish - the optimistic update should make it seamless

// Example: Add pulse animation to "New Conversation" titles that are being generated
<span className={cn(
  "truncate",
  session.title === "New Conversation" && "animate-pulse text-gray-400"
)}>
  {session.title}
</span>
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `ai-service/src/utils/title_generator.py` | Create | Title generation utility with Claude + fallback |
| `ai-service/src/routers/sessions.py` | Modify | Add `/generate-title` endpoint |
| `client/src/application/conversation/useSessionsApi.ts` | Modify | Add `useGenerateSessionTitle` hook |
| `client/src/application/conversation/useAutoTitle.ts` | Create | Auto-title trigger hook |
| `client/src/application/shell/ChatCenter.tsx` | Modify | Integrate useAutoTitle hook |
| `client/src/application/conversation/SessionList.tsx` | Modify | Optional: loading state polish |

---

## Acceptance Criteria

- [ ] After first user message and complete assistant response, session title updates automatically
- [ ] Title is meaningful and context-aware (e.g., "John Smith Farm Loan Application")
- [ ] Sidebar updates in real-time without page refresh
- [ ] Fallback to truncated first message if AI generation fails
- [ ] No duplicate title generation attempts for same session
- [ ] Sessions with manually-set titles are not overwritten
- [ ] Title generation does not block or slow down chat experience

---

## Final Validation

```bash
# AI Service
cd ai-service && python -m pytest tests/ -v
cd ai-service && python -m mypy src/ --ignore-missing-imports

# Frontend
cd client && npm run build && npm run lint && npm run typecheck

# Full stack test
# 1. Start all services
# 2. Create new conversation
# 3. Send message and wait for response
# 4. Verify sidebar title updates from "New Conversation" to generated title
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Claude API fails | Fallback to truncated first message |
| Network error on title endpoint | Silent failure, keeps "New Conversation" |
| Empty/short assistant response | Skip title generation, wait for longer response |
| Session already has custom title | Skip generation entirely |
| Rate limiting | Exponential backoff in mutation (React Query default) |

---

## Notes

1. **Non-blocking**: Title generation happens asynchronously after the exchange completes. It does not delay the chat response.

2. **Single attempt**: Each session only gets one title generation attempt to avoid redundant API calls.

3. **Optimistic updates**: The sidebar updates immediately when the title is generated, before server confirmation.

4. **Graceful degradation**: If AI title generation fails, users still get a functional (truncated) title.

5. **Cost consideration**: Title generation uses a small prompt (~500 tokens input, ~50 tokens output). Consider caching or limiting to first exchange only.

6. **Future enhancements**:
   - Allow users to manually edit/regenerate titles
   - Use conversation topic extraction for multi-turn refinement
   - Add title suggestions based on linked application data
