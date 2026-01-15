"""
Create Application Tool

Allows Claude to create new certification applications on behalf of users
during conversations.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any
import re
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "create_application",
    "description": """Create a new agricultural finance certification application.

This tool initiates a new certification application for a farmer or agricultural business.
It creates the application record in the system and links it to the current user or
creates a placeholder for the specified farmer.

Use this when the user:
- Wants to "start a new application"
- Says "I'd like to apply for certification"
- Asks "how do I create an application?"
- Wants to help a farmer create an application

The tool validates all inputs and returns the new application ID that can be used
in subsequent conversations to track and update the application.

Required information:
- User context (user_id from session) OR farmer contact information
- Certification type is optional and defaults to 'standard'

The created application starts in 'draft' status and can be updated with documents
and module data through other tools.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "farmer_name": {
                "type": "string",
                "description": "Full name of the farmer or agricultural business owner. Optional if creating for current logged-in user. Example: 'John Smith' or 'Smith Family Farms LLC'"
            },
            "farmer_email": {
                "type": "string",
                "description": "Email address for the farmer. Must be valid email format. Optional if creating for current user. Example: 'john.smith@example.com'"
            },
            "farmer_phone": {
                "type": "string",
                "description": "Phone number for the farmer. Optional. Can be any format (will be stored as provided). Example: '+1-555-123-4567' or '555-123-4567'"
            },
            "certification_type": {
                "type": "string",
                "description": "Type of certification being applied for. Optional, defaults to 'standard'. Valid values: 'standard', 'organic', 'sustainable', 'gmp' (Good Manufacturing Practice)."
            },
            "notes": {
                "type": "string",
                "description": "Optional notes about the application. Can include initial context, special requirements, or other relevant information."
            }
        },
        "required": []  # All fields optional - will use session context if available
    }
}


def validate_email(email: str) -> bool:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


async def create_application(
    farmer_name: Optional[str] = None,
    farmer_email: Optional[str] = None,
    farmer_phone: Optional[str] = None,
    certification_type: str = "standard",
    notes: Optional[str] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new certification application in the database.

    Args:
        farmer_name: Full name of the farmer (optional if using session user_id)
        farmer_email: Email address (optional if using session user_id)
        farmer_phone: Phone number (optional)
        certification_type: Type of certification (default: 'standard')
        notes: Additional notes about the application (optional)
        session_context: Current conversation session with user_id (optional)

    Returns:
        Dictionary containing:
        - application_id: UUID of the created application
        - status: Initial status ('draft')
        - certification_type: Type of certification
        - created_at: Timestamp of creation
        - message: Success message
        OR
        - error: Error code
        - message: Error description
    """
    # Validate certification type
    valid_cert_types = ["standard", "organic", "sustainable", "gmp"]
    if certification_type not in valid_cert_types:
        return {
            "error": "invalid_certification_type",
            "message": f"Certification type must be one of: {', '.join(valid_cert_types)}. Got: {certification_type}"
        }

    # Determine user_id (from session or need to create/find user)
    user_id = session_context.get("user_id") if session_context else None

    # If no user_id from session, we need farmer contact info to create/find user
    if not user_id:
        if not farmer_email:
            return {
                "error": "missing_required_fields",
                "message": "Either user must be logged in (user_id in session) or farmer_email must be provided to create application."
            }

        # Validate email format
        if not validate_email(farmer_email):
            return {
                "error": "invalid_email",
                "message": f"Invalid email format: {farmer_email}. Please provide a valid email address."
            }

        if not farmer_name:
            return {
                "error": "missing_required_fields",
                "message": "farmer_name is required when creating application without logged-in user."
            }

    # Validate email if provided (even with user_id, might be updating contact info)
    if farmer_email and not validate_email(farmer_email):
        return {
            "error": "invalid_email",
            "message": f"Invalid email format: {farmer_email}. Please provide a valid email address."
        }

    try:
        db_client = await get_db_client()

        # If no user_id, try to find or create user based on email
        if not user_id:
            # Check if user exists with this email
            existing_user = await db_client.pool.fetchrow(
                "SELECT id FROM auth.users WHERE email = $1",
                farmer_email
            )

            if existing_user:
                user_id = str(existing_user["id"])
            else:
                # Create new user (simplified - in production would use Supabase auth)
                # Note: This assumes a users table exists or uses auth.users
                # For now, we'll just generate a UUID and assume user management is handled elsewhere
                return {
                    "error": "user_not_found",
                    "message": f"No user found with email {farmer_email}. User must be created first through the authentication system."
                }

        # Create the application
        insert_query = """
            INSERT INTO applications (
                user_id,
                status,
                certification_type,
                notes
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id, status, certification_type, created_at, updated_at
        """

        application = await db_client.pool.fetchrow(
            insert_query,
            user_id,
            "draft",  # Initial status
            certification_type,
            notes
        )

        return {
            "application_id": str(application["id"]),
            "status": application["status"],
            "certification_type": application["certification_type"],
            "created_at": application["created_at"].isoformat(),
            "updated_at": application["updated_at"].isoformat(),
            "message": f"Successfully created {certification_type} certification application. Application ID: {application['id']}"
        }

    except asyncpg.UniqueViolationError as e:
        return {
            "error": "duplicate_application",
            "message": f"User already has an active application. Please complete or cancel the existing application first."
        }
    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while creating application: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for create_application.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
