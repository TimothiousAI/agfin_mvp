---
name: anthropic-tools
description: Anthropic Claude tool development skill. Use when creating new AI agent tools following Anthropic's tool_runner pattern and guidelines.
---

# Anthropic Tools Skill

Guide for creating AI agent tools following Anthropic's best practices for the AgFin AI service.

## Overview

AgFin uses Anthropic's Claude with the tool_runner pattern for AI agent functionality. This skill covers how to create well-designed tools that follow Anthropic's guidelines.

## Instructions

### Tool Definition Structure

```python
def create_tool():
    return {
        "name": "tool_name",
        "description": """Detailed description of what the tool does.

Use this tool when:
- [Specific scenario 1]
- [Specific scenario 2]

Do NOT use this tool when:
- [Anti-pattern 1]

Returns: [Description of return value]""",
        "input_schema": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Clear description of parameter"
                },
                "param2": {
                    "type": "integer",
                    "description": "What this number represents"
                }
            },
            "required": ["param1"]
        }
    }
```

### Description Guidelines

**DO:**
- Explain WHAT the tool does
- Explain WHEN to use it
- Explain HOW to use it (what inputs mean)
- Describe the return value
- List anti-patterns (when NOT to use)

**DON'T:**
- Use vague descriptions
- Omit return value description
- Forget edge cases
- Leave parameters undocumented

### Tool Implementation Pattern

```python
from typing import Any, Dict

def execute_tool(name: str, input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool and return results."""
    try:
        if name == "query_application":
            return execute_query_application(input)
        elif name == "create_application":
            return execute_create_application(input)
        # ... other tools
        else:
            return {
                "is_error": True,
                "content": f"Unknown tool: {name}"
            }
    except Exception as e:
        return {
            "is_error": True,
            "content": str(e)
        }
```

### Tool Runner Loop

```python
from anthropic import Anthropic

client = Anthropic()

def run_agent(user_message: str, session_id: str):
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=get_all_tools(),
            messages=messages
        )

        if response.stop_reason == "tool_use":
            # Execute tools
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result) if isinstance(result, dict) else result,
                        "is_error": result.get("is_error", False) if isinstance(result, dict) else False
                    })

            # Continue conversation with tool results
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
        else:
            # Final response
            return extract_text(response.content)
```

### AgFin Tools Reference

| Tool | Purpose |
|------|---------|
| `query_application` | Retrieve application data, status, documents |
| `create_application` | Create new loan application |
| `upload_document` | Trigger document upload UI in chat |
| `extract_fields` | Process document with Docling OCR |
| `update_module` | Update module field values |
| `request_audit` | Flag fields for audit review |
| `certify_application` | Lock and certify application |
| `show_artifact` | Display artifact panel content |

### Example Tool: query_application

```python
def create_query_application_tool():
    return {
        "name": "query_application",
        "description": """Retrieves complete loan application data including status, documents, and module completion.

Use this tool when:
- User asks about application status or progress
- You need to check what documents have been uploaded
- You need to verify module completion before suggesting next steps
- User asks for a summary of an application

Do NOT use this tool when:
- You already have current application data in context
- User is asking about creating a NEW application

Returns: Application object with:
- id, farmer_name, farmer_email, status
- documents: Array of uploaded documents with extraction status
- module_data: Array of field values by module number""",
        "input_schema": {
            "type": "object",
            "properties": {
                "application_id": {
                    "type": "string",
                    "format": "uuid",
                    "description": "The UUID of the application to query"
                }
            },
            "required": ["application_id"]
        }
    }

async def execute_query_application(input: dict) -> dict:
    application_id = input["application_id"]

    # Query database
    result = await supabase.from("applications") \
        .select("*, documents(*), module_data(*)") \
        .eq("id", application_id) \
        .single()

    if result.error:
        return {"is_error": True, "content": result.error.message}

    return result.data
```

## Tips

- Tools should be single-purpose (do ONE thing well)
- Always handle errors gracefully with `is_error: true`
- Include comprehensive descriptions - Claude uses these to decide when to call tools
- Test tools independently before integrating
- Log tool calls for debugging and monitoring
