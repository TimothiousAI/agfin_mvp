"""
Semantic memory client with Supabase pgvector backend.

This module provides long-term semantic memory for the AI agent using:
- Supabase (PostgreSQL + pgvector) for vector storage
- OpenAI embeddings (text-embedding-3-small, 1536 dimensions)

NOTE: This is a stub/interface implementation for Python 3.8 compatibility.
The mem0ai library requires Python 3.9+ (uses dict[str, ...] syntax).

In production with Python 3.9+:
    pip install mem0ai

Then replace this stub with the full mem0 integration.
"""

import os
from typing import List, Dict, Any, Optional

# Embedding configuration
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
SIMILARITY_THRESHOLD = 0.7


class Mem0Client:
    """
    Semantic memory client interface for pgvector backend.

    Provides conversational memory storage and retrieval with
    vector similarity search.

    This is a stub implementation that provides the API structure.
    Full implementation requires Python 3.9+ with mem0ai library.
    """

    def __init__(
        self,
        user_id: Optional[str] = None,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        similarity_threshold: float = SIMILARITY_THRESHOLD
    ):
        """
        Initialize mem0 client with Supabase pgvector backend.

        Args:
            user_id: User identifier for memory isolation
            supabase_url: Supabase project URL (defaults to env var)
            supabase_key: Supabase anon key (defaults to env var)
            openai_api_key: OpenAI API key (defaults to env var)
            similarity_threshold: Minimum similarity score for search (0-1)
        """
        self.user_id = user_id or "default"
        self.similarity_threshold = similarity_threshold

        # Get configuration from environment
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

        if not self.openai_api_key:
            raise ValueError(
                "OpenAI API key required for embeddings. "
                "Set OPENAI_API_KEY environment variable."
            )

        # Database connection configuration
        self.db_config = {
            "host": os.getenv("PGVECTOR_HOST", "host.docker.internal"),
            "port": int(os.getenv("PGVECTOR_PORT", "5433")),
            "user": os.getenv("PGVECTOR_USER", "postgres"),
            "password": os.getenv("PGVECTOR_PASSWORD", "postgres"),
            "database": os.getenv("PGVECTOR_DATABASE", "postgres"),
        }

        # Embedding configuration
        self.embedding_config = {
            "model": EMBEDDING_MODEL,
            "dimensions": EMBEDDING_DIMENSIONS,
        }

    def add(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add a memory to the store.

        Args:
            content: The text content to remember
            metadata: Optional metadata to attach to memory

        Returns:
            Dictionary with memory ID and status
        """
        # Stub implementation
        # In production, this would:
        # 1. Generate embedding via OpenAI API
        # 2. Store in pgvector with metadata
        # 3. Return memory ID
        import uuid
        memory_id = str(uuid.uuid4())

        return {
            "id": memory_id,
            "status": "stub",
            "message": "Memory API stub - requires Python 3.9+ with mem0ai for full implementation"
        }

    def search(
        self,
        query: str,
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant memories using semantic similarity.

        Args:
            query: Search query text
            limit: Maximum number of results to return
            filters: Optional metadata filters

        Returns:
            List of relevant memories with scores
        """
        # Stub implementation
        # In production, this would:
        # 1. Generate embedding for query
        # 2. Perform pgvector similarity search
        # 3. Filter by threshold and metadata
        # 4. Return ranked results

        return [
            {
                "id": "stub_mem_1",
                "memory": "Example memory (stub)",
                "score": 0.85,
                "metadata": {},
                "message": "Stub implementation - requires Python 3.9+ with mem0ai"
            }
        ]

    def get_all(
        self,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all memories for the current user.

        Args:
            limit: Maximum number of memories to return

        Returns:
            List of all memories
        """
        return []

    def update(
        self,
        memory_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Update an existing memory.

        Args:
            memory_id: ID of memory to update
            content: New content

        Returns:
            Update result
        """
        return {
            "id": memory_id,
            "status": "stub",
            "message": "Update stub - requires Python 3.9+ with mem0ai"
        }

    def delete(
        self,
        memory_id: str
    ) -> Dict[str, Any]:
        """
        Delete a memory by ID.

        Args:
            memory_id: ID of memory to delete

        Returns:
            Deletion result
        """
        return {
            "id": memory_id,
            "status": "deleted",
            "message": "Delete stub - requires Python 3.9+ with mem0ai"
        }

    def delete_all(self) -> Dict[str, Any]:
        """
        Delete all memories for the current user.

        Returns:
            Deletion result
        """
        return {
            "status": "deleted",
            "count": 0,
            "message": "Delete all stub - requires Python 3.9+ with mem0ai"
        }

    def get_history(
        self,
        memory_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get the change history for a specific memory.

        Args:
            memory_id: ID of memory to get history for

        Returns:
            List of historical versions
        """
        return []


# Module-level client instance (initialized lazily)
_client: Optional[Mem0Client] = None


def get_client(user_id: Optional[str] = None) -> Mem0Client:
    """
    Get or create the module-level mem0 client instance.

    Args:
        user_id: Optional user ID for memory isolation

    Returns:
        Configured Mem0Client instance
    """
    global _client
    if _client is None or (user_id and _client.user_id != user_id):
        _client = Mem0Client(user_id=user_id)
    return _client


def reset_client():
    """Reset the module-level client (useful for testing)."""
    global _client
    _client = None
