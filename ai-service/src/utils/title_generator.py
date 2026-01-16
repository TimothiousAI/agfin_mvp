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
