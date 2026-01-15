"""
Extract Fields Tool

Allows Claude to trigger OCR/document processing and extract structured data
from uploaded documents using the Docling service.

Follows Anthropic's Tool Use guidelines for clear descriptions and parameter handling.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncpg
from src.database.connection import get_db_client


# Tool definition for Anthropic Claude API
TOOL_DEFINITION = {
    "name": "extract_fields",
    "description": """Extract structured data fields from an uploaded document using OCR.

This tool triggers document processing through the Docling OCR service to extract
text, tables, and structured data from PDF, image, or document files. The extracted
data is analyzed and returned with confidence scores for each field.

Use this when:
- A document has been uploaded and needs processing
- User asks "can you read this document?"
- You need to extract specific data (amounts, dates, names, etc.)
- User wants to auto-fill application fields from a document

The tool will:
1. Check if the document exists and user has access
2. Trigger Docling OCR processing if not already done
3. Wait for processing to complete (async)
4. Extract and return structured fields with confidence scores
5. Update the document's extraction metadata in the database

Extracted fields may include:
- Financial data (revenue, expenses, assets, liabilities)
- Personal information (names, addresses, phone numbers)
- Dates (tax year, statement period, etc.)
- Business information (company name, EIN, license numbers)
- Tables and structured data

Each field includes a confidence score (0.0-1.0) indicating the OCR accuracy.
Fields with confidence < 0.7 should be verified by the user.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "document_id": {
                "type": "string",
                "description": "UUID of the document to process. This is returned when a document is uploaded via the upload_document tool or can be retrieved from the application's document list."
            },
            "field_hints": {
                "type": "array",
                "description": "Optional list of specific field names to look for in the document. Helps improve extraction accuracy. Example: ['total_revenue', 'tax_year', 'business_name']. If not provided, all detectable fields will be extracted.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": ["document_id"]
    }
}


async def extract_fields(
    document_id: str,
    field_hints: Optional[List[str]] = None,
    session_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Extract structured data fields from a document using OCR.

    This is a simplified implementation that checks document status.
    In production, this would integrate with the Docling OCR service.

    Args:
        document_id: UUID of the document to process
        field_hints: Optional list of field names to prioritize during extraction
        session_context: Current conversation session with user_id (optional)

    Returns:
        Dictionary containing:
        - document_id: ID of the processed document
        - ocr_status: Current OCR processing status
        - extracted_fields: List of extracted fields with values and confidence
        - processing_time: Time taken to process (seconds)
        - metadata: Additional extraction metadata
        OR
        - error: Error code
        - message: Error description
    """
    try:
        db_client = await get_db_client()

        # Get document and verify access
        doc_query = """
            SELECT
                d.id,
                d.application_id,
                d.file_name,
                d.file_size,
                d.mime_type,
                d.storage_path,
                d.ocr_status,
                d.extraction_metadata,
                a.user_id
            FROM documents d
            JOIN applications a ON a.id = d.application_id
            WHERE d.id = $1
        """
        document = await db_client.pool.fetchrow(doc_query, document_id)

        if not document:
            return {
                "error": "document_not_found",
                "message": f"Document {document_id} not found."
            }

        # Authorization check
        user_id = session_context.get("user_id") if session_context else None
        if user_id and str(document["user_id"]) != user_id:
            return {
                "error": "unauthorized",
                "message": "You do not have permission to access this document."
            }

        # Check current OCR status
        ocr_status = document["ocr_status"]
        extraction_metadata = document["extraction_metadata"]

        # If already processed, return cached results
        if ocr_status == "completed" and extraction_metadata:
            return {
                "document_id": str(document["id"]),
                "file_name": document["file_name"],
                "ocr_status": "completed",
                "extracted_fields": extraction_metadata.get("fields", []),
                "processing_time": extraction_metadata.get("processing_time", 0),
                "metadata": {
                    "page_count": extraction_metadata.get("page_count", 1),
                    "extraction_date": extraction_metadata.get("extraction_date"),
                    "confidence_avg": extraction_metadata.get("confidence_avg", 0.0)
                },
                "message": "Document already processed. Returning cached extraction results."
            }

        # If processing, return status
        if ocr_status == "processing":
            return {
                "document_id": str(document["id"]),
                "file_name": document["file_name"],
                "ocr_status": "processing",
                "message": "Document is currently being processed. Please check back in a few moments.",
                "estimated_time": "30-60 seconds"
            }

        # If failed, return error
        if ocr_status == "failed":
            error_message = extraction_metadata.get("error") if extraction_metadata else "Unknown error"
            return {
                "error": "ocr_failed",
                "message": f"OCR processing failed for this document: {error_message}",
                "document_id": str(document["id"]),
                "file_name": document["file_name"]
            }

        # If pending or not started, trigger OCR processing
        if ocr_status in ["pending", None]:
            # Update status to processing
            await db_client.pool.execute(
                "UPDATE documents SET ocr_status = 'processing' WHERE id = $1",
                document_id
            )

            # In production, this would trigger async Docling job
            # For now, return a processing status
            return {
                "document_id": str(document["id"]),
                "file_name": document["file_name"],
                "ocr_status": "processing",
                "message": "Document processing has been initiated. This typically takes 30-60 seconds.",
                "action_required": "poll_for_completion",
                "estimated_time": "30-60 seconds",
                "field_hints": field_hints or [],
                "note": "In production, this would integrate with Docling OCR service. For now, this is a stub implementation."
            }

        return {
            "error": "unknown_status",
            "message": f"Document has unknown OCR status: {ocr_status}"
        }

    except asyncpg.PostgresError as e:
        return {
            "error": "database_error",
            "message": f"Database error while accessing document: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "internal_error",
            "message": f"Unexpected error: {str(e)}"
        }


def get_tool_definition() -> Dict[str, Any]:
    """
    Get the Anthropic tool definition for extract_fields.

    Returns:
        Tool definition dictionary for use in Claude API calls
    """
    return TOOL_DEFINITION
