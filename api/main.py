import os
import sys
import json
import logging
import tempfile
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Fix import path for Vercel
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
try:
    from google import generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_CONFIGURED = True
    logger.info("Gemini API configured successfully")
except Exception as e:
    GEMINI_CONFIGURED = False
    logger.error(f"Failed to configure Gemini API: {e}")


def generate_quiz_logic(content: bytes, filename: str, question_count: int = 10, difficulty: str = "medium"):
    """Core quiz generation logic."""
    extracted_text = content.decode('utf-8', errors='ignore')

    if not extracted_text:
        raise ValueError("No text extracted from file.")

    max_chars = 5000
    if len(extracted_text) > max_chars:
        extracted_text = extracted_text[:max_chars] + "..."

    model = genai.GenerativeModel(model_name="gemini-flash-latest",
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

    quiz_data = json.loads(response.text)

    if not isinstance(quiz_data, list):
        raise ValueError("Response is not a JSON array")

    return {
        "success": True,
        "quiz": quiz_data,
        "metadata": {
            "file_name": filename,
            "file_size": len(content),
            "extracted_chars": len(extracted_text),
            "question_count": len(quiz_data),
            "difficulty": difficulty,
            "model_used": "gemini-2.0-flash"
        }
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/api/health", "/api/quiz/health"):
            self._json_response(200, {
                "status": "healthy",
                "gemini_configured": GEMINI_CONFIGURED,
                "version": "1.0.0"
            })
        else:
            self._json_response(404, {"detail": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/quiz/generate":
            self._handle_generate()
        elif path == "/api/quiz/test-gemini":
            self._handle_test_gemini()
        else:
            self._json_response(404, {"detail": "Not found"})

    def _handle_generate(self):
        try:
            if not GEMINI_CONFIGURED:
                self._json_response(500, {"detail": "Gemini API not configured"})
                return

            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            # Parse multipart form data
            if 'multipart/form-data' not in content_type:
                self._json_response(400, {"detail": "Expected multipart/form-data"})
                return

            # Extract boundary
            boundary = None
            for part in content_type.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary = part[9:].strip()
                    break

            if not boundary:
                self._json_response(400, {"detail": "No boundary in multipart data"})
                return

            # Parse multipart
            fields, files = self._parse_multipart(body, boundary.encode())

            if 'file' not in files:
                self._json_response(400, {"detail": "No file provided"})
                return

            file_content = files['file']['content']
            filename = files['file'].get('filename', 'upload.txt')
            question_count = int(fields.get('question_count', '10'))
            difficulty = fields.get('difficulty', 'medium')

            result = generate_quiz_logic(file_content, filename, question_count, difficulty)
            self._json_response(200, result)

        except Exception as e:
            logger.error(f"Generate failed: {e}")
            self._json_response(500, {"detail": str(e)})

    def _handle_test_gemini(self):
        try:
            if not GEMINI_CONFIGURED:
                self._json_response(500, {"detail": "Gemini API not configured"})
                return
            model = genai.GenerativeModel(model_name="gemini-2.0-flash")
            response = model.generate_content("Hello! Please respond with 'Gemini is working.'")
            self._json_response(200, {"success": True, "response": response.text})
        except Exception as e:
            self._json_response(500, {"detail": str(e)})

    def _parse_multipart(self, body: bytes, boundary: bytes):
        fields = {}
        files = {}
        delimiter = b'--' + boundary
        parts = body.split(delimiter)

        for part in parts[1:]:
            if part in (b'--\r\n', b'--', b'\r\n'):
                continue
            if part.startswith(b'--'):
                continue

            if b'\r\n\r\n' not in part:
                continue

            headers_raw, content = part.split(b'\r\n\r\n', 1)
            # Strip trailing \r\n
            if content.endswith(b'\r\n'):
                content = content[:-2]

            headers_str = headers_raw.decode('utf-8', errors='ignore')
            disposition = {}
            for line in headers_str.split('\r\n'):
                if 'Content-Disposition' in line:
                    for item in line.split(';'):
                        item = item.strip()
                        if '=' in item:
                            k, v = item.split('=', 1)
                            disposition[k.strip()] = v.strip().strip('"')

            name = disposition.get('name', '')
            filename = disposition.get('filename', '')

            if filename:
                files[name] = {'content': content, 'filename': filename}
            else:
                fields[name] = content.decode('utf-8', errors='ignore')

        return fields, files

    def _json_response(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")