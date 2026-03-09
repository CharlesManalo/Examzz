from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import generativeai as genai
from mangum import Mangum
import os
import json
import logging
import tempfile

# 1. Setup & Config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Note: No root_path here because vercel.json handles the /api prefix
app = FastAPI(title="Examzz API")

# 2. CORS Fix
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://examzz.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 3. Routes
@app.get("/api/health") # Explicit path for testing
async def health():
    return {"status": "healthy", "model": "gemini-1.5-flash"}

@app.post("/api/quiz/generate") # Explicit path to match your frontend call
async def generate_quiz(file: UploadFile = File(...)):
    try:
        # For testing, we'll read the first 2000 characters of text
        content = await file.read()
        text_context = content.decode('utf-8', errors='ignore')[:2000]

        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Generate a 5-question multiple choice quiz in JSON format from this text: {text_context}"
        
        response = model.generate_content(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        return {"success": True, "quiz": json.loads(response.text)}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. Vercel Handler
handler = Mangum(app)
