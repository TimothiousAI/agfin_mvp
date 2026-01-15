"""
Conversation history management utilities.

Handles loading, formatting, and truncating conversation history
to fit within Claude's context window while preserving conversation flow.
"""

from typing import List, Dict, Any, Optional, Tuple
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Context window limits for Claude models
# Claude Sonnet 4.5: 200k tokens, but we'll be conservative
DEFAULT_MAX_TOKENS = 150000  # Reserve space for system prompt and response
TOKENS_PER_MESSAGE_ESTIMATE = 4  # Rough estimate: 1 token ≈ 4 characters


class ConversationHistory:
    """
    Manages conversation history with context window awareness.

    Handles loading messages from database, formatting for Claude API,
    and truncating when necessary to fit within token limits.
    """

    def __init__(
        self,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        tokens_per_char: float = 1.0 / TOKENS_PER_MESSAGE_ESTIMATE
    ):
        """
        Initialize conversation history manager.

        Args:
            max_tokens: Maximum tokens to allow in history
            tokens_per_char: Conversion ratio for estimating tokens from characters
        """
        self.max_tokens = max_tokens
        self.tokens_per_char = tokens_per_char
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def format_for_claude(
        self,
        messages: List[Dict[str, Any]],
        include_metadata: bool = False
    ) -> List[Dict[str, str]]:
        """
        Format messages for Claude API.

        Claude expects messages in format:
        [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]

        Args:
            messages: Raw messages from database with id, role, content, created_at
            include_metadata: If True, preserve message IDs in metadata (not sent to Claude)

        Returns:
            List of formatted messages ready for Claude API
        """
        formatted = []

        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")

            # Validate role
            if role not in ["user", "assistant"]:
                logger.warning(f"Invalid role '{role}' in message, skipping")
                continue

            formatted_msg = {
                "role": role,
                "content": content
            }

            # Optionally preserve metadata (for internal use, not sent to Claude)
            if include_metadata:
                formatted_msg["_id"] = msg.get("id")
                formatted_msg["_created_at"] = msg.get("created_at")

            formatted.append(formatted_msg)

        return formatted

    def estimate_tokens(self, messages: List[Dict[str, Any]]) -> int:
        """
        Estimate token count for a list of messages.

        This is a rough estimate based on character count.
        For precise counting, use tiktoken or Claude's token counter.

        Args:
            messages: Messages to estimate tokens for

        Returns:
            Estimated token count
        """
        total_chars = sum(len(msg.get("content", "")) for msg in messages)
        estimated_tokens = int(total_chars * self.tokens_per_char)

        return estimated_tokens

    def truncate_to_fit(
        self,
        messages: List[Dict[str, Any]],
        keep_most_recent: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Truncate message history to fit within context window.

        Strategy:
        1. Always keep the most recent N messages
        2. For older messages, remove from the beginning
        3. Ensure we don't exceed max_tokens

        Args:
            messages: Full message history
            keep_most_recent: Minimum number of recent messages to preserve

        Returns:
            Truncated message list that fits in context
        """
        if not messages:
            return []

        # Estimate tokens for full history
        total_tokens = self.estimate_tokens(messages)

        if total_tokens <= self.max_tokens:
            # Fits within limit, no truncation needed
            logger.debug(f"History fits in context: {total_tokens} tokens")
            return messages

        # Need to truncate
        logger.info(f"Truncating history: {total_tokens} tokens exceeds {self.max_tokens}")

        # Always keep most recent messages
        kept_messages = messages[-keep_most_recent:] if len(messages) > keep_most_recent else messages

        # Work backwards, adding older messages until we hit the limit
        truncated = list(kept_messages)
        remaining_messages = messages[:-keep_most_recent] if len(messages) > keep_most_recent else []

        for msg in reversed(remaining_messages):
            # Try adding this message
            test_history = [msg] + truncated
            tokens = self.estimate_tokens(test_history)

            if tokens <= self.max_tokens:
                truncated = test_history
            else:
                # Would exceed limit, stop here
                break

        messages_removed = len(messages) - len(truncated)
        logger.info(f"Truncated {messages_removed} messages, kept {len(truncated)}")

        return truncated

    def validate_alternation(
        self,
        messages: List[Dict[str, Any]]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate that messages alternate between user and assistant.

        Claude requires proper alternation of user/assistant messages.

        Args:
            messages: Messages to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not messages:
            return True, None

        prev_role = None
        for idx, msg in enumerate(messages):
            role = msg.get("role")

            if role not in ["user", "assistant"]:
                return False, f"Invalid role '{role}' at index {idx}"

            if prev_role is not None and role == prev_role:
                return False, f"Non-alternating roles at index {idx}: {prev_role} -> {role}"

            prev_role = role

        # Check that conversation starts with user message
        if messages[0].get("role") != "user":
            return False, "Conversation must start with user message"

        return True, None

    def prepare_for_api(
        self,
        messages: List[Dict[str, Any]],
        new_user_message: Optional[str] = None,
        auto_truncate: bool = True
    ) -> List[Dict[str, str]]:
        """
        Prepare conversation history for Claude API call.

        Performs all necessary formatting, validation, and truncation.

        Args:
            messages: Raw messages from database
            new_user_message: Optional new message to append
            auto_truncate: Whether to auto-truncate if needed (default: True)

        Returns:
            Formatted and validated message list ready for Claude

        Raises:
            ValueError: If message validation fails
        """
        # Truncate if needed
        if auto_truncate:
            messages = self.truncate_to_fit(messages)

        # Format for Claude
        formatted = self.format_for_claude(messages)

        # Add new message if provided
        if new_user_message:
            formatted.append({
                "role": "user",
                "content": new_user_message
            })

        # Validate alternation
        is_valid, error = self.validate_alternation(formatted)
        if not is_valid:
            raise ValueError(f"Invalid message sequence: {error}")

        return formatted

    def cache_history(self, session_id: str, messages: List[Dict[str, Any]]):
        """
        Cache conversation history for a session.

        Args:
            session_id: Session UUID
            messages: Messages to cache
        """
        self._cache[session_id] = messages
        logger.debug(f"Cached {len(messages)} messages for session {session_id}")

    def get_cached_history(self, session_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve cached history for a session.

        Args:
            session_id: Session UUID

        Returns:
            Cached messages or None if not in cache
        """
        return self._cache.get(session_id)

    def clear_cache(self, session_id: Optional[str] = None):
        """
        Clear cached history.

        Args:
            session_id: Optional specific session to clear, or None to clear all
        """
        if session_id:
            self._cache.pop(session_id, None)
            logger.debug(f"Cleared cache for session {session_id}")
        else:
            self._cache.clear()
            logger.debug("Cleared all cached history")

    def summarize_old_messages(
        self,
        messages: List[Dict[str, Any]],
        summary_threshold: int = 50
    ) -> Tuple[Optional[str], List[Dict[str, Any]]]:
        """
        Create a summary of old messages to reduce token usage.

        When history is very long, we can summarize older messages
        and include the summary as context instead of full messages.

        Args:
            messages: Full message history
            summary_threshold: Number of messages after which to summarize old ones

        Returns:
            Tuple of (summary_text, recent_messages)
        """
        if len(messages) <= summary_threshold:
            return None, messages

        # Split into old and recent
        old_messages = messages[:-summary_threshold]
        recent_messages = messages[-summary_threshold:]

        # Create simple summary
        user_message_count = sum(1 for m in old_messages if m.get("role") == "user")
        assistant_message_count = len(old_messages) - user_message_count

        # Extract key topics (simple keyword extraction)
        all_text = " ".join(m.get("content", "") for m in old_messages)

        summary = f"""Previous conversation summary ({len(old_messages)} messages):
- User questions: {user_message_count}
- Assistant responses: {assistant_message_count}
- Topics discussed: {all_text[:200]}..."""

        logger.info(f"Summarized {len(old_messages)} old messages")

        return summary, recent_messages


# Module-level instance
_history_manager: Optional[ConversationHistory] = None


def get_history_manager() -> ConversationHistory:
    """
    Get or create the module-level history manager instance.

    Returns:
        ConversationHistory instance
    """
    global _history_manager
    if _history_manager is None:
        _history_manager = ConversationHistory()
    return _history_manager


def reset_history_manager():
    """Reset the module-level history manager (useful for testing)."""
    global _history_manager
    _history_manager = None
