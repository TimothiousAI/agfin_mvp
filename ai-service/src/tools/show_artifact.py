"""
Show Artifact Tool

Allows Claude to trigger UI artifact panels to display specific content
to the user (documents, forms, extraction previews, etc.).

This tool uses response metadata to signal the frontend to open artifact panels,
providing a richer user experience for complex data visualization.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "show_artifact",
    "description": """Open an artifact panel in the UI to display specific content.

Use this tool to show detailed or complex information in a dedicated UI panel:

Artifact Types:
- 'document': Display uploaded document with OCR results and annotations
- 'module_form': Show interactive form for a specific module (1-5) with pre-filled data
- 'extraction_preview': Display side-by-side document + extracted fields for review
- 'application_summary': Show complete application overview with progress visualization
- 'audit_review': Display fields flagged for audit with review interface

When to use:
- User asks to "view" or "show me" a document
- After extracting fields: "Let me show you what I found"
- When user needs to review/edit data: "Here's the form to review"
- After flagging items for audit: "I've highlighted the fields that need review"
- When explaining application status: "Let me show you your complete application"

How it works:
1. Tool validates the artifact exists and user has access
2. Returns response metadata that triggers frontend panel
3. Frontend opens appropriate panel with artifact_id
4. User can interact with content (view, edit, approve, etc.)

This provides a better UX than just describing data in text - users can see
and interact with their actual documents and forms.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "artifact_type": {
                "type": "string",
                "description": "Type of artifact to display. Options: 'document' (uploaded file), 'module_form' (interactive form for module 1-5), 'extraction_preview' (doc + extracted fields), 'application_summary' (complete overview), 'audit_review' (flagged items)",
                "enum": ["document", "module_form", "extraction_preview", "application_summary", "audit_review"]
            },
            "artifact_id": {
                "type": "string",
                "description": "ID of the artifact to display. For 'document'/'extraction_preview': document UUID. For 'module_form': module number (1-5). For 'application_summary'/'audit_review': application UUID (or uses session context)."
            },
            "application_id": {
                "type": "string",
                "description": "Optional application UUID. Required for 'module_form'. For other types, uses session context if not provided."
            }
        },
        "required": ["artifact_type", "artifact_id"]
    }
}


async def show_artifact(
    artifact_type: str,
    artifact_id: str,
    application_id: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Trigger UI artifact panel to display specific content.

    Args:
        artifact_type: Type of artifact (document, module_form, extraction_preview, application_summary, audit_review)
        artifact_id: ID of the artifact to display
        application_id: Optional application UUID (uses session context if not provided)
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - success: Boolean indicating operation success
        - artifact_type: Type of artifact displayed
        - artifact_id: ID of the artifact
        - ui_action: Frontend action to trigger
        - metadata: Additional data for frontend (title, description, etc.)
        - message: Confirmation message for Claude
        OR
        - error: Error code
        - message: Error description
    """
    # Validate artifact_type
    valid_types = ["document", "module_form", "extraction_preview", "application_summary", "audit_review"]
    if artifact_type not in valid_types:
        return {
            "error": "invalid_artifact_type",
            "message": f"Invalid artifact_type '{artifact_type}'. Must be one of: {', '.join(valid_types)}"
        }

    # Determine application_id
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    # For module_form, application_id is required
    if artifact_type == "module_form" and not target_application_id:
        return {
            "error": "application_id_required",
            "message": "artifact_type 'module_form' requires application_id (provide explicitly or via session context)"
        }

    try:
        db_client = await get_db_client()
        user_id = session_context.get("user_id") if session_context else None

        # Validate access and get artifact metadata based on type
        metadata = {}

        if artifact_type == "document":
            # Validate document exists and user has access
            doc_query = """
                SELECT
                    d.id,
                    d.application_id,
                    d.document_type,
                    d.storage_path,
                    d.extraction_status,
                    d.metadata,
                    a.user_id
                FROM documents d
                JOIN applications a ON a.id = d.application_id
                WHERE d.id = $1
            """
            doc_row = await db_client.pool.fetchrow(doc_query, artifact_id)

            if not doc_row:
                return {
                    "error": "document_not_found",
                    "message": f"Document {artifact_id} not found."
                }

            if user_id and str(doc_row["user_id"]) != user_id:
                return {
                    "error": "unauthorized",
                    "message": "You do not have permission to view this document."
                }

            metadata = {
                "document_id": str(doc_row["id"]),
                "application_id": str(doc_row["application_id"]),
                "document_type": doc_row["document_type"],
                "extraction_status": doc_row["extraction_status"],
                "storage_path": doc_row["storage_path"],
                "title": f"{doc_row['document_type'].replace('_', ' ').title()} Document"
            }

        elif artifact_type == "extraction_preview":
            # Similar to document but includes extracted fields
            doc_query = """
                SELECT
                    d.id,
                    d.application_id,
                    d.document_type,
                    d.storage_path,
                    d.extraction_status,
                    d.metadata,
                    a.user_id
                FROM documents d
                JOIN applications a ON a.id = d.application_id
                WHERE d.id = $1
            """
            doc_row = await db_client.pool.fetchrow(doc_query, artifact_id)

            if not doc_row:
                return {
                    "error": "document_not_found",
                    "message": f"Document {artifact_id} not found."
                }

            if user_id and str(doc_row["user_id"]) != user_id:
                return {
                    "error": "unauthorized",
                    "message": "You do not have permission to view this document."
                }

            # Get extracted fields linked to this document
            fields_query = """
                SELECT module_number, field_id, value, confidence_score
                FROM module_data
                WHERE source_document_id = $1
                ORDER BY module_number, field_id
            """
            fields = await db_client.pool.fetch(fields_query, artifact_id)

            metadata = {
                "document_id": str(doc_row["id"]),
                "application_id": str(doc_row["application_id"]),
                "document_type": doc_row["document_type"],
                "storage_path": doc_row["storage_path"],
                "extracted_fields_count": len(fields),
                "title": f"Extraction Preview: {doc_row['document_type'].replace('_', ' ').title()}"
            }

        elif artifact_type == "module_form":
            # Validate module number
            try:
                module_number = int(artifact_id)
                if module_number < 1 or module_number > 5:
                    raise ValueError()
            except ValueError:
                return {
                    "error": "invalid_module_number",
                    "message": f"artifact_id for 'module_form' must be a module number 1-5. Got: {artifact_id}"
                }

            # Validate application exists and user has access
            app_query = """
                SELECT id, user_id, status
                FROM applications
                WHERE id = $1
            """
            app_row = await db_client.pool.fetchrow(app_query, target_application_id)

            if not app_row:
                return {
                    "error": "application_not_found",
                    "message": f"Application {target_application_id} not found."
                }

            if user_id and str(app_row["user_id"]) != user_id:
                return {
                    "error": "unauthorized",
                    "message": "You do not have permission to view this application."
                }

            module_names = {
                1: "Financial Information",
                2: "Compliance Records",
                3: "Operations Data",
                4: "Sustainability Practices",
                5: "Risk Management"
            }

            metadata = {
                "module_number": module_number,
                "module_name": module_names[module_number],
                "application_id": str(app_row["id"]),
                "application_status": app_row["status"],
                "title": f"Module {module_number}: {module_names[module_number]}"
            }

        elif artifact_type == "application_summary":
            # Use artifact_id as application_id
            app_id = artifact_id if artifact_id != "current" else target_application_id

            if not app_id:
                return {
                    "error": "application_id_required",
                    "message": "No application_id provided for 'application_summary'"
                }

            app_query = """
                SELECT id, user_id, status, certification_type, created_at, updated_at
                FROM applications
                WHERE id = $1
            """
            app_row = await db_client.pool.fetchrow(app_query, app_id)

            if not app_row:
                return {
                    "error": "application_not_found",
                    "message": f"Application {app_id} not found."
                }

            if user_id and str(app_row["user_id"]) != user_id:
                return {
                    "error": "unauthorized",
                    "message": "You do not have permission to view this application."
                }

            metadata = {
                "application_id": str(app_row["id"]),
                "status": app_row["status"],
                "certification_type": app_row["certification_type"],
                "created_at": app_row["created_at"].isoformat(),
                "title": f"{app_row['certification_type'].title()} Certification Application"
            }

        elif artifact_type == "audit_review":
            # Show fields flagged for audit
            app_id = artifact_id if artifact_id != "current" else target_application_id

            if not app_id:
                return {
                    "error": "application_id_required",
                    "message": "No application_id provided for 'audit_review'"
                }

            app_query = """
                SELECT id, user_id, status
                FROM applications
                WHERE id = $1
            """
            app_row = await db_client.pool.fetchrow(app_query, app_id)

            if not app_row:
                return {
                    "error": "application_not_found",
                    "message": f"Application {app_id} not found."
                }

            if user_id and str(app_row["user_id"]) != user_id:
                return {
                    "error": "unauthorized",
                    "message": "You do not have permission to view this application."
                }

            # Count flagged fields
            flagged_query = """
                SELECT COUNT(*) as count
                FROM module_data
                WHERE application_id = $1
                    AND (
                        (jsonb_typeof(value) = 'object' AND value->>'_audit_flagged' = 'true')
                        OR value @> '{"_audit_flagged": true}'::jsonb
                    )
            """
            flagged_row = await db_client.pool.fetchrow(flagged_query, app_id)
            flagged_count = flagged_row["count"] if flagged_row else 0

            metadata = {
                "application_id": str(app_row["id"]),
                "flagged_fields_count": flagged_count,
                "title": f"Audit Review: {flagged_count} Field(s) Flagged"
            }

        # Return success with UI trigger metadata
        return {
            "success": True,
            "artifact_type": artifact_type,
            "artifact_id": artifact_id,
            "ui_action": "open_artifact_panel",
            "metadata": metadata,
            "message": f"Opening {artifact_type.replace('_', ' ')} panel for user.",
            "timestamp": datetime.utcnow().isoformat()
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while fetching artifact data: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for show_artifact.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
