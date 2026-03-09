from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from dotenv import load_dotenv
from google import generativeai as genai
import tempfile
import json

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

# Configure Gemini
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_CONFIGURED = True
    logger.info("Gemini API configured successfully")
except Exception as e:
    GEMINI_CONFIGURED = False
    logger.error(f"Failed to configure Gemini API: {e}")

# Quiz endpoints
@app.post("/api/quiz/generate")
async def generate_quiz(
    file: UploadFile = File(...),
    question_count: int = 10,
    difficulty: str = "medium"
):
    """
    Upload a file, extract text, generate quiz via Gemini, return JSON.
    Full path on Vercel: POST /api/quiz/generate
    """
    try:
        if not GEMINI_CONFIGURED:
            raise HTTPException(
                status_code=500,
                detail="Gemini API not configured. Please check API key."
            )

        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        if not 1 <= question_count <= 50:
            raise HTTPException(
                status_code=400,
                detail="Question count must be between 1 and 50"
            )

        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=400,
                detail="Difficulty must be one of: easy, medium, hard"
            )

        logger.info(f"Processing file: {file.filename}, questions: {question_count}")

        # Read file content directly (simplified approach)
        content = await file.read()
        extracted_text = content.decode('utf-8', errors='ignore')
        
        # Trigger redeploy for Vercel
        if not extracted_text:
            raise ValueError("No text extracted from file.")

        logger.info(f"Extracted {len(extracted_text)} characters from file")

        max_chars = 5000
        if len(extracted_text) > max_chars:
            extracted_text = extracted_text[:max_chars] + "..."
            logger.info(f"Text truncated to {max_chars} characters")

        logger.info("Generating quiz with Gemini...")
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.7,
                "max_output_tokens": 2048,
            }
        )

        difficulty_prompts = {
            "easy": "simple, straightforward questions that test basic understanding",
            "medium": "moderately challenging questions that require some thinking",
            "hard": "complex questions that require deep understanding and analysis"
        }

        prompt = f"""
        Act as a professional educator. Based on the following lesson text, generate a {question_count}-question multiple choice quiz.

        Requirements:
        - Create {difficulty_prompts.get(difficulty, "moderately challenging")} questions
        - Each question must have exactly 4 options (A, B, C, D)
        - Only one option should be correct
        - Questions should cover different aspects of the text
        - Avoid true/false questions
        - Make questions clear and unambiguous

        Return the output strictly as a JSON array with this exact structure:
        [
            {{
                "question": "The question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer_index": 0,
                "explanation": "Brief explanation of why this answer is correct"
            }}
        ]

        Do not include any text outside the JSON array. The response must be valid JSON.

        Lesson text:
        {extracted_text}
        """

        response = model.generate_content(prompt)

        if not response.text:
            raise ValueError("Empty response from Gemini.")

        logger.info(f"Received response from Gemini: {len(response.text)} characters")

        try:
            quiz_data = json.loads(response.text)

            if not isinstance(quiz_data, list):
                raise ValueError("Response is not a JSON array")

            for i, question in enumerate(quiz_data):
                if not isinstance(question, dict):
                    raise ValueError(f"Question {i} is not an object")

                required_keys = ["question", "options", "answer_index", "explanation"]
                for key in required_keys:
                    if key not in question:
                        raise ValueError(f"Question {i} missing required key: {key}")

                if not isinstance(question["options"], list) or len(question["options"]) != 4:
                    raise ValueError(f"Question {i} must have exactly 4 options")

                if not isinstance(question["answer_index"], int) or not 0 <= question["answer_index"] <= 3:
                    raise ValueError(f"Question {i} has invalid answer_index")

            logger.info(f"Successfully validated {len(quiz_data)} questions")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            raise ValueError("Invalid JSON response from Gemini")

        result = {
            "success": True,
            "quiz": quiz_data,
            "metadata": {
                "file_name": file.filename,
                "file_size": len(content),
                "extracted_chars": len(extracted_text),
                "question_count": len(quiz_data),
                "difficulty": difficulty,
                "model_used": "gemini-1.5-flash"
            }
        }

        logger.info("Quiz generation completed successfully")
        return result

    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.get("/api/quiz/health")
async def quiz_health_check():
    return {
        "status": "healthy",
        "gemini_configured": GEMINI_CONFIGURED,
        "version": "1.0.0"
    }

@app.post("/api/quiz/test-gemini")
async def test_gemini():
    if not GEMINI_CONFIGURED:
        raise HTTPException(status_code=500, detail="Gemini API not configured")

    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content("Hello! Please respond with 'Gemini is working.'")

        return {
            "success": True,
            "response": response.text,
            "status": "Gemini API is working correctly"
        }

    except Exception as e:
        logger.error(f"Gemini test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API test failed: {str(e)}")

# Simple health endpoint for testing
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("DEBUG", "False"),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Examzz API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
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
