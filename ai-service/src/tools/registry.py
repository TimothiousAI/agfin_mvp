"""
Tool Registry and Execution Router

Central registry for all Claude AI agent tools. Manages tool registration,
execution routing, error handling, and logging.

This module provides:
- Tool registration with schema validation
- Safe tool execution with error handling
- Standardized result formatting
- Comprehensive logging for debugging and audit
"""

from typing import Dict, Any, Callable, Optional, List
import logging
import time
from datetime import datetime

# Import all tools
from .query_application import query_application, get_tool_definition as get_query_application_definition
from .create_application import create_application, get_tool_definition as get_create_application_definition
from .upload_document import upload_document, get_tool_definition as get_upload_document_definition
from .extract_fields import extract_fields, get_tool_definition as get_extract_fields_definition
from .update_module import update_module, get_tool_definition as get_update_module_definition
from .request_audit import request_audit, get_tool_definition as get_request_audit_definition
from .certify_application import certify_application, get_tool_definition as get_certify_application_definition
from .show_artifact import show_artifact, get_tool_definition as get_show_artifact_definition


# Set up logging
logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Central registry for AI agent tools.

    Manages tool definitions, execution routing, and result formatting.
    """

    def __init__(self):
        """Initialize the tool registry."""
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._register_all_tools()

    def _register_all_tools(self):
        """Register all available tools with their definitions and handlers."""

        # Tool registration format:
        # {
        #   "tool_name": {
        #     "handler": async function,
        #     "definition": Anthropic tool definition dict
        #   }
        # }

        tools_to_register = [
            ("query_application", query_application, get_query_application_definition),
            ("create_application", create_application, get_create_application_definition),
            ("upload_document", upload_document, get_upload_document_definition),
            ("extract_fields", extract_fields, get_extract_fields_definition),
            ("update_module", update_module, get_update_module_definition),
            ("request_audit", request_audit, get_request_audit_definition),
            ("certify_application", certify_application, get_certify_application_definition),
            ("show_artifact", show_artifact, get_show_artifact_definition),
        ]

        for tool_name, handler, definition_getter in tools_to_register:
            self.register_tool(tool_name, handler, definition_getter())

        logger.info(f"Tool registry initialized with {len(self._tools)} tools")

    def register_tool(
        self,
        name: str,
        handler: Callable,
        definition: Dict[str, Any]
    ):
        """
        Register a tool with its handler and definition.

        Args:
            name: Unique tool name (must match definition["name"])
            handler: Async function that executes the tool
            definition: Anthropic tool definition dictionary
        """
        if name in self._tools:
            logger.warning(f"Tool '{name}' already registered, overwriting")

        # Validate definition has required fields
        if "name" not in definition or "input_schema" not in definition:
            raise ValueError(f"Invalid tool definition for '{name}': missing name or input_schema")

        if definition["name"] != name:
            raise ValueError(f"Tool name mismatch: registry name '{name}' vs definition name '{definition['name']}'")

        self._tools[name] = {
            "handler": handler,
            "definition": definition
        }

        logger.debug(f"Registered tool: {name}")

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Get all tool definitions for Claude API.

        Returns:
            List of tool definition dictionaries for Anthropic API
        """
        return [tool["definition"] for tool in self._tools.values()]

    def get_tool_definition(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """
        Get definition for a specific tool.

        Args:
            tool_name: Name of the tool

        Returns:
            Tool definition dictionary or None if not found
        """
        tool = self._tools.get(tool_name)
        return tool["definition"] if tool else None

    async def execute_tool(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        session_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a tool by name with given input.

        Provides error handling, logging, and result formatting.

        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool
            session_context: Optional session context (user_id, application_id, etc.)

        Returns:
            Formatted tool result dictionary with:
            - success: Boolean
            - result: Tool result (if successful)
            - error: Error information (if failed)
            - execution_time: Time taken in seconds
            - tool_name: Name of executed tool
        """
        start_time = time.time()

        # Log tool execution start
        logger.info(f"Executing tool: {tool_name}", extra={
            "tool_name": tool_name,
            "tool_input": tool_input,
            "session_context": session_context
        })

        # Check if tool exists
        if tool_name not in self._tools:
            error_result = {
                "success": False,
                "error": {
                    "type": "tool_not_found",
                    "message": f"Tool '{tool_name}' not found in registry",
                    "available_tools": list(self._tools.keys())
                },
                "execution_time": time.time() - start_time,
                "tool_name": tool_name
            }
            logger.error(f"Tool not found: {tool_name}")
            return error_result

        # Get tool handler
        tool_handler = self._tools[tool_name]["handler"]

        try:
            # Execute tool with session context
            if session_context:
                result = await tool_handler(**tool_input, session_context=session_context)
            else:
                result = await tool_handler(**tool_input)

            execution_time = time.time() - start_time

            # Format successful result
            formatted_result = {
                "success": "error" not in result,
                "result": result,
                "execution_time": execution_time,
                "tool_name": tool_name,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Log success or error
            if formatted_result["success"]:
                logger.info(f"Tool executed successfully: {tool_name}", extra={
                    "tool_name": tool_name,
                    "execution_time": execution_time,
                    "result_keys": list(result.keys()) if isinstance(result, dict) else None
                })
            else:
                logger.warning(f"Tool returned error: {tool_name}", extra={
                    "tool_name": tool_name,
                    "execution_time": execution_time,
                    "error": result.get("error"),
                    "error_message": result.get("message")
                })

            return formatted_result

        except TypeError as e:
            # Invalid input parameters
            execution_time = time.time() - start_time
            error_result = {
                "success": False,
                "error": {
                    "type": "invalid_input",
                    "message": f"Invalid input parameters for tool '{tool_name}': {str(e)}",
                    "details": str(e)
                },
                "execution_time": execution_time,
                "tool_name": tool_name,
                "timestamp": datetime.utcnow().isoformat()
            }
            logger.error(f"Invalid input for tool {tool_name}: {e}", extra={
                "tool_name": tool_name,
                "error": str(e),
                "tool_input": tool_input
            })
            return error_result

        except Exception as e:
            # Unexpected error during execution
            execution_time = time.time() - start_time
            error_result = {
                "success": False,
                "error": {
                    "type": "execution_error",
                    "message": f"Unexpected error executing tool '{tool_name}': {str(e)}",
                    "details": str(e)
                },
                "execution_time": execution_time,
                "tool_name": tool_name,
                "timestamp": datetime.utcnow().isoformat()
            }
            logger.exception(f"Error executing tool {tool_name}", extra={
                "tool_name": tool_name,
                "error": str(e),
                "tool_input": tool_input
            })
            return error_result

    def list_tools(self) -> List[str]:
        """
        Get list of all registered tool names.

        Returns:
            List of tool names
        """
        return list(self._tools.keys())

    def get_tool_count(self) -> int:
        """
        Get count of registered tools.

        Returns:
            Number of registered tools
        """
        return len(self._tools)


# Global registry instance
_registry: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """
    Get the global tool registry instance (singleton pattern).

    Returns:
        ToolRegistry instance
    """
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry


# Convenience functions for direct access
def get_all_tool_definitions() -> List[Dict[str, Any]]:
    """
    Get all tool definitions for Claude API.

    Returns:
        List of tool definition dictionaries
    """
    registry = get_tool_registry()
    return registry.get_tool_definitions()


async def execute_tool(
    tool_name: str,
    tool_input: Dict[str, Any],
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a tool by name.

    Args:
        tool_name: Name of the tool to execute
        tool_input: Input parameters for the tool
        session_context: Optional session context

    Returns:
        Formatted tool result
    """
    registry = get_tool_registry()
    return await registry.execute_tool(tool_name, tool_input, session_context)


def list_available_tools() -> List[str]:
    """
    Get list of all available tool names.

    Returns:
        List of tool names
    """
    registry = get_tool_registry()
    return registry.list_tools()
