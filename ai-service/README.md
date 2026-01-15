# AgFinOps AI Service

FastAPI-based AI agent service for the AgFinOps Certification Platform.

## Features

- FastAPI with automatic OpenAPI documentation
- CORS configured for frontend integration
- Health check endpoints for monitoring
- Support for Anthropic Claude and OpenAI GPT models
- Environment-based configuration

## Setup

### Install Dependencies

```bash
pip install -r requirements.txt
```

Or with pyproject.toml:

```bash
pip install -e .
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `OPENAI_API_KEY`: Your OpenAI API key

### Run the Service

Development mode (with auto-reload):

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

- `GET /` - Service information
- `GET /health` - Health check
- `GET /api/config` - Service configuration (non-sensitive)

## Architecture

```
ai-service/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── pyproject.toml      # Project configuration
├── .env                # Environment variables (gitignored)
└── README.md           # This file
```

## Integration

The service runs on port 8000 by default and is CORS-configured to accept requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (Alternative frontend)

Configure additional origins in `.env` with `CORS_ORIGINS`.
