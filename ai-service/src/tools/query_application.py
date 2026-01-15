"""
Query Application Tool

Allows Claude to retrieve detailed information about a certification application,
including status, documents, module data, and completion percentage.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "query_application",
    "description": """Get detailed information about a certification application.

This tool retrieves comprehensive application data including:
- Current application status (draft, in_progress, under_review, approved, rejected)
- List of uploaded documents with their processing status
- Module-specific data entries (financial records, compliance info, etc.)
- Overall completion percentage based on required modules
- Applicant information and timestamps

Use this when the user asks about:
- "What's the status of my application?"
- "Show me my application details"
- "What documents have I uploaded?"
- "How complete is my application?"
- "What modules still need data?"

The tool uses the application_id from the current conversation context if not provided.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "string",
                "description": "UUID of the application to query. If not provided, uses the application_id from the current session context. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            }
        },
        "required": []  # application_id is optional - uses context if not provided
    }
}


async def query_application(
    application_id: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Query detailed application information from the database.

    Args:
        application_id: UUID of the application to query (optional)
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - application: Basic application info (id, status, created_at, updated_at)
        - applicant: User information (id, email, name if available)
        - documents: List of uploaded documents with processing status
        - modules: List of module data entries with completion status
        - completion: Completion percentage and required vs completed modules
        - error: Error message if something went wrong

    Raises:
        ValueError: If application_id not provided and not in session context
        PermissionError: If user doesn't have access to the application
    """
    # Determine which application to query BEFORE connecting to database
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    if not target_application_id:
        return {
            "error": "application_id_required",
            "message": "No application_id provided and no application linked to current session. Please provide an application_id or link an application to this conversation."
        }

    # Now connect to database
    db_client = await get_db_client()

    # Get user_id for authorization check
    user_id = session_context.get("user_id") if session_context else None

    try:
        # Query application with applicant info
        app_query = """
            SELECT
                a.id,
                a.user_id,
                a.status,
                a.certification_type,
                a.notes,
                a.created_at,
                a.updated_at
            FROM applications a
            WHERE a.id = $1
        """
        app_row = await db_client.pool.fetchrow(app_query, target_application_id)

        if not app_row:
            return {
                "error": "application_not_found",
                "message": f"Application with id {target_application_id} not found."
            }

        # Authorization check - user can only access their own applications
        if user_id and str(app_row["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to access this application."
            }

        # Get documents for this application
        docs_query = """
            SELECT
                id,
                file_name,
                file_size,
                mime_type,
                storage_path,
                ocr_status,
                extraction_metadata,
                created_at
            FROM documents
            WHERE application_id = $1
            ORDER BY created_at DESC
        """
        doc_rows = await db_client.pool.fetch(docs_query, target_application_id)

        documents = [
            {
                "id": str(row["id"]),
                "file_name": row["file_name"],
                "file_size": row["file_size"],
                "mime_type": row["mime_type"],
                "ocr_status": row["ocr_status"],
                "has_extracted_data": bool(row["extraction_metadata"]),
                "uploaded_at": row["created_at"].isoformat()
            }
            for row in doc_rows
        ]

        # Get module data entries
        modules_query = """
            SELECT
                id,
                module_name,
                field_name,
                field_value,
                data_source,
                confidence_score,
                created_at
            FROM module_data
            WHERE application_id = $1
            ORDER BY module_name, field_name
        """
        module_rows = await db_client.pool.fetch(modules_query, target_application_id)

        # Group by module name
        modules_dict: Dict[str, List[Dict[str, Any]]] = {}
        for row in module_rows:
            module_name = row["module_name"]
            if module_name not in modules_dict:
                modules_dict[module_name] = []

            modules_dict[module_name].append({
                "id": str(row["id"]),
                "field_name": row["field_name"],
                "field_value": row["field_value"],
                "data_source": row["data_source"],
                "confidence_score": float(row["confidence_score"]) if row["confidence_score"] else None,
                "created_at": row["created_at"].isoformat()
            })

        modules = [
            {
                "module_name": module_name,
                "field_count": len(fields),
                "fields": fields
            }
            for module_name, fields in modules_dict.items()
        ]

        # Calculate completion percentage
        # For now, assume 5 required modules: financial, compliance, operations, sustainability, risk
        required_modules = ["financial", "compliance", "operations", "sustainability", "risk"]
        completed_modules = [m for m in required_modules if m in modules_dict]
        completion_pct = int((len(completed_modules) / len(required_modules)) * 100)

        return {
            "application": {
                "id": str(app_row["id"]),
                "status": app_row["status"],
                "certification_type": app_row["certification_type"],
                "notes": app_row["notes"],
                "created_at": app_row["created_at"].isoformat(),
                "updated_at": app_row["updated_at"].isoformat()
            },
            "applicant": {
                "user_id": str(app_row["user_id"])
            },
            "documents": documents,
            "modules": modules,
            "completion": {
                "percentage": completion_pct,
                "required_modules": required_modules,
                "completed_modules": completed_modules,
                "missing_modules": [m for m in required_modules if m not in modules_dict]
            }
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while querying application: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for query_application.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
