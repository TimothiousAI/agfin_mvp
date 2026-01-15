# Memory Module

Semantic memory management using mem0 with Supabase pgvector backend.

## Overview

This module provides long-term conversational memory for the AI agent using:
- **mem0ai**: High-level memory management library
- **pgvector**: Vector similarity search in PostgreSQL
- **Supabase**: Managed PostgreSQL with pgvector extension
- **OpenAI embeddings**: text-embedding-3-small (1536 dimensions)

## Features

- Add memories with automatic embedding generation
- Semantic similarity search
- User-isolated memory stores
- Metadata filtering
- Memory history tracking
- CRUD operations on memories

## Configuration

Set environment variables:
```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_PASSWORD=postgres
```

Default settings:
- Embedding model: `text-embedding-3-small`
- Embedding dimensions: `1536`
- Similarity threshold: `0.7`
- Database: `host.docker.internal:5433/postgres`

## Usage

### Basic Operations

```python
from src.memory.mem0_client import get_client

# Initialize client for a user
memory = get_client(user_id="user123")

# Add a memory
result = memory.add(
    content="The user prefers Python over JavaScript",
    metadata={"category": "preferences", "confidence": 0.9}
)
print(f"Memory added: {result['id']}")

# Search for relevant memories
results = memory.search(
    query="What programming languages does the user like?",
    limit=5
)
for result in results:
    print(f"Score: {result['score']}, Content: {result['memory']}")
```

### Advanced Usage

```python
# Get all memories for a user
all_memories = memory.get_all(limit=100)

# Update a memory
memory.update(
    memory_id="mem_123",
    content="User strongly prefers Python for data science"
)

# Delete a specific memory
memory.delete(memory_id="mem_123")

# Delete all memories for user
memory.delete_all()

# Get memory history
history = memory.get_history(memory_id="mem_123")
```

### Filtering with Metadata

```python
# Add memories with metadata
memory.add(
    content="User lives in San Francisco",
    metadata={"category": "location", "verified": True}
)

# Search with filters
results = memory.search(
    query="Where does the user live?",
    limit=5,
    filters={"category": "location", "verified": True}
)
```

## Architecture

### Vector Storage

mem0 uses pgvector in Supabase to store embeddings:
1. Text content is embedded using OpenAI's `text-embedding-3-small`
2. 1536-dimensional vectors stored in PostgreSQL with pgvector
3. Similarity search uses cosine distance
4. Results filtered by configurable threshold (default: 0.7)

### User Isolation

Memories are isolated per user:
- Each user has a unique `user_id`
- Queries only return memories for the specified user
- Prevents information leakage between users

### Memory Lifecycle

```
Add Memory → Generate Embedding → Store in pgvector
                                       ↓
Search Query → Generate Embedding → Similarity Search → Filter by Threshold → Return Results
```

## Database Schema

mem0 creates the following tables in PostgreSQL:
- `memories`: Core memory storage
- `memory_embeddings`: Vector embeddings with pgvector
- `memory_metadata`: Additional metadata
- `memory_history`: Version history

The pgvector extension must be enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Testing

Run memory operations test:
```bash
cd ai-service/src/memory
OPENAI_API_KEY=your_key python test_mem0.py
```

## Performance

- **Add**: ~100-200ms (depends on OpenAI API latency)
- **Search**: ~10-50ms (pgvector similarity search is fast)
- **Scaling**: pgvector handles millions of vectors efficiently

## Integration with Claude

Memories can be injected into Claude prompts:
```python
# Get relevant memories
memories = memory.search(query=user_message, limit=3)

# Build context
context = "\n".join([f"- {m['memory']}" for m in memories])

# Send to Claude with context
system_prompt = f"""
You are a helpful assistant with memory of past conversations.

Relevant memories:
{context}
"""

response = await claude_client.send_message(
    message=user_message,
    system=system_prompt
)
```

## Troubleshooting

**Connection Issues:**
- Ensure Supabase is running: `docker-compose up -d`
- Check pgvector extension: `SELECT * FROM pg_extension WHERE extname='vector';`
- Verify port mapping: Container uses `host.docker.internal:5433`

**Embedding Errors:**
- Validate OpenAI API key is set
- Check rate limits on OpenAI account
- Ensure network access to OpenAI API

**Search Returns Empty:**
- Lower similarity threshold (default is 0.7)
- Check if memories exist: `memory.get_all()`
- Verify query is semantically similar to stored content
