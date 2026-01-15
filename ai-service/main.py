"""
AI Agent Service for AgFinOps Certification Platform
FastAPI service providing AI-powered chat and document processing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Import routers
from src.routers import chat, stream, sessions, health

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AgFinOps AI Service",
    description="AI-powered chat and document processing for agricultural finance certification",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend access
# In production, replace with specific origins
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)  # Health checks first for quick monitoring
app.include_router(chat.router)
app.include_router(stream.router)
app.include_router(sessions.router)


@app.get("/")
async def root():
    """Root endpoint - service information"""
    return {
        "service": "AgFinOps AI Service",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/health",
            "health_ready": "/api/health/ready",
            "health_live": "/api/health/live",
        }
    }


@app.get("/api/config")
async def get_config():
    """Get AI service configuration (non-sensitive info only)"""
    return {
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "cors_origins": ALLOWED_ORIGINS,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
