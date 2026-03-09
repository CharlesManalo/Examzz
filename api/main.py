from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app - REMOVE root_path
app = FastAPI(
    title="Examzz API",
    description="API for quiz generation and document processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
    # root_path="/api"  # REMOVED - Vercel handles this
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://examzz.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Rate limiting middleware
class SimpleRateLimitMiddleware:
    def __init__(self, app, calls: int = 10, period: int = 60):
        self.app = app
        self.calls = calls
        self.period = period
        self.clients = {}

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            client_ip = scope.get("client", ("unknown",))[0]
            import time

            now = time.time()
            if client_ip not in self.clients:
                self.clients[client_ip] = []

            self.clients[client_ip] = [
                timestamp for timestamp in self.clients[client_ip]
                if now - timestamp < self.period
            ]

            if len(self.clients[client_ip]) >= self.calls:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"}
                )
                await response(scope, receive, send)
                return

            self.clients[client_ip].append(now)

        await self.app(scope, receive, send)

rate_limit = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
rate_window = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
app.add_middleware(SimpleRateLimitMiddleware, calls=rate_limit, period=rate_window)

# Import and include routers
try:
    try:
        # Works when running from inside the `api/` directory (e.g. some serverless runtimes).
        from src.routers.quiz import router as quiz_router
    except ImportError:
        # Works when importing as a package from repo root (e.g. local tests).
        from api.src.routers.quiz import router as quiz_router

    # Register both route shapes to tolerate path prefix differences across
    # local/dev runtimes and Vercel rewrites.
    app.include_router(quiz_router, prefix="/quiz")
    app.include_router(quiz_router, prefix="/api/quiz")
    logger.info("Quiz router included successfully with /quiz and /api/quiz prefixes")
except ImportError as e:
    logger.error(f"Failed to import quiz router: {e}")

# Test endpoints for debugging (both route shapes)
@app.post("/quiz/test")
@app.post("/api/quiz/test")
async def test_quiz():
    return {"message": "Quiz route is working", "timestamp": "2025-03-09"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Examzz API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Health check endpoint - UPDATE PATH
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("DEBUG", "False"),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "rate_limit": {
            "calls": rate_limit,
            "period": rate_window
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Vercel handler - expose FastAPI app directly
handler = app

# Local dev runner
if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    logger.info(f"Starting Examzz API on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
