"""
Session management API endpoints.

Provides CRUD operations for AI bot chat sessions:
- List user's sessions
- Create new sessions
- Get session messages
- Update session metadata
"""

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from ..database.connection import get_db_client
from ..utils.title_generator import generate_session_title, create_fallback_title

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/agfin-ai-bot",
    tags=["sessions"]
)


# Request/Response models
class CreateSessionRequest(BaseModel):
    """Request model for creating a new session."""
    user_id: str = Field(..., description="User ID who owns the session")
    title: str = Field(default="New Conversation", description="Session title")
    application_id: Optional[str] = Field(None, description="Optional linked application ID")
    workflow_mode: Optional[str] = Field(None, description="Workflow mode (general_help, document_review, etc.)")


class SessionResponse(BaseModel):
    """Response model for session details."""
    id: str
    user_id: str
    title: str
    application_id: Optional[str]
    workflow_mode: Optional[str]
    created_at: str
    updated_at: str


class SessionListResponse(BaseModel):
    """Response model for list of sessions."""
    sessions: List[SessionResponse]
    total: int


class MessageResponse(BaseModel):
    """Response model for a message."""
    id: str
    role: str
    content: str
    created_at: str


class SessionMessagesResponse(BaseModel):
    """Response model for session messages."""
    session_id: str
    messages: List[MessageResponse]
    count: int


class GenerateTitleRequest(BaseModel):
    """Request model for title generation."""
    user_message: str = Field(..., min_length=1, description="First user message")
    assistant_response: str = Field(..., min_length=1, description="First assistant response")


class GenerateTitleResponse(BaseModel):
    """Response model for title generation."""
    session_id: str
    title: str
    generated: bool  # True if AI-generated, False if fallback


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    user_id: str = Query(..., description="User ID to fetch sessions for"),
    limit: int = Query(50, ge=1, le=100, description="Maximum sessions to return"),
    offset: int = Query(0, ge=0, description="Number of sessions to skip")
):
    """
    List chat sessions for a user.

    Args:
        user_id: User ID to fetch sessions for
        limit: Maximum number of sessions (1-100, default 50)
        offset: Pagination offset (default 0)

    Returns:
        SessionListResponse with user's sessions

    Raises:
        HTTPException: If database operation fails
    """
    try:
        db = await get_db_client()

        # Query sessions for user
        query = """
            SELECT id, user_id, application_id, title, workflow_mode, created_at, updated_at
            FROM agfin_ai_bot_sessions
            WHERE user_id = $1
            ORDER BY updated_at DESC
            LIMIT $2 OFFSET $3
        """

        rows = await db.pool.fetch(query, user_id, limit, offset)

        # Get total count
        count_query = "SELECT COUNT(*) FROM agfin_ai_bot_sessions WHERE user_id = $1"
        total = await db.pool.fetchval(count_query, user_id)

        sessions = [
            SessionResponse(
                id=str(row["id"]),
                user_id=str(row["user_id"]),
                application_id=str(row["application_id"]) if row["application_id"] else None,
                title=row["title"],
                workflow_mode=row["workflow_mode"],
                created_at=row["created_at"].isoformat(),
                updated_at=row["updated_at"].isoformat()
            )
            for row in rows
        ]

        return SessionListResponse(
            sessions=sessions,
            total=total
        )

    except Exception as e:
        logger.error(f"List sessions error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}"
        )


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest):
    """
    Create a new chat session.

    Args:
        request: CreateSessionRequest with user_id and optional metadata

    Returns:
        SessionResponse with created session details

    Raises:
        HTTPException: If database operation fails
    """
    try:
        db = await get_db_client()

        # Create session
        session_id = await db.create_session(
            user_id=request.user_id,
            title=request.title,
            application_id=request.application_id,
            workflow_mode=request.workflow_mode
        )

        # Fetch created session
        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Session created but could not be retrieved"
            )

        return SessionResponse(**session)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create session error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """
    Get session details by ID.

    Args:
        session_id: UUID of the session

    Returns:
        SessionResponse with session details

    Raises:
        HTTPException: If session not found or database error
    """
    try:
        db = await get_db_client()
        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )

        return SessionResponse(**session)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session: {str(e)}"
        )


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(
    session_id: str,
    limit: int = Query(50, ge=1, le=200, description="Maximum messages to return")
):
    """
    Get message history for a session.

    Args:
        session_id: UUID of the session
        limit: Maximum messages to return (1-200, default 50)

    Returns:
        SessionMessagesResponse with messages

    Raises:
        HTTPException: If session not found or database error
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

        # Get messages
        messages_data = await db.get_session_messages(session_id, limit=limit)

        messages = [
            MessageResponse(
                id=msg["id"],
                role=msg["role"],
                content=msg["content"],
                created_at=msg["created_at"]
            )
            for msg in messages_data
        ]

        return SessionMessagesResponse(
            session_id=session_id,
            messages=messages,
            count=len(messages)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )


@router.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    title: Optional[str] = None,
    workflow_mode: Optional[str] = None
):
    """
    Update session metadata.

    Args:
        session_id: UUID of the session
        title: Optional new title
        workflow_mode: Optional new workflow mode

    Returns:
        Updated session details

    Raises:
        HTTPException: If session not found or database error
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

        # Build update query
        updates = []
        params = [session_id]
        param_count = 2

        if title is not None:
            updates.append(f"title = ${param_count}")
            params.append(title)
            param_count += 1

        if workflow_mode is not None:
            updates.append(f"workflow_mode = ${param_count}")
            params.append(workflow_mode)
            param_count += 1

        if not updates:
            # No updates requested
            return SessionResponse(**session)

        # Execute update
        query = f"""
            UPDATE agfin_ai_bot_sessions
            SET {', '.join(updates)}, updated_at = now()
            WHERE id = $1
            RETURNING id, user_id, application_id, title, workflow_mode, created_at, updated_at
        """

        row = await db.pool.fetchrow(query, *params)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Update failed"
            )

        return SessionResponse(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            application_id=str(row["application_id"]) if row["application_id"] else None,
            title=row["title"],
            workflow_mode=row["workflow_mode"],
            created_at=row["created_at"].isoformat(),
            updated_at=row["updated_at"].isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update session error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session: {str(e)}"
        )


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


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    """
    Delete a session and all its messages.

    Args:
        session_id: UUID of the session to delete

    Raises:
        HTTPException: If session not found or database error
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

        # Delete session (CASCADE will delete messages)
        query = "DELETE FROM agfin_ai_bot_sessions WHERE id = $1"
        await db.pool.execute(query, session_id)

        logger.info(f"Deleted session {session_id}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete session error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )
