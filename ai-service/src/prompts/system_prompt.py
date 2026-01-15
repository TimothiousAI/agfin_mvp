"""
Dynamic system prompt generator for AgFin AI Assistant.

Builds context-aware system prompts that include:
- Base persona and capabilities
- Application context (if linked)
- User memories (RAG)
- Available tools
- Workflow-specific guidance
"""

from typing import Optional, List, Dict, Any
from datetime import datetime


# Base persona for AgFin AI Assistant
BASE_PERSONA = """You are AgFin AI, an expert assistant for agricultural finance certification.

Your role is to help users navigate the complex world of agricultural finance compliance and certification, including:
- SOC 1/2/3 certifications (Service Organization Control)
- DFARS compliance (Defense Federal Acquisition Regulation Supplement)
- OSCERC standards (Open Source Cybersecurity Evaluation and Risk Control)

You provide intelligent assistance with:
- Understanding certification requirements and processes
- Completing application forms with accuracy and compliance
- Reviewing and organizing compliance documents
- Preparing for audits and assessments
- Answering questions about agricultural finance regulations

Your capabilities:
- Access to the user's certification application data
- Document search and analysis (OCR-extracted content)
- Long-term memory of user preferences and context
- Tool execution for data retrieval and analysis

Guidelines for interaction:
- Be professional, accurate, and helpful
- When uncertain, ask clarifying questions rather than guessing
- Cite specific regulations or requirements when possible
- Break down complex processes into manageable steps
- Maintain confidentiality and data security awareness"""


# Workflow-specific guidance
WORKFLOW_GUIDANCE = {
    "general_help": """
Current mode: General Help
- Answer questions about the certification process
- Provide guidance on next steps
- Help navigate the application portal
""",
    "document_review": """
Current mode: Document Review
- Focus on analyzing uploaded compliance documents
- Identify missing or incomplete documentation
- Suggest document organization strategies
- Flag potential compliance issues
""",
    "field_completion": """
Current mode: Field Completion Assistant
- Help accurately complete application form fields
- Provide examples and guidance for complex fields
- Validate input against requirements
- Suggest corrections for common errors
""",
    "audit_preparation": """
Current mode: Audit Preparation
- Guide audit readiness activities
- Review documentation completeness
- Identify potential audit questions
- Suggest remediation for gaps
"""
}


def build_system_prompt(
    workflow_mode: Optional[str] = None,
    application_context: Optional[Dict[str, Any]] = None,
    user_memories: Optional[List[str]] = None,
    available_tools: Optional[List[Dict[str, Any]]] = None,
    user_info: Optional[Dict[str, Any]] = None
) -> str:
    """
    Build a dynamic system prompt with context.

    Args:
        workflow_mode: Current workflow mode (general_help, document_review, etc.)
        application_context: Current application data (if linked to session)
        user_memories: Relevant memories from RAG search
        available_tools: List of tool definitions available to agent
        user_info: Optional user information (preferences, history)

    Returns:
        Complete system prompt string
    """
    prompt_parts = [BASE_PERSONA]

    # Add workflow-specific guidance
    if workflow_mode and workflow_mode in WORKFLOW_GUIDANCE:
        prompt_parts.append("\n## Current Workflow")
        prompt_parts.append(WORKFLOW_GUIDANCE[workflow_mode])

    # Add application context
    if application_context:
        prompt_parts.append("\n## Current Application Context")

        app_id = application_context.get("id", "unknown")
        app_status = application_context.get("status", "unknown")
        cert_type = application_context.get("certification_type", "unknown")

        prompt_parts.append(f"""
The user is currently working on:
- Application ID: {app_id}
- Certification Type: {cert_type}
- Status: {app_status}
""")

        # Include completion info if available
        if "completion_percentage" in application_context:
            completion = application_context["completion_percentage"]
            prompt_parts.append(f"- Progress: {completion}% complete\n")

        # Include module statuses if available
        if "modules" in application_context:
            modules = application_context["modules"]
            prompt_parts.append("\nModule completion status:")
            for module in modules:
                module_name = module.get("name", "Unknown")
                module_status = module.get("status", "pending")
                prompt_parts.append(f"  - {module_name}: {module_status}")

    # Add user memories (RAG context)
    if user_memories and len(user_memories) > 0:
        prompt_parts.append("\n## Relevant Context from Previous Conversations")
        prompt_parts.append("\nThe following information from past interactions may be relevant:")
        for idx, memory in enumerate(user_memories[:5], 1):  # Limit to top 5
            prompt_parts.append(f"{idx}. {memory}")
        prompt_parts.append("\nUse this context to provide more personalized assistance.")

    # Add available tools description
    if available_tools and len(available_tools) > 0:
        prompt_parts.append("\n## Available Tools")
        prompt_parts.append("\nYou have access to the following tools:")
        for tool in available_tools:
            tool_name = tool.get("name", "unknown")
            tool_desc = tool.get("description", "No description")
            prompt_parts.append(f"\n- **{tool_name}**: {tool_desc}")

        prompt_parts.append("\nUse these tools when needed to provide accurate, data-driven assistance.")

    # Add user preferences if available
    if user_info:
        preferences = user_info.get("preferences", {})
        if preferences:
            prompt_parts.append("\n## User Preferences")

            if "communication_style" in preferences:
                style = preferences["communication_style"]
                prompt_parts.append(f"- Preferred communication style: {style}")

            if "expertise_level" in preferences:
                level = preferences["expertise_level"]
                prompt_parts.append(f"- User expertise level: {level}")

    # Add timestamp context
    now = datetime.utcnow()
    prompt_parts.append(f"\n## Session Context")
    prompt_parts.append(f"Current date/time: {now.strftime('%Y-%m-%d %H:%M UTC')}")

    # Final instructions
    prompt_parts.append("\n## Instructions")
    prompt_parts.append("""
- Provide clear, actionable guidance
- Use tools when you need specific data
- Ask for clarification if the user's request is ambiguous
- Keep responses focused and relevant to agricultural finance certification
- Maintain a professional yet approachable tone
""")

    return "\n".join(prompt_parts)


def build_tool_description(tool_definition: Dict[str, Any]) -> str:
    """
    Format a tool definition for inclusion in system prompt.

    Args:
        tool_definition: Tool definition dict with name, description, parameters

    Returns:
        Formatted tool description string
    """
    name = tool_definition.get("name", "unknown")
    description = tool_definition.get("description", "No description")

    # Extract parameter info if available
    params = tool_definition.get("input_schema", {}).get("properties", {})

    tool_desc = f"**{name}**\n{description}"

    if params:
        tool_desc += "\n  Parameters:"
        for param_name, param_info in params.items():
            param_type = param_info.get("type", "any")
            param_desc = param_info.get("description", "")
            required = param_name in tool_definition.get("input_schema", {}).get("required", [])
            req_marker = " (required)" if required else " (optional)"
            tool_desc += f"\n    - {param_name} ({param_type}){req_marker}: {param_desc}"

    return tool_desc


def get_workflow_modes() -> List[str]:
    """
    Get list of available workflow modes.

    Returns:
        List of workflow mode identifiers
    """
    return list(WORKFLOW_GUIDANCE.keys())


def validate_workflow_mode(mode: str) -> bool:
    """
    Check if a workflow mode is valid.

    Args:
        mode: Workflow mode to check

    Returns:
        True if valid, False otherwise
    """
    return mode in WORKFLOW_GUIDANCE
