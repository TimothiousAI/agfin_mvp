"""
Request Audit Tool

Allows Claude to flag specific fields or documents that require manual human review.
This is used when AI confidence is low or when data appears inconsistent/suspicious.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "request_audit",
    "description": """Flag fields or documents that require manual human audit review.

Use this tool when:
- AI extraction confidence is low (< 0.7) and you're uncertain about data accuracy
- Data appears inconsistent or suspicious (e.g., negative revenue, impossible dates)
- Multiple conflicting values extracted from different documents
- Critical fields need human verification before certification
- User explicitly requests manual review of specific data
- You detect potential errors or data quality issues

The tool will:
1. Mark specified fields in the module_data table as needing review
2. Update document extraction status to 'audited' to trigger human review
3. Create audit trail entry documenting why review was requested
4. Return confirmation of what was flagged

Examples of when to use:
- "The revenue figure seems unusually high - I recommend manual verification"
- "This field has low OCR confidence (0.65) - flagging for human review"
- "Multiple documents show different farm sizes - needs auditor clarification"

Flagged items will appear in the auditor's review queue and block final certification
until reviewed and approved by a human.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "string",
                "description": "UUID of the application containing items to flag. If not provided, uses application_id from current session."
            },
            "document_id": {
                "type": "string",
                "description": "Optional UUID of a specific document to flag for review. Use this when the entire document needs re-processing or manual review."
            },
            "field_ids": {
                "type": "array",
                "description": "Array of field identifiers to flag for review. Each field_id should match a field in module_data (e.g., ['total_revenue', 'farm_size_hectares']). If not provided, only the document (if specified) will be flagged.",
                "items": {
                    "type": "string"
                }
            },
            "reason": {
                "type": "string",
                "description": "Required explanation of why manual review is needed. Be specific about the concern. Example: 'Low OCR confidence (0.62) on critical financial field' or 'Extracted value conflicts with farmer's verbal statement'."
            }
        },
        "required": ["reason"]
    }
}


async def request_audit(
    reason: str,
    application_id: Optional[str] = None,
    document_id: Optional[str] = None,
    field_ids: Optional[List[str]] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Flag fields or documents that require manual audit review.

    Args:
        reason: Required explanation of why review is needed
        application_id: UUID of the application (optional, uses session context if not provided)
        document_id: Optional UUID of document to flag for review
        field_ids: Optional list of field_ids to flag in module_data
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - success: Boolean indicating operation success
        - flagged_fields_count: Number of fields flagged
        - flagged_document: Boolean indicating if document was flagged
        - reason: The reason provided for audit
        - message: Confirmation message
        OR
        - error: Error code
        - message: Error description
    """
    # Determine which application to update
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    if not target_application_id:
        return {
            "error": "application_id_required",
            "message": "No application_id provided and no application linked to current session. Please provide an application_id or link an application to this conversation."
        }

    # Validate at least one target is specified
    if not document_id and not field_ids:
        return {
            "error": "no_targets_specified",
            "message": "Must specify either document_id or field_ids (or both) to flag for audit."
        }

    try:
        db_client = await get_db_client()

        # Get user_id for authorization and audit trail
        user_id = session_context.get("user_id") if session_context else None

        # Verify application exists and user has access
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

        # Authorization check - user can only flag their own applications
        if user_id and str(app_row["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to flag items in this application."
            }

        flagged_fields_count = 0
        flagged_document = False
        audit_details = []

        # Flag document if specified
        if document_id:
            # Verify document belongs to this application
            doc_check_query = """
                SELECT id, document_type, extraction_status
                FROM documents
                WHERE id = $1 AND application_id = $2
            """
            doc_row = await db_client.pool.fetchrow(doc_check_query, document_id, target_application_id)

            if not doc_row:
                return {
                    "error": "document_not_found",
                    "message": f"Document {document_id} not found in application {target_application_id}."
                }

            # Update document metadata to include audit flag
            update_doc_query = """
                UPDATE documents
                SET
                    metadata = jsonb_set(
                        COALESCE(metadata, '{}'::jsonb),
                        '{needs_audit}',
                        'true'::jsonb
                    ),
                    metadata = jsonb_set(
                        metadata,
                        '{audit_reason}',
                        to_jsonb($1::text)
                    ),
                    metadata = jsonb_set(
                        metadata,
                        '{audit_requested_at}',
                        to_jsonb($2::text)
                    ),
                    extraction_status = CASE
                        WHEN extraction_status = 'processed' THEN 'audited'
                        ELSE extraction_status
                    END
                WHERE id = $3
                RETURNING id
            """
            await db_client.pool.fetchrow(
                update_doc_query,
                reason,
                datetime.utcnow().isoformat(),
                document_id
            )

            flagged_document = True
            audit_details.append(f"Document {doc_row['document_type']} flagged")

        # Flag fields if specified
        if field_ids and len(field_ids) > 0:
            for field_id in field_ids:
                # Check if field exists in module_data
                field_query = """
                    SELECT id, module_number, field_id, value, source
                    FROM module_data
                    WHERE application_id = $1 AND field_id = $2
                """
                field_row = await db_client.pool.fetchrow(field_query, target_application_id, field_id)

                if field_row:
                    # Field exists - add audit flag to its value JSONB
                    # We store the flag in a metadata structure within the JSONB value
                    update_field_query = """
                        UPDATE module_data
                        SET
                            value = CASE
                                WHEN jsonb_typeof(value) = 'object' THEN
                                    jsonb_set(
                                        value,
                                        '{_audit_flagged}',
                                        'true'::jsonb
                                    )
                                ELSE
                                    jsonb_build_object(
                                        '_value', value,
                                        '_audit_flagged', true,
                                        '_audit_reason', $1,
                                        '_audit_requested_at', $2
                                    )
                            END,
                            updated_at = NOW()
                        WHERE id = $3
                        RETURNING id
                    """
                    await db_client.pool.fetchrow(
                        update_field_query,
                        reason,
                        datetime.utcnow().isoformat(),
                        field_row["id"]
                    )

                    flagged_fields_count += 1
                    audit_details.append(f"Field '{field_id}' in module {field_row['module_number']} flagged")

        # Create audit trail entry
        if user_id:
            audit_entry_query = """
                INSERT INTO audit_trail (
                    application_id,
                    user_id,
                    action,
                    field_id,
                    new_value,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, NOW())
            """
            field_list = ", ".join(field_ids) if field_ids else None
            await db_client.pool.execute(
                audit_entry_query,
                target_application_id,
                user_id,
                "audit_requested",
                field_list,
                reason
            )

        # Update application's updated_at timestamp
        await db_client.pool.execute(
            "UPDATE applications SET updated_at = NOW() WHERE id = $1",
            target_application_id
        )

        return {
            "success": True,
            "flagged_fields_count": flagged_fields_count,
            "flagged_document": flagged_document,
            "reason": reason,
            "details": audit_details,
            "message": f"Successfully flagged {flagged_fields_count} field(s) and {1 if flagged_document else 0} document(s) for manual audit review. Reason: {reason}"
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while flagging items for audit: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for request_audit.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
