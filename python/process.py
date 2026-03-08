from http.server import BaseHTTPRequestHandler
import json
import io
import re
import random
import traceback

# Document parsing
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    from pptx import Presentation
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


# ── Text extraction ──────────────────────────────────────────────────────────

def extract_pdf(data: bytes) -> str:
    if not HAS_PYMUPDF:
        raise RuntimeError("PyMuPDF not installed")
    doc = fitz.open(stream=data, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text())
    return "\n".join(pages)


def extract_docx(data: bytes) -> str:
    if not HAS_DOCX:
        raise RuntimeError("python-docx not installed")
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_pptx(data: bytes) -> str:
    if not HAS_PPTX:
        raise RuntimeError("python-pptx not installed")
    prs = Presentation(io.BytesIO(data))
    lines = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                lines.append(shape.text.strip())
    return "\n".join(lines)


def extract_xlsx(data: bytes) -> str:
    if not HAS_OPENPYXL:
        raise RuntimeError("openpyxl not installed")
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
    lines = []
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            row_text = " ".join(str(c) for c in row if c is not None)
            if row_text.strip():
                lines.append(row_text.strip())
    return "\n".join(lines)


def extract_text(filename: str, data: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return extract_pdf(data)
    elif ext in ("docx", "doc"):
        return extract_docx(data)
    elif ext in ("pptx", "ppt"):
        return extract_pptx(data)
    elif ext in ("xlsx", "xls"):
        return extract_xlsx(data)
    elif ext == "txt":
        return data.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {ext}")


# ── Content analysis ─────────────────────────────────────────────────────────

def extract_sentences(text: str) -> list[str]:
    sentences = []
    for line in text.split("\n"):
        line = line.strip()
        if not line or len(line) < 20:
            continue
        if len(line) <= 500:
            sentences.append(line)
        else:
            # Split long lines on sentence boundaries
            start = 0
            for i, ch in enumerate(line):
                if ch in ".!?" and i - start > 20:
                    chunk = line[start:i + 1].strip()
                    if 20 < len(chunk) <= 500:
                        sentences.append(chunk)
                    start = i + 1
            remainder = line[start:].strip()
            if len(remainder) > 20:
                sentences.append(remainder[:500])
    return list(dict.fromkeys(sentences))  # deduplicate, preserve order


def extract_keywords(text: str, headings: list[str]) -> list[str]:
    keywords = set()

    # Words from headings
    for h in headings:
        for w in h.split():
            if len(w) > 3:
                keywords.add(w.lower())

    # Frequent capitalised words (proper nouns / terms)
    word_freq: dict[str, int] = {}
    for w in re.findall(r'\b[A-Z][a-z]{3,}\b', text):
        word_freq[w.lower()] = word_freq.get(w.lower(), 0) + 1

    for word, count in word_freq.items():
        if count > 1:
            keywords.add(word)

    return list(keywords)[:50]


def extract_headings(text: str) -> list[str]:
    headings = []
    for line in text.split("\n"):
        t = line.strip()
        if not t or len(t) < 5 or len(t) > 100:
            continue
        if t == t.upper() or (t[0] == t[0].upper() and not t[-1] in ".!?"):
            headings.append(t)
    return list(dict.fromkeys(headings))[:20]


def analyze_content(text: str) -> dict:
    sentences = extract_sentences(text)
    headings = extract_headings(text)
    keywords = extract_keywords(text, headings)
    return {
        "text": text,
        "sentences": sentences,
        "headings": headings,
        "keywords": keywords,
    }


# ── Quiz generation ──────────────────────────────────────────────────────────

COMMON_WORDS = {
    "this", "that", "these", "those", "there", "their", "they", "what",
    "when", "where", "which", "while", "with", "within", "about", "above",
    "after", "again", "against", "have", "been", "being", "below", "between",
    "both", "from", "further", "into", "just", "more", "most", "only",
    "other", "over", "same", "should", "some", "such", "than", "then",
    "under", "until", "very", "were", "will", "would", "your",
}


def is_common(word: str) -> bool:
    return word.lower() in COMMON_WORDS


def shuffle(lst: list) -> list:
    out = lst[:]
    random.shuffle(out)
    return out


def make_definition_questions(content: dict) -> list[dict]:
    questions = []
    patterns = [
        r'(\w+)\s+is\s+(?:defined\s+as\s+)?(?:the\s+)?process\s+of\s+([^,.]+)',
        r'(\w+)\s+is\s+(?:defined\s+as\s+)?(?:a\s+)?([^,.]+)',
        r'(\w+)\s+refers\s+to\s+([^,.]+)',
        r'(\w+)\s+means\s+([^,.]+)',
    ]
    for sentence in content["sentences"]:
        for pat in patterns:
            m = re.match(pat, sentence, re.IGNORECASE)
            if not m:
                continue
            term, definition = m.group(1).strip(), m.group(2).strip()
            if len(term) < 3 or is_common(term):
                continue
            distractors = [k for k in content["keywords"]
                           if k.lower() != term.lower()][:3]
            if len(distractors) < 3:
                break
            options = shuffle([definition] + distractors)
            questions.append({
                "question": f"What is {term}?",
                "options": options,
                "correctAnswer": options.index(definition),
                "questionType": "definition",
                "explanation": f'According to the text: "{sentence}"',
            })
            break
    return questions


def make_fill_blank_questions(content: dict) -> list[dict]:
    questions = []
    for sentence in content["sentences"]:
        important = [
            w for w in re.findall(r'\b[a-zA-Z]{4,}\b', sentence)
            if w.lower() in content["keywords"]
            or (w[0].isupper() and len(w) > 4)
        ]
        if not important:
            continue
        word = random.choice(important)
        blanked = re.sub(rf'\b{re.escape(word)}\b', '______', sentence, count=1, flags=re.IGNORECASE)
        if blanked == sentence:
            continue
        distractors = [k for k in content["keywords"]
                       if k.lower() != word.lower()][:3]
        if len(distractors) < 3:
            continue
        options = shuffle([word] + distractors)
        questions.append({
            "question": f"Fill in the blank: {blanked}",
            "options": options,
            "correctAnswer": options.index(word),
            "questionType": "fill-blank",
            "explanation": f'The correct answer is "{word}". Full sentence: "{sentence}"',
        })
    return questions


def make_keyword_questions(content: dict) -> list[dict]:
    questions = []
    for heading in content["headings"]:
        topic_words = [w for w in heading.split() if len(w) > 3]
        if not topic_words:
            continue
        main = topic_words[0]
        related = [s for s in content["sentences"]
                   if main.lower() in s.lower()]
        if not related:
            continue
        sentence = related[0]
        kws = [w for w in re.findall(r'\b[a-zA-Z]{4,}\b', sentence)
               if w.lower() in content["keywords"]]
        if len(kws) < 4:
            continue
        correct = kws[0]
        others = shuffle([k for k in kws if k != correct])[:3]
        options = shuffle([correct] + others)
        questions.append({
            "question": f'According to the text about "{heading}", which is mentioned?',
            "options": options,
            "correctAnswer": options.index(correct),
            "questionType": "keyword",
            "explanation": f'The text states: "{sentence}"',
        })
    return questions


def make_mc_questions(content: dict) -> list[dict]:
    questions = []
    topic_map: dict[str, list[str]] = {}
    for sentence in content["sentences"]:
        for kw in content["keywords"]:
            if kw.lower() in sentence.lower():
                topic_map.setdefault(kw, []).append(sentence)

    for topic, sentences in topic_map.items():
        if len(sentences) < 2:
            continue
        sentence = sentences[0]
        words = [w for w in sentence.split() if len(w) > 4]
        if len(words) < 5:
            continue
        answer = next(
            (w for w in words if w.lower() in content["keywords"]),
            words[0]
        )
        distractors = shuffle([k for k in content["keywords"]
                               if k != answer.lower()])[:3]
        if len(distractors) < 3:
            continue
        options = shuffle([answer] + distractors)
        questions.append({
            "question": f'Which of the following best relates to "{topic}"?',
            "options": options,
            "correctAnswer": options.index(answer),
            "questionType": "multiple-choice",
            "explanation": f'Context: "{sentence}"',
        })
    return questions


def generate_quiz(content: dict, question_count: int = 10) -> list[dict]:
    all_questions = (
        make_definition_questions(content)
        + make_fill_blank_questions(content)
        + make_keyword_questions(content)
        + make_mc_questions(content)
    )
    random.shuffle(all_questions)
    return all_questions[:question_count]


# ── Multipart form parser ────────────────────────────────────────────────────

def parse_multipart(body: bytes, boundary: str) -> dict:
    """Returns {field_name: value} where value is bytes for files, str for text."""
    result = {}
    delimiter = ("--" + boundary).encode()
    parts = body.split(delimiter)
    for part in parts[1:]:
        if part in (b"--\r\n", b"--"):
            continue
        if b"\r\n\r\n" not in part:
            continue
        headers_raw, _, content = part.partition(b"\r\n\r\n")
        content = content.rstrip(b"\r\n")
        headers_text = headers_raw.decode("utf-8", errors="ignore")
        cd_match = re.search(r'name="([^"]+)"', headers_text)
        if not cd_match:
            continue
        name = cd_match.group(1)
        fn_match = re.search(r'filename="([^"]+)"', headers_text)
        if fn_match:
            result[name] = {"filename": fn_match.group(1), "data": content}
        else:
            result[name] = content.decode("utf-8", errors="ignore")
    return result


# ── Vercel handler ───────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            ct = self.headers.get("Content-Type", "")

            # ── /api/process  (file upload) ──────────────────────────────
            if "multipart/form-data" in ct:
                boundary = re.search(r'boundary=([^\s;]+)', ct)
                if not boundary:
                    return self._error(400, "Missing boundary")
                fields = parse_multipart(body, boundary.group(1))

                file_field = fields.get("file")
                if not file_field or not isinstance(file_field, dict):
                    return self._error(400, "No file uploaded")

                filename = file_field["filename"]
                data = file_field["data"]
                text = extract_text(filename, data)
                content = analyze_content(text)
                return self._json({"success": True, "content": content})

            # ── /api/generate  (quiz generation from JSON body) ──────────
            elif "application/json" in ct:
                payload = json.loads(body)
                content = payload.get("content")
                count = int(payload.get("questionCount", 10))
                if not content:
                    return self._error(400, "No content provided")
                questions = generate_quiz(content, count)
                return self._json({"success": True, "questions": questions})

            else:
                return self._error(415, "Unsupported content type")

        except Exception as e:
            traceback.print_exc()
            return self._error(500, str(e))

    def _json(self, data: dict):
        body = json.dumps(data).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, code: int, msg: str):
        body = json.dumps({"success": False, "error": msg}).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, *args):
        pass  # silence default access logs
