"""
Health check endpoint for AI service.

Provides comprehensive health checks for all service dependencies:
- Anthropic API connectivity
- Supabase/PostgreSQL connection
- mem0/pgvector configuration
- Environment variables validation
"""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from typing import Dict, Any
import os
import asyncio
from datetime import datetime

# Import service clients
from src.database.connection import DatabaseClient
from src.claude.client import ClaudeClient
from src.memory.mem0_client import Mem0Client

router = APIRouter(prefix="/api", tags=["health"])


async def check_anthropic_api() -> Dict[str, Any]:
    """
    Check Anthropic API connectivity.

    Returns:
        Status dictionary with API key validation and connectivity check
    """
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")

        if not api_key:
            return {
                "status": "error",
                "configured": False,
                "message": "ANTHROPIC_API_KEY not set"
            }

        # Check API key format (should start with 'sk-ant-')
        if not api_key.startswith("sk-ant-"):
            return {
                "status": "warning",
                "configured": True,
                "message": "API key format unexpected (should start with 'sk-ant-')"
            }

        # Try to initialize client (validates key format)
        try:
            client = ClaudeClient(api_key=api_key)
            return {
                "status": "ok",
                "configured": True,
                "model": client.model,
                "message": "Anthropic API configured"
            }
        except Exception as e:
            return {
                "status": "error",
                "configured": True,
                "message": f"Client initialization failed: {str(e)}"
            }

    except Exception as e:
        return {
            "status": "error",
            "configured": False,
            "message": f"Health check failed: {str(e)}"
        }


async def check_database() -> Dict[str, Any]:
    """
    Check Supabase/PostgreSQL database connectivity.

    Returns:
        Status dictionary with connection test results
    """
    try:
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            return {
                "status": "error",
                "configured": False,
                "message": "DATABASE_URL not set"
            }

        # Try to connect and run a simple query
        db_client = DatabaseClient(database_url=database_url)

        try:
            await db_client.connect()

            # Test query - check if bot tables exist
            if db_client.pool:
                result = await db_client.pool.fetchval(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'agfin_ai_bot_sessions'"
                )

                if result == 0:
                    return {
                        "status": "warning",
                        "configured": True,
                        "connected": True,
                        "message": "Database connected but bot tables not found (migrations may not be run)"
                    }

                return {
                    "status": "ok",
                    "configured": True,
                    "connected": True,
                    "message": "Database connected and tables verified"
                }
            else:
                return {
                    "status": "error",
                    "configured": True,
                    "connected": False,
                    "message": "Connection pool not initialized"
                }

        finally:
            await db_client.close()

    except Exception as e:
        return {
            "status": "error",
            "configured": bool(os.getenv("DATABASE_URL")),
            "connected": False,
            "message": f"Database connection failed: {str(e)}"
        }


async def check_memory() -> Dict[str, Any]:
    """
    Check mem0/pgvector memory system configuration.

    Returns:
        Status dictionary with memory system configuration check
    """
    try:
        # Check required environment variables for mem0
        openai_key = os.getenv("OPENAI_API_KEY")
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        missing_vars = []
        if not openai_key:
            missing_vars.append("OPENAI_API_KEY")
        if not supabase_url:
            missing_vars.append("SUPABASE_URL")
        if not supabase_key:
            missing_vars.append("SUPABASE_KEY")

        if missing_vars:
            return {
                "status": "error",
                "configured": False,
                "message": f"Missing environment variables: {', '.join(missing_vars)}"
            }

        # Check pgvector connection variables
        pgvector_config = {
            "host": os.getenv("PGVECTOR_HOST", "host.docker.internal"),
            "port": os.getenv("PGVECTOR_PORT", "5433"),
            "user": os.getenv("PGVECTOR_USER", "postgres"),
            "database": os.getenv("PGVECTOR_DATABASE", "postgres"),
        }

        # Try to initialize mem0 client
        try:
            mem0_client = Mem0Client()
            return {
                "status": "ok",
                "configured": True,
                "embedding_model": mem0_client.embedding_config["model"],
                "embedding_dimensions": mem0_client.embedding_config["dimensions"],
                "pgvector_host": pgvector_config["host"],
                "pgvector_port": pgvector_config["port"],
                "message": "Memory system configured (stub implementation - requires Python 3.9+ for full functionality)"
            }
        except Exception as e:
            return {
                "status": "error",
                "configured": True,
                "message": f"Mem0 client initialization failed: {str(e)}"
            }

    except Exception as e:
        return {
            "status": "error",
            "configured": False,
            "message": f"Memory check failed: {str(e)}"
        }


async def check_environment() -> Dict[str, Any]:
    """
    Check required environment variables.

    Returns:
        Status dictionary with environment configuration
    """
    required_vars = [
        "ANTHROPIC_API_KEY",
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_KEY"
    ]

    optional_vars = [
        "AI_SERVICE_PORT",
        "CORS_ORIGINS",
        "PGVECTOR_HOST",
        "PGVECTOR_PORT"
    ]

    configured = {}
    missing = []

    for var in required_vars:
        value = os.getenv(var)
        if value:
            configured[var] = True
        else:
            configured[var] = False
            missing.append(var)

    for var in optional_vars:
        configured[var] = bool(os.getenv(var))

    if missing:
        return {
            "status": "error",
            "configured": configured,
            "missing": missing,
            "message": f"Missing required environment variables: {', '.join(missing)}"
        }

    return {
        "status": "ok",
        "configured": configured,
        "message": "All required environment variables set"
    }


@router.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.

    Checks all service dependencies:
    - Anthropic API connectivity
    - Database connection
    - Memory system (mem0/pgvector)
    - Environment configuration

    Returns:
        Detailed health status for all dependencies
    """
    # Run all health checks concurrently
    anthropic_check, db_check, memory_check, env_check = await asyncio.gather(
        check_anthropic_api(),
        check_database(),
        check_memory(),
        check_environment(),
        return_exceptions=True
    )

    # Handle any exceptions from health checks
    def safe_result(check_result, name: str) -> Dict[str, Any]:
        if isinstance(check_result, Exception):
            return {
                "status": "error",
                "configured": False,
                "message": f"{name} health check threw exception: {str(check_result)}"
            }
        return check_result

    anthropic_status = safe_result(anthropic_check, "Anthropic")
    db_status = safe_result(db_check, "Database")
    memory_status = safe_result(memory_check, "Memory")
    env_status = safe_result(env_check, "Environment")

    # Determine overall service health
    all_statuses = [
        anthropic_status["status"],
        db_status["status"],
        memory_status["status"],
        env_status["status"]
    ]

    # Overall status: ok if all ok, error if any error, warning if any warning
    if "error" in all_statuses:
        overall_status = "error"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE
    elif "warning" in all_statuses:
        overall_status = "warning"
        http_status = status.HTTP_200_OK
    else:
        overall_status = "healthy"
        http_status = status.HTTP_200_OK

    response_data = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
        "version": "0.1.0",
        "checks": {
            "anthropic": anthropic_status,
            "database": db_status,
            "memory": memory_status,
            "environment": env_status
        }
    }

    return JSONResponse(
        status_code=http_status,
        content=response_data
    )


@router.get("/health/ready")
async def readiness_check():
    """
    Kubernetes-style readiness probe.

    Returns 200 if service is ready to accept traffic (all critical dependencies OK).
    Returns 503 if service is not ready.
    """
    # Check critical dependencies only (Anthropic + Database)
    anthropic_check, db_check = await asyncio.gather(
        check_anthropic_api(),
        check_database(),
        return_exceptions=True
    )

    def is_ok(result) -> bool:
        if isinstance(result, Exception):
            return False
        return result.get("status") == "ok"

    if is_ok(anthropic_check) and is_ok(db_check):
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ready",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "anthropic_ok": is_ok(anthropic_check),
                "database_ok": is_ok(db_check)
            }
        )


@router.get("/health/live")
async def liveness_check():
    """
    Kubernetes-style liveness probe.

    Returns 200 if service process is running.
    This is a simple check that doesn't test external dependencies.
    """
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "alive",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "ai-service"
        }
    )
