"""
Anthropic Claude SDK client configuration and initialization.

This module provides a configured Claude client with tool_runner support
for the AgFinOps AI service.

NOTE: This is a stub implementation for Python 3.8 compatibility.
The anthropic SDK requires Python 3.11+ and has build dependencies (tokenizers)
that don't compile on Python 3.8. In production with Python 3.11+, install:
    pip install anthropic>=0.18.0

For now, this provides the API structure and can be used with direct HTTP calls.
"""

import os
import httpx
from typing import Optional, List, Dict, Any

# Default model configuration
DEFAULT_MODEL = "claude-sonnet-4-5"
DEFAULT_MAX_TOKENS = 4096
DEFAULT_TEMPERATURE = 1.0


class ClaudeClient:
    """
    Wrapper for Anthropic Claude API client with tool_runner support.

    Provides convenient methods for interacting with Claude models
    with sensible defaults and tool execution capabilities.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE
    ):
        """
        Initialize Claude client.

        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            model: Model name to use (default: claude-sonnet-4-5)
            max_tokens: Maximum tokens in response (default: 4096)
            temperature: Sampling temperature (default: 1.0)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Anthropic API key must be provided or set in ANTHROPIC_API_KEY environment variable"
            )

        # HTTP client for direct API calls (Python 3.8 compatible)
        self.http_client = httpx.AsyncClient(
            base_url="https://api.anthropic.com",
            headers={
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
        )
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature

    async def send_message(
        self,
        message: str,
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send a message to Claude and get a response.

        Args:
            message: The user message to send
            system: Optional system prompt
            tools: Optional list of tool definitions for tool_runner
            **kwargs: Additional parameters to pass to the API

        Returns:
            Response dictionary from Claude API
        """
        # Merge default parameters with provided kwargs
        params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            **kwargs
        }

        # Build messages list
        messages = [{"role": "user", "content": message}]

        # Add system prompt if provided
        if system:
            params["system"] = system

        # Add tools if provided (for tool_runner pattern)
        if tools:
            params["tools"] = tools

        # Prepare request body
        request_body = {
            "model": params["model"],
            "max_tokens": params["max_tokens"],
            "messages": messages
        }

        if "system" in params:
            request_body["system"] = params["system"]
        if "tools" in params:
            request_body["tools"] = params["tools"]
        if "temperature" in params:
            request_body["temperature"] = params["temperature"]

        # Call API via HTTP (Python 3.8 compatible approach)
        response = await self.http_client.post(
            "/v1/messages",
            json=request_body
        )
        response.raise_for_status()

        return response.json()

    async def execute_with_tools(
        self,
        message: str,
        tools: List[Dict[str, Any]],
        system: Optional[str] = None,
        max_iterations: int = 5
    ) -> Dict[str, Any]:
        """
        Execute a message with tool_runner pattern (beta).

        This implements the tool_runner loop:
        1. Send message with tools
        2. If Claude requests tool use, execute tools
        3. Send tool results back to Claude
        4. Repeat until final response

        Args:
            message: The user message
            tools: List of tool definitions
            system: Optional system prompt
            max_iterations: Max tool execution loops (default: 5)

        Returns:
            Final response from Claude after tool execution
        """
        messages = [{"role": "user", "content": message}]

        for iteration in range(max_iterations):
            response = await self.send_message(
                message=messages[-1]["content"],
                system=system,
                tools=tools
            )

            # Check if Claude wants to use tools
            if response.get("stop_reason") == "tool_use":
                # Extract tool use requests
                tool_uses = [
                    block for block in response.get("content", [])
                    if block.get("type") == "tool_use"
                ]

                # Execute tools and collect results
                tool_results = []
                for tool_use in tool_uses:
                    # In real implementation, this would call actual tool functions
                    # For now, this is a placeholder
                    result = self._execute_tool(
                        tool_use.get("name"),
                        tool_use.get("input", {})
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.get("id"),
                        "content": result
                    })

                # Add assistant response and tool results to conversation
                messages.append({
                    "role": "assistant",
                    "content": response.get("content")
                })
                messages.append({
                    "role": "user",
                    "content": tool_results
                })
            else:
                # Final response without tool use
                return response

        # Max iterations reached
        raise RuntimeError(f"Tool execution loop exceeded max iterations: {max_iterations}")

    def _execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> str:
        """
        Execute a tool by name with given input.

        This is a placeholder that should be replaced with actual tool registry.

        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool

        Returns:
            Tool execution result as string
        """
        # Placeholder implementation
        # In production, this would dispatch to a tool registry
        return f"Tool {tool_name} executed with input: {tool_input}"

    async def stream_message(
        self,
        message: str,
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ):
        """
        Stream a message to Claude and yield response chunks.

        Args:
            message: The user message to send
            system: Optional system prompt
            tools: Optional list of tool definitions
            **kwargs: Additional parameters

        Yields:
            Server-sent event data chunks from Claude API
        """
        # Merge default parameters
        params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": True,  # Enable streaming
            **kwargs
        }

        # Build messages list
        messages = [{"role": "user", "content": message}]

        # Prepare request body
        request_body = {
            "model": params["model"],
            "max_tokens": params["max_tokens"],
            "messages": messages,
            "stream": True
        }

        if system:
            request_body["system"] = system
        if tools:
            request_body["tools"] = tools
        if "temperature" in params:
            request_body["temperature"] = params["temperature"]

        # Stream response from API
        async with self.http_client.stream(
            "POST",
            "/v1/messages",
            json=request_body
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.strip():
                    # Skip SSE comment lines
                    if line.startswith(':'):
                        continue
                    # Parse SSE data
                    if line.startswith('data: '):
                        data = line[6:]  # Remove 'data: ' prefix
                        if data == '[DONE]':
                            break
                        yield data


# Module-level client instance (initialized lazily)
_client: Optional[ClaudeClient] = None


def get_client() -> ClaudeClient:
    """
    Get or create the module-level Claude client instance.

    Returns:
        Configured ClaudeClient instance
    """
    global _client
    if _client is None:
        _client = ClaudeClient()
    return _client


def reset_client():
    """Reset the module-level client (useful for testing)."""
    global _client
    _client = None
