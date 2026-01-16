"""
Database connection utilities for PostgreSQL/Supabase.

Provides async connection pooling for the AI service to interact with
the agfin_ai_bot_sessions and agfin_ai_bot_messages tables.
"""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncpg


class DatabaseClient:
    """
    Async PostgreSQL client for AI bot database operations.

    Uses asyncpg for connection pooling and async operations.
    """

    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database client.

        Args:
            database_url: PostgreSQL connection URL (defaults to DATABASE_URL env var)
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError(
                "Database URL must be provided or set in DATABASE_URL environment variable"
            )

        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Create connection pool."""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )

    async def close(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def get_session_messages(
        self,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history for a session.

        Args:
            session_id: UUID of the chat session
            limit: Maximum number of messages to retrieve (default: 50)

        Returns:
            List of messages in chronological order with role and content
        """
        if not self.pool:
            await self.connect()

        query = """
            SELECT id, role, content, created_at
            FROM agfin_ai_bot_messages
            WHERE session_id = $1
            ORDER BY created_at ASC
            LIMIT $2
        """

        rows = await self.pool.fetch(query, session_id, limit)

        return [
            {
                "id": str(row["id"]),
                "role": row["role"],
                "content": row["content"],
                "created_at": row["created_at"].isoformat()
            }
            for row in rows
        ]

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> str:
        """
        Save a message to the database.

        Args:
            session_id: UUID of the chat session
            role: Message role ('user' or 'assistant')
            content: Message content text

        Returns:
            UUID of the created message
        """
        if not self.pool:
            await self.connect()

        query = """
            INSERT INTO agfin_ai_bot_messages (session_id, role, content)
            VALUES ($1, $2, $3)
            RETURNING id
        """

        message_id = await self.pool.fetchval(query, session_id, role, content)
        return str(message_id)

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session details by ID.

        Args:
            session_id: UUID of the chat session

        Returns:
            Session details or None if not found
        """
        if not self.pool:
            await self.connect()

        query = """
            SELECT id, user_id, application_id, title, workflow_mode, created_at, updated_at
            FROM agfin_ai_bot_sessions
            WHERE id = $1
        """

        row = await self.pool.fetchrow(query, session_id)
        if not row:
            return None

        return {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "application_id": str(row["application_id"]) if row["application_id"] else None,
            "title": row["title"],
            "workflow_mode": row["workflow_mode"],
            "created_at": row["created_at"].isoformat(),
            "updated_at": row["updated_at"].isoformat()
        }

    async def create_session(
        self,
        user_id: str,
        title: str = "New Conversation",
        application_id: Optional[str] = None,
        workflow_mode: Optional[str] = None
    ) -> str:
        """
        Create a new chat session.

        Args:
            user_id: UUID of the user
            title: Session title (default: "New Conversation")
            application_id: Optional linked application UUID
            workflow_mode: Optional workflow context

        Returns:
            UUID of the created session
        """
        if not self.pool:
            await self.connect()

        query = """
            INSERT INTO agfin_ai_bot_sessions (user_id, title, application_id, workflow_mode)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """

        session_id = await self.pool.fetchval(
            query,
            user_id,
            title,
            application_id,
            workflow_mode
        )
        return str(session_id)

    async def update_message(
        self,
        message_id: str,
        content: str
    ) -> bool:
        """
        Update a message's content.

        Args:
            message_id: UUID of the message to update
            content: New message content

        Returns:
            True if update successful, False if message not found
        """
        if not self.pool:
            await self.connect()

        query = """
            UPDATE agfin_ai_bot_messages
            SET content = $2
            WHERE id = $1
            RETURNING id
        """

        result = await self.pool.fetchval(query, message_id, content)
        return result is not None

    async def delete_messages_after(
        self,
        session_id: str,
        message_id: str
    ) -> int:
        """
        Delete all messages in a session that were created after the specified message.

        Args:
            session_id: UUID of the chat session
            message_id: UUID of the message - all messages after this will be deleted

        Returns:
            Number of messages deleted
        """
        if not self.pool:
            await self.connect()

        # Get the timestamp of the reference message
        get_timestamp_query = """
            SELECT created_at FROM agfin_ai_bot_messages
            WHERE id = $1 AND session_id = $2
        """

        timestamp = await self.pool.fetchval(get_timestamp_query, message_id, session_id)
        if not timestamp:
            return 0

        # Delete all messages created after this timestamp
        delete_query = """
            DELETE FROM agfin_ai_bot_messages
            WHERE session_id = $1 AND created_at > $2
            RETURNING id
        """

        deleted = await self.pool.fetch(delete_query, session_id, timestamp)
        return len(deleted)


# Module-level client instance (initialized lazily)
_client: Optional[DatabaseClient] = None


async def get_db_client() -> DatabaseClient:
    """
    Get or create the module-level database client instance.

    Returns:
        Configured DatabaseClient instance
    """
    global _client
    if _client is None:
        _client = DatabaseClient()
        await _client.connect()
    return _client


async def close_db_client():
    """Close the module-level database client."""
    global _client
    if _client:
        await _client.close()
        _client = None
