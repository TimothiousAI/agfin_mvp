"""
Upload Document Tool

Allows Claude to request document uploads from users during conversations.
This tool doesn't handle the actual file upload (which happens via UI/API),
but triggers the upload interface and provides instructions.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from src.database.connection import get_db_client


# Valid document types for certification applications
DOCUMENT_TYPES = [
    "financial_statement",
    "tax_return",
    "bank_statement",
    "land_deed",
    "insurance_certificate",
    "business_license",
    "environmental_permit",
    "compliance_certificate",
    "other"
]


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "upload_document",
    "description": """Request a document upload from the user for their certification application.

This tool triggers the document upload interface in the UI and provides specific
instructions to the user about what document is needed. The actual file upload
happens through the UI, but this tool initiates the process and records the request.

Use this when:
- User mentions they have a document ready to upload
- You need a specific document to proceed with the application
- User asks "how do I upload documents?"
- Application requires additional documentation

Supported document types:
1. financial_statement - Annual or quarterly financial statements
2. tax_return - Federal or state tax returns
3. bank_statement - Recent bank statements (last 3-6 months)
4. land_deed - Property ownership documents or land deeds
5. insurance_certificate - Insurance policies and certificates
6. business_license - Business registration and licenses
7. environmental_permit - Environmental compliance permits
8. compliance_certificate - Other compliance or certification documents
9. other - Any other supporting documentation

The tool will:
- Validate the application exists and user has access
- Trigger the upload UI component
- Provide specific instructions for the document type
- Return upload status or instructions

The uploaded document will be processed with OCR and the extracted data will be
available for the AI to help populate application fields.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "document_type": {
                "type": "string",
                "description": f"Type of document being requested. Must be one of: {', '.join(DOCUMENT_TYPES)}. Choose the most specific type that matches the document.",
                "enum": DOCUMENT_TYPES
            },
            "application_id": {
                "type": "string",
                "description": "UUID of the application to attach the document to. If not provided, uses the application_id from the current session context."
            },
            "instructions": {
                "type": "string",
                "description": "Optional specific instructions for the user about what to include in the document or how to prepare it. Example: 'Please include all pages of your most recent tax return.'"
            }
        },
        "required": ["document_type"]
    }
}


async def upload_document(
    document_type: str,
    application_id: Optional[str] = None,
    instructions: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Request a document upload from the user.

    This tool doesn't perform the actual file upload, but triggers the upload UI
    and provides instructions to the user.

    Args:
        document_type: Type of document (must be one of DOCUMENT_TYPES)
        application_id: UUID of the application (optional if in session context)
        instructions: Optional specific instructions for the user
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - upload_requested: True
        - document_type: Type of document requested
        - application_id: Application the document will be attached to
        - instructions: Instructions for the user
        - ui_action: Action for the frontend to take
        - message: User-facing message
        OR
        - error: Error code
        - message: Error description
    """
    # Validate document type
    if document_type not in DOCUMENT_TYPES:
        return {
            "error": "invalid_document_type",
            "message": f"Document type must be one of: {', '.join(DOCUMENT_TYPES)}. Got: {document_type}"
        }

    # Determine application_id
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    if not target_application_id:
        return {
            "error": "application_id_required",
            "message": "No application_id provided and no application linked to current session. Please create an application first or provide an application_id."
        }

    # Get user_id for authorization
    user_id = session_context.get("user_id") if session_context else None

    try:
        db_client = await get_db_client()

        # Verify application exists and user has access
        app_query = """
            SELECT id, user_id, status, certification_type
            FROM applications
            WHERE id = $1
        """
        application = await db_client.pool.fetchrow(app_query, target_application_id)

        if not application:
            return {
                "error": "application_not_found",
                "message": f"Application {target_application_id} not found."
            }

        # Authorization check
        if user_id and str(application["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to upload documents to this application."
            }

        # Generate document-type-specific instructions
        default_instructions = {
            "financial_statement": "Please upload your most recent annual or quarterly financial statement. Include all pages showing assets, liabilities, income, and expenses.",
            "tax_return": "Please upload your complete federal tax return from the most recent year. Include all schedules and supporting documents.",
            "bank_statement": "Please upload bank statements from the last 3-6 months. Include all pages showing transactions and account balances.",
            "land_deed": "Please upload property deeds or ownership documents for all land included in this application.",
            "insurance_certificate": "Please upload current insurance certificates showing adequate coverage for your operations.",
            "business_license": "Please upload your current business registration, license, or incorporation documents.",
            "environmental_permit": "Please upload any required environmental permits, compliance certificates, or inspection reports.",
            "compliance_certificate": "Please upload relevant compliance certificates, audit reports, or certification documents.",
            "other": "Please upload the requested document. Ensure all pages are clear and readable."
        }

        upload_instructions = instructions or default_instructions.get(document_type, "Please upload the requested document.")

        # Format document type for display
        display_type = document_type.replace("_", " ").title()

        return {
            "upload_requested": True,
            "document_type": document_type,
            "application_id": str(application["id"]),
            "instructions": upload_instructions,
            "ui_action": "trigger_upload_zone",
            "ui_params": {
                "document_type": document_type,
                "application_id": str(application["id"]),
                "accept": ".pdf,.jpg,.jpeg,.png,.doc,.docx"  # Accepted file types
            },
            "message": f"Please upload your {display_type}. {upload_instructions}"
        }

    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Error processing upload request: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for upload_document.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
