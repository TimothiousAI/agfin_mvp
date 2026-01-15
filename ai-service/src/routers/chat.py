"""
Chat endpoint for AI agent conversations.

Provides non-streaming chat interface with Claude, supporting:
- Conversation history loading
- Tool execution (agentic mode)
- Message persistence to database
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from ..claude.client import get_client as get_claude_client
from ..database.connection import get_db_client
from ..prompts.system_prompt import build_system_prompt as build_dynamic_system_prompt

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/agfin-ai-bot",
    tags=["chat"]
)


# Request/Response models
class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, description="User message to send to AI")
    session_id: str = Field(..., description="UUID of the chat session")
    user_id: Optional[str] = Field(None, description="Optional user ID for context")
    tools: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional tool definitions for agentic mode"
    )


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    message: str = Field(..., description="AI assistant response")
    session_id: str = Field(..., description="UUID of the chat session")
    user_message_id: str = Field(..., description="UUID of saved user message")
    assistant_message_id: str = Field(..., description="UUID of saved assistant message")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Tool calls made during execution (if any)"
    )


def build_system_prompt(
    workflow_mode: Optional[str] = None,
    application_context: Optional[Dict[str, Any]] = None,
    tools: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Build system prompt with context for Claude.

    Args:
        workflow_mode: Optional workflow context from session
        application_context: Optional application data
        tools: Optional tool definitions

    Returns:
        System prompt string
    """
    # Use the new dynamic prompt generator
    return build_dynamic_system_prompt(
        workflow_mode=workflow_mode,
        application_context=application_context,
        available_tools=tools
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with AI agent (non-streaming).

    Accepts a user message and session ID, loads conversation history,
    executes Claude with optional tools, and saves the conversation.

    Args:
        request: ChatRequest with message and session_id

    Returns:
        ChatResponse with AI response and saved message IDs

    Raises:
        HTTPException: If session not found or Claude API fails
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
        logger.info(f"Loaded {len(history)} messages for session {request.session_id}")

        # Get application context if linked
        application_context = None
        if session.get("application_id"):
            # TODO: Fetch application data from database
            # For now, just include the ID
            application_context = {
                "id": session.get("application_id")
            }

        # Build system prompt with full context
        system_prompt = build_system_prompt(
            workflow_mode=session.get("workflow_mode"),
            application_context=application_context,
            tools=request.tools
        )

        # Build messages list for Claude
        # Format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history
        ]
        # Add the new user message
        messages.append({"role": "user", "content": request.message})

        # Get Claude client
        claude = get_claude_client()

        # Execute Claude with tools if provided
        if request.tools:
            # Agentic mode with tools
            logger.info(f"Executing Claude with {len(request.tools)} tools")

            # Build conversation for tool execution
            # For execute_with_tools, we need to send the full conversation context
            conversation_context = "\n\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in messages
            ])

            response = await claude.execute_with_tools(
                message=conversation_context,
                tools=request.tools,
                system=system_prompt,
                max_iterations=5
            )

            # Extract assistant response
            assistant_message = ""
            tool_calls_made = []

            for block in response.get("content", []):
                if block.get("type") == "text":
                    assistant_message += block.get("text", "")
                elif block.get("type") == "tool_use":
                    tool_calls_made.append({
                        "name": block.get("name"),
                        "input": block.get("input"),
                        "id": block.get("id")
                    })

            if not assistant_message:
                assistant_message = "I processed your request with the available tools."

        else:
            # Simple mode without tools
            logger.info("Executing Claude without tools")

            # For simple mode, we send just the latest user message
            # but include system prompt with full context
            response = await claude.send_message(
                message=request.message,
                system=system_prompt
            )

            # Extract assistant response
            assistant_message = ""
            for block in response.get("content", []):
                if block.get("type") == "text":
                    assistant_message += block.get("text", "")

            tool_calls_made = None

            if not assistant_message:
                assistant_message = "I'm sorry, I didn't generate a response. Please try again."

        # Save user message to database
        user_message_id = await db.save_message(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        logger.info(f"Saved user message: {user_message_id}")

        # Save assistant response to database
        assistant_message_id = await db.save_message(
            session_id=request.session_id,
            role="assistant",
            content=assistant_message
        )
        logger.info(f"Saved assistant message: {assistant_message_id}")

        # Return response
        return ChatResponse(
            message=assistant_message,
            session_id=request.session_id,
            user_message_id=user_message_id,
            assistant_message_id=assistant_message_id,
            tool_calls=tool_calls_made
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, limit: int = 50):
    """
    Get message history for a session.

    Args:
        session_id: UUID of the chat session
        limit: Maximum messages to return (default: 50)

    Returns:
        List of messages in chronological order

    Raises:
        HTTPException: If session not found
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
        messages = await db.get_session_messages(session_id, limit=limit)

        return {
            "session_id": session_id,
            "messages": messages,
            "count": len(messages)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve messages: {str(e)}"
        )
