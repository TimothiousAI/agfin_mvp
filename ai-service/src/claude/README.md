# Claude Client Module

Python client for Anthropic's Claude API with tool_runner support.

## Overview

This module provides a configured Claude client with:
- Default model configuration (claude-sonnet-4-5)
- Tool runner pattern (beta) support
- Async API with httpx
- Type hints for better IDE support

## Python 3.8 Compatibility Note

The official `anthropic` SDK requires Python 3.11+ and has build dependencies (tokenizers)
that don't compile on Python 3.8. This implementation uses direct HTTP calls via httpx
for Python 3.8 compatibility.

**For production with Python 3.11+:**
```bash
pip install anthropic>=0.18.0
```

Then update the imports to use the official SDK.

## Usage

### Basic Message

```python
from src.claude.client import get_client

client = get_client()
response = await client.send_message(
    message="What is the capital of France?",
    system="You are a helpful geography assistant."
)
print(response)
```

### With Tools (tool_runner pattern)

```python
from src.claude.client import ClaudeClient

client = ClaudeClient()

# Define tools
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                }
            },
            "required": ["location"]
        }
    }
]

# Execute with tool runner loop
response = await client.execute_with_tools(
    message="What's the weather in Paris?",
    tools=tools,
    system="You are a helpful assistant with access to weather data."
)
```

## Configuration

Set environment variables:
- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)

Default settings:
- Model: `claude-sonnet-4-5`
- Max tokens: `4096`
- Temperature: `1.0`

## API Reference

### ClaudeClient

Main client class for Claude API interactions.

**Methods:**
- `__init__(api_key, model, max_tokens, temperature)`: Initialize client
- `send_message(message, system, tools, **kwargs)`: Send a single message
- `execute_with_tools(message, tools, system, max_iterations)`: Execute with tool_runner loop

### Module Functions

- `get_client()`: Get or create singleton client instance
- `reset_client()`: Reset singleton (useful for testing)

## Testing

Run the test suite:

```bash
cd ai-service/src/claude
ANTHROPIC_API_KEY=your_key python test_client.py
```

## Architecture

The tool_runner pattern implements a loop:
1. Send message with available tools
2. If Claude requests tool use, execute the tool
3. Send tool results back to Claude
4. Repeat until final response (max 5 iterations)

This allows Claude to autonomously use tools to complete tasks.
