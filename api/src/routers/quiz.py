from fastapi import APIRouter, HTTPException, UploadFile, File
from google import generativeai as genai
import os
import tempfile
import json
import logging
from typing import Dict, Any
import sys

# Add the parent directory to Python path to import our utility
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from utils.extract_text import extract_text_from_file, validate_file_before_extraction

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["quiz"])

# Configure Gemini API
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_CONFIGURED = True
    logger.info("Gemini API configured successfully")
except Exception as e:
    GEMINI_CONFIGURED = False
    logger.error(f"Failed to configure Gemini API: {e}")

@router.post("/generate")
async def generate_quiz(
    file: UploadFile = File(...),
    question_count: int = 10,
    difficulty: str = "medium"
):
    """
    Endpoint to upload a file, extract text, generate quiz via Gemini, and return JSON.
    
    Args:
        file: Uploaded lesson file
        question_count: Number of questions to generate (default: 10)
        difficulty: Quiz difficulty level (easy, medium, hard)
    
    Returns:
        JSON with generated quiz questions and metadata
    """
    try:
        if not GEMINI_CONFIGURED:
            raise HTTPException(
                status_code=500, 
                detail="Gemini API not configured. Please check API key."
            )
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate question count
        if not 1 <= question_count <= 50:
            raise HTTPException(
                status_code=400, 
                detail="Question count must be between 1 and 50"
            )
        
        # Validate difficulty
        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=400, 
                detail="Difficulty must be one of: easy, medium, hard"
            )
        
        logger.info(f"Processing file: {file.filename}, questions: {question_count}")
        
        # Save uploaded file temporarily
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_path = temp_file.name
            
            # Phase 1: Extract text using our utility
            logger.info("Extracting text from file...")
            validate_file_before_extraction(temp_path)
            extracted_text = extract_text_from_file(temp_path)
            
            if not extracted_text:
                raise ValueError("No text extracted from file.")
            
            logger.info(f"Extracted {len(extracted_text)} characters from file")
            
            # Truncate text if too long (for cost management)
            max_chars = 5000
            if len(extracted_text) > max_chars:
                extracted_text = extracted_text[:max_chars] + "..."
                logger.info(f"Text truncated to {max_chars} characters")
            
            # Phase 2: Generate quiz using Gemini
            logger.info("Generating quiz with Gemini...")
            model = genai.GenerativeModel(
                model_name="gemini-flash-latest",
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.7,
                    "max_output_tokens": 2048,
                }
            )
            
            # Create prompt based on difficulty
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
            
            # Generate content
            response = model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("Empty response from Gemini.")
            
            logger.info(f"Received response from Gemini: {len(response.text)} characters")
            
            # Parse JSON response
            try:
                quiz_data = json.loads(response.text)
                
                # Validate structure
                if not isinstance(quiz_data, list):
                    raise ValueError("Response is not a JSON array")
                
                # Validate each question
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
                logger.error(f"Response text: {response.text}")
                raise ValueError("Invalid JSON response from Gemini")
            
            # Prepare response
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
            
            # TODO: Phase 3 - Save to Supabase here
            logger.info("Quiz generation completed successfully")
            return result
            
        finally:
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
                logger.info("Temporary file cleaned up")
    
    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        logger.error(f"Traceback: {logging.traceback.format_exc() if hasattr(logging, 'traceback') else 'N/A'}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the quiz service"""
    return {
        "status": "healthy",
        "gemini_configured": GEMINI_CONFIGURED,
        "version": "1.0.0"
    }

@router.post("/test-gemini")
async def test_gemini():
    """Test endpoint to verify Gemini API connectivity"""
    if not GEMINI_CONFIGURED:
        raise HTTPException(
            status_code=500, 
            detail="Gemini API not configured"
        )
    
    try:
        model = genai.GenerativeModel(model_name="gemini-flash-latest")
        response = model.generate_content("Hello! Please respond with 'Gemini is working.'")
        
        return {
            "success": True,
            "response": response.text,
            "status": "Gemini API is working correctly"
        }
    
    except Exception as e:
        logger.error(f"Gemini test failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Gemini API test failed: {str(e)}"
        )
