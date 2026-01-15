"""
Streaming chat endpoint with Server-Sent Events (SSE).

Provides real-time streaming responses from Claude with:
- Token-by-token streaming
- Tool call handling mid-stream
- Completion events
- Error handling
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncGenerator
import logging
import json

from ..claude.client import get_client as get_claude_client
from ..database.connection import get_db_client
from ..prompts.system_prompt import build_system_prompt

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/agfin-ai-bot",
    tags=["chat"]
)


# Request model
class StreamRequest(BaseModel):
    """Request model for streaming chat endpoint."""
    message: str = Field(..., min_length=1, description="User message to send to AI")
    session_id: str = Field(..., description="UUID of the chat session")
    user_id: Optional[str] = Field(None, description="Optional user ID for context")
    tools: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional tool definitions for agentic mode"
    )


async def generate_stream(
    request: StreamRequest,
    session: Dict[str, Any],
    history: List[Dict[str, Any]]
) -> AsyncGenerator[str, None]:
    """
    Generate Server-Sent Events stream for chat response.

    Args:
        request: StreamRequest with message and session_id
        session: Session details from database
        history: Conversation history

    Yields:
        SSE formatted event strings
    """
    try:
        # Get application context if linked
        application_context = None
        if session.get("application_id"):
            application_context = {
                "id": session.get("application_id")
            }

        # Build system prompt with full context
        system_prompt = build_system_prompt(
            workflow_mode=session.get("workflow_mode"),
            application_context=application_context,
            available_tools=request.tools
        )

        # Get Claude client
        claude = get_claude_client()

        # Build conversation context
        conversation_context = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in history
        ])
        conversation_context += f"\n\nUSER: {request.message}"

        # Accumulate full response for database save
        full_response = ""
        tool_calls = []

        # Stream from Claude
        async for chunk_data in claude.stream_message(
            message=conversation_context,
            system=system_prompt,
            tools=request.tools
        ):
            try:
                # Parse the JSON chunk
                chunk = json.loads(chunk_data)

                # Handle different event types
                event_type = chunk.get("type")

                if event_type == "message_start":
                    # Message starting
                    yield f"event: message_start\ndata: {json.dumps(chunk)}\n\n"

                elif event_type == "content_block_start":
                    # Content block starting
                    yield f"event: content_block_start\ndata: {json.dumps(chunk)}\n\n"

                elif event_type == "content_block_delta":
                    # Token delta - this is the actual text streaming
                    delta = chunk.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        full_response += text
                        yield f"event: token\ndata: {json.dumps({'text': text})}\n\n"

                elif event_type == "content_block_stop":
                    # Content block ended
                    yield f"event: content_block_stop\ndata: {json.dumps(chunk)}\n\n"

                elif event_type == "message_delta":
                    # Message delta (usage info, etc)
                    yield f"event: message_delta\ndata: {json.dumps(chunk)}\n\n"

                elif event_type == "message_stop":
                    # Message complete
                    yield f"event: message_stop\ndata: {json.dumps(chunk)}\n\n"

                # Check for tool use
                content = chunk.get("content", [])
                if isinstance(content, list):
                    for block in content:
                        if block.get("type") == "tool_use":
                            tool_calls.append(block)
                            yield f"event: tool_use\ndata: {json.dumps(block)}\n\n"

            except json.JSONDecodeError:
                logger.warning(f"Failed to parse chunk: {chunk_data}")
                continue

        # Save messages to database
        db = await get_db_client()

        # Save user message
        user_message_id = await db.save_message(
            session_id=request.session_id,
            role="user",
            content=request.message
        )

        # Save assistant response
        assistant_message_id = await db.save_message(
            session_id=request.session_id,
            role="assistant",
            content=full_response or "(no text response)"
        )

        # Send completion event
        completion_data = {
            "user_message_id": user_message_id,
            "assistant_message_id": assistant_message_id,
            "tool_calls": len(tool_calls),
            "complete": True
        }
        yield f"event: complete\ndata: {json.dumps(completion_data)}\n\n"

    except Exception as e:
        logger.error(f"Stream generation error: {str(e)}", exc_info=True)
        error_data = {
            "error": str(e),
            "type": type(e).__name__
        }
        yield f"event: error\ndata: {json.dumps(error_data)}\n\n"


@router.post("/stream")
async def stream_chat(request: StreamRequest):
    """
    Stream chat with AI agent using Server-Sent Events.

    Accepts a user message and session ID, loads conversation history,
    and streams Claude's response token-by-token.

    Args:
        request: StreamRequest with message and session_id

    Returns:
        StreamingResponse with SSE events

    Raises:
        HTTPException: If session not found
    """
    try:
        # Get database client
        db = await get_db_client()

        # Load session details
        session = await db.get_session(request.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {request.session_id} not found"
            )

        # Load conversation history
        history = await db.get_session_messages(request.session_id, limit=50)
        logger.info(f"Streaming for session {request.session_id} with {len(history)} messages")

        # Return streaming response
        return StreamingResponse(
            generate_stream(request, session, history),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stream endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming failed: {str(e)}"
        )
