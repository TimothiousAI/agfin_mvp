"""
Certify Application Tool

Allows Claude to complete and lock a certification application once all requirements
are met. This is the final step in the certification workflow.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "certify_application",
    "description": """Complete and lock a certification application for final approval.

This is the final step in the certification workflow. Use this tool when:
- All required documents have been uploaded and processed
- All required modules (1-5) have been completed with data
- Any flagged items have been reviewed and resolved
- User explicitly confirms they're ready to submit for certification

The tool will:
1. Validate all documents are in 'audited' or 'processed' status (no pending/failed)
2. Validate all 5 required modules have data populated
3. Check that no fields are currently flagged for audit
4. Update application status to 'approved' and lock it from further edits
5. Create audit trail entry documenting certification
6. Return certification status and placeholder for PDF generation

IMPORTANT: This action is irreversible. Once certified, the application is locked
and cannot be edited. Only use when user explicitly confirms readiness.

After certification:
- Application status changes to 'approved'
- No further edits allowed
- Application enters final review queue
- PDF certificate will be generated (in production)

Use cases:
- User says "I'm ready to submit my application"
- User confirms "yes, certify my application"
- All validation checks pass and user approves final submission""",
    "input_schema": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "string",
                "description": "UUID of the application to certify. If not provided, uses application_id from current session."
            },
            "certification_confirmed": {
                "type": "boolean",
                "description": "Required explicit confirmation that user wants to certify and lock the application. Must be true to proceed. This ensures users understand the action is irreversible."
            }
        },
        "required": ["certification_confirmed"]
    }
}


async def certify_application(
    certification_confirmed: bool,
    application_id: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Complete and lock a certification application.

    Args:
        certification_confirmed: Required explicit confirmation (must be True)
        application_id: UUID of the application (optional, uses session context if not provided)
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - success: Boolean indicating certification success
        - application_id: ID of certified application
        - status: New application status (approved)
        - certified_at: Timestamp of certification
        - pdf_url: URL to generated certificate PDF (placeholder for now)
        - message: Confirmation message
        OR
        - error: Error code
        - message: Error description
        - validation_failures: List of specific validation issues (if applicable)
    """
    # Validate confirmation
    if not certification_confirmed:
        return {
            "error": "confirmation_required",
            "message": "Certification requires explicit confirmation. Set certification_confirmed=true to proceed. This action is irreversible and will lock the application."
        }

    # Determine which application to certify
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    if not target_application_id:
        return {
            "error": "application_id_required",
            "message": "No application_id provided and no application linked to current session."
        }

    try:
        db_client = await get_db_client()

        # Get user_id for authorization and audit trail
        user_id = session_context.get("user_id") if session_context else None

        # Get application details
        app_query = """
            SELECT id, user_id, status, certification_type, created_at
            FROM applications
            WHERE id = $1
        """
        app_row = await db_client.pool.fetchrow(app_query, target_application_id)

        if not app_row:
            return {
                "error": "application_not_found",
                "message": f"Application {target_application_id} not found."
            }

        # Authorization check
        if user_id and str(app_row["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to certify this application."
            }

        # Check if already certified
        if app_row["status"] in ["approved", "rejected"]:
            return {
                "error": "already_certified",
                "message": f"Application is already {app_row['status']} and cannot be re-certified."
            }

        # Validation checks
        validation_failures = []

        # Check 1: All documents must be processed or audited (no pending/failed)
        doc_status_query = """
            SELECT extraction_status, COUNT(*) as count
            FROM documents
            WHERE application_id = $1
            GROUP BY extraction_status
        """
        doc_statuses = await db_client.pool.fetch(doc_status_query, target_application_id)

        doc_status_dict = {row["extraction_status"]: row["count"] for row in doc_statuses}

        if doc_status_dict.get("pending", 0) > 0:
            validation_failures.append(f"{doc_status_dict['pending']} document(s) still pending processing")

        if doc_status_dict.get("processing", 0) > 0:
            validation_failures.append(f"{doc_status_dict['processing']} document(s) currently being processed")

        if doc_status_dict.get("error", 0) > 0:
            validation_failures.append(f"{doc_status_dict['error']} document(s) failed processing")

        # Check 2: All 5 modules must have data
        module_query = """
            SELECT DISTINCT module_number
            FROM module_data
            WHERE application_id = $1
            ORDER BY module_number
        """
        modules_with_data = await db_client.pool.fetch(module_query, target_application_id)
        module_numbers = [row["module_number"] for row in modules_with_data]

        required_modules = [1, 2, 3, 4, 5]
        missing_modules = [m for m in required_modules if m not in module_numbers]

        if missing_modules:
            module_names = {
                1: "Financial Information",
                2: "Compliance Records",
                3: "Operations Data",
                4: "Sustainability Practices",
                5: "Risk Management"
            }
            missing_names = [f"Module {m} ({module_names[m]})" for m in missing_modules]
            validation_failures.append(f"Missing required modules: {', '.join(missing_names)}")

        # Check 3: No fields should be flagged for audit
        flagged_fields_query = """
            SELECT COUNT(*) as count
            FROM module_data
            WHERE application_id = $1
                AND (
                    (jsonb_typeof(value) = 'object' AND value->>'_audit_flagged' = 'true')
                    OR
                    value @> '{"_audit_flagged": true}'::jsonb
                )
        """
        flagged_count_row = await db_client.pool.fetchrow(flagged_fields_query, target_application_id)
        flagged_count = flagged_count_row["count"] if flagged_count_row else 0

        if flagged_count > 0:
            validation_failures.append(f"{flagged_count} field(s) flagged for audit - must be reviewed before certification")

        # Check 4: At least one document uploaded
        total_docs_query = """
            SELECT COUNT(*) as count
            FROM documents
            WHERE application_id = $1
        """
        total_docs_row = await db_client.pool.fetchrow(total_docs_query, target_application_id)
        total_docs = total_docs_row["count"] if total_docs_row else 0

        if total_docs == 0:
            validation_failures.append("No documents uploaded - at least one document is required")

        # If validation failed, return errors
        if validation_failures:
            return {
                "error": "validation_failed",
                "message": "Application does not meet certification requirements. Please resolve the following issues:",
                "validation_failures": validation_failures,
                "application_id": str(app_row["id"]),
                "current_status": app_row["status"]
            }

        # All validations passed - proceed with certification
        certified_at = datetime.utcnow()

        # Update application status to approved
        update_app_query = """
            UPDATE applications
            SET
                status = 'approved',
                updated_at = $1,
                notes = COALESCE(notes, '') || E'\n\nCertified at: ' || $2
            WHERE id = $3
            RETURNING id, status
        """
        updated_app = await db_client.pool.fetchrow(
            update_app_query,
            certified_at,
            certified_at.isoformat(),
            target_application_id
        )

        # Create audit trail entry
        if user_id:
            audit_entry_query = """
                INSERT INTO audit_trail (
                    application_id,
                    user_id,
                    action,
                    new_value,
                    created_at
                )
                VALUES ($1, $2, 'application_certified', $3, $4)
            """
            await db_client.pool.execute(
                audit_entry_query,
                target_application_id,
                user_id,
                f"Application certified for {app_row['certification_type']}",
                certified_at
            )

        # In production, this would trigger PDF generation
        # For now, return a placeholder URL
        pdf_url = f"/api/applications/{target_application_id}/certificate.pdf"

        return {
            "success": True,
            "application_id": str(updated_app["id"]),
            "status": updated_app["status"],
            "certification_type": app_row["certification_type"],
            "certified_at": certified_at.isoformat(),
            "pdf_url": pdf_url,
            "message": f"Application successfully certified and locked. Status: {updated_app['status']}. Certificate PDF will be generated and available at {pdf_url}",
            "note": "This application is now locked and cannot be edited. It has entered the final review queue."
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while certifying application: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for certify_application.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
