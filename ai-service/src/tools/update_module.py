"""
Update Module Tool

Allows Claude to update specific field values in a data module during the
certification application process. Tracks data provenance (proxy_entered, proxy_edited).

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "update_module",
    "description": """Update a specific field value in a data module.

This tool allows updating individual fields within the 5 certification modules:
- Module 1: Financial Information
- Module 2: Compliance Records
- Module 3: Operations Data
- Module 4: Sustainability Practices
- Module 5: Risk Management

Use this when:
- User provides information to fill in a specific field
- User corrects or updates an existing field value
- You need to manually enter data that wasn't OCR-extracted
- User says "update [field] to [value]" or "change [field]"

The tool will:
1. Validate the field exists in the specified module
2. Update the field value in the database
3. Track the data source as 'proxy_entered' (new) or 'proxy_edited' (update)
4. Record confidence score as 1.0 for human-verified data
5. Update the application's updated_at timestamp

Each module contains specific fields relevant to that certification area.
Fields are identified by their field_id (e.g., 'total_revenue', 'tax_year').

Important: This only updates the field value. It does NOT validate field requirements
or completeness. Use query_application to check overall module completion.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "string",
                "description": "UUID of the application containing the module. If not provided, uses the application_id from current session context."
            },
            "module_number": {
                "type": "integer",
                "description": "Module number to update (1-5). 1=Financial, 2=Compliance, 3=Operations, 4=Sustainability, 5=Risk",
                "minimum": 1,
                "maximum": 5
            },
            "field_id": {
                "type": "string",
                "description": "Unique identifier for the field to update (e.g., 'total_revenue', 'tax_year', 'business_license_number')"
            },
            "value": {
                "type": "string",
                "description": "The new value for the field. All values are stored as strings and converted as needed by the application."
            }
        },
        "required": ["module_number", "field_id", "value"]
    }
}

# Module name mapping
MODULE_NAMES = {
    1: "financial",
    2: "compliance",
    3: "operations",
    4: "sustainability",
    5: "risk"
}


async def update_module(
    module_number: int,
    field_id: str,
    value: str,
    application_id: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Update a specific field value in a data module.

    Args:
        module_number: Module number (1-5)
        field_id: Field identifier to update
        value: New value for the field
        application_id: UUID of the application (optional, uses session context if not provided)
        session_context: Current conversation session with user_id and application_id (optional)

    Returns:
        Dictionary containing:
        - success: Boolean indicating operation success
        - field_id: The field that was updated
        - module_name: Name of the module
        - module_number: Number of the module
        - old_value: Previous value (if field existed)
        - new_value: Updated value
        - data_source: Source of the data (proxy_entered or proxy_edited)
        - message: Confirmation message
        OR
        - error: Error code
        - message: Error description
    """
    # Validate module_number
    if module_number not in MODULE_NAMES:
        return {
            "error": "invalid_module",
            "message": f"Module number must be between 1 and 5. Got: {module_number}"
        }

    module_name = MODULE_NAMES[module_number]

    # Determine which application to update
    target_application_id = application_id
    if not target_application_id and session_context:
        target_application_id = session_context.get("application_id")

    if not target_application_id:
        return {
            "error": "application_id_required",
            "message": "No application_id provided and no application linked to current session. Please provide an application_id or link an application to this conversation."
        }

    try:
        db_client = await get_db_client()

        # Get user_id for authorization check
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

        # Authorization check - user can only update their own applications
        if user_id and str(app_row["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to update this application."
            }

        # Check if application is locked (status: approved or rejected)
        if app_row["status"] in ["approved", "rejected"]:
            return {
                "error": "application_locked",
                "message": f"Cannot update fields in a {app_row['status']} application. Application is locked."
            }

        # Check if field already exists for this module
        existing_query = """
            SELECT id, field_value
            FROM module_data
            WHERE application_id = $1
                AND module_name = $2
                AND field_name = $3
        """
        existing_row = await db_client.pool.fetchrow(
            existing_query,
            target_application_id,
            module_name,
            field_id
        )

        old_value = None
        data_source = "proxy_entered"  # Default for new fields

        if existing_row:
            # Field exists - update it
            old_value = existing_row["field_value"]
            data_source = "proxy_edited"

            update_query = """
                UPDATE module_data
                SET
                    field_value = $1,
                    data_source = $2,
                    confidence_score = 1.0,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING id
            """
            await db_client.pool.fetchrow(
                update_query,
                value,
                data_source,
                existing_row["id"]
            )
        else:
            # Field doesn't exist - create it
            insert_query = """
                INSERT INTO module_data (
                    application_id,
                    module_name,
                    field_name,
                    field_value,
                    data_source,
                    confidence_score,
                    created_at,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, 1.0, NOW(), NOW())
                RETURNING id
            """
            await db_client.pool.fetchrow(
                insert_query,
                target_application_id,
                module_name,
                field_id,
                value,
                data_source
            )

        # Update application's updated_at timestamp
        await db_client.pool.execute(
            "UPDATE applications SET updated_at = NOW() WHERE id = $1",
            target_application_id
        )

        return {
            "success": True,
            "field_id": field_id,
            "module_name": module_name,
            "module_number": module_number,
            "old_value": old_value,
            "new_value": value,
            "data_source": data_source,
            "message": f"Successfully {'updated' if old_value else 'created'} field '{field_id}' in {module_name} module (Module {module_number})."
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while updating module field: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for update_module.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
