import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Disable worker for now to avoid configuration issues
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

export interface ExtractedContent {
  text: string;
  headings: string[];
  keywords: string[];
  sentences: string[];
}

export const processDocument = async (
  file: File,
): Promise<ExtractedContent> => {
  const fileType = file.name.split(".").pop()?.toLowerCase();

  let text = "";

  switch (fileType) {
    case "txt":
      text = await file.text();
      break;
    case "pdf":
      text = await extractPDFText(file);
      break;
    case "docx":
    case "doc":
      text = await extractWordText(file);
      break;
    case "pptx":
    case "ppt":
      text = await extractPowerPointText(file);
      break;
    case "xlsx":
    case "xls":
      text = await extractExcelText(file);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  return analyzeContent(text);
};

const extractPDFText = async (file: File): Promise<string> => {
  try {
    console.log("Starting PDF extraction for file:", file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log("PDF loaded, pages:", pdf.numPages);

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += pageText + "\n";
    }

    console.log("PDF extraction completed, text length:", text.length);
    return text;
  } catch (error) {
    console.error("PDF extraction error details:", error);
    console.error("PDF file info:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return ""; // Return empty string on error to prevent crashes
  }
};

const extractWordText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
};

const extractPowerPointText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = await file.text();
        resolve(cleanExtractedText(text));
      } catch {
        reject(new Error("Failed to extract PowerPoint text"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read PowerPoint file"));
    reader.readAsText(file);
  });
};

const extractExcelText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  let text = "";
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    jsonData.forEach((row: unknown) => {
      if (Array.isArray(row)) {
        text += row.join(" ") + "\n";
      }
    });
  });

  return text;
};

const cleanExtractedText = (text: string): string => {
  return text
    .replace(/[^\x20-\x7E\n\r\t]/g, "") // Remove non-printable except newlines
    .replace(/[ \t]+/g, " ") // Collapse spaces/tabs
    .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
    .replace(/\n{2}/g, "\n") // Max 1 consecutive newline
    .trim();
};

const analyzeContent = (text: string): ExtractedContent => {
  const cleanedText = cleanExtractedText(text);

  const sentences = extractSentences(cleanedText);
  const headings = extractHeadings(cleanedText);
  const keywords = extractKeywords(cleanedText, headings);

  return {
    text: cleanedText,
    headings,
    keywords,
    sentences,
  };
};

const extractSentences = (text: string): string[] => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && l.length < 300);
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences: string[] = [];

  lines.forEach((line) => {
    const matches = line.match(sentenceRegex);
    if (matches) {
      sentences.push(
        ...matches
          .map((s) => s.trim())
          .filter((s) => s.length > 20 && s.length < 300),
      );
    } else if (line.length > 20 && line.length < 300) {
      sentences.push(line); // treat as whole line as a sentence
    }
  });

  return sentences;
};

const extractHeadings = (text: string): string[] => {
  const lines = text.split("\n");
  const headings: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (
      trimmed.length > 5 &&
      trimmed.length < 100 &&
      (trimmed === trimmed.toUpperCase() ||
        (trimmed[0] === trimmed[0].toUpperCase() && !trimmed.match(/[.!?]$/)))
    ) {
      headings.push(trimmed);
    }
  });

  return [...new Set(headings)].slice(0, 20);
};

const extractKeywords = (text: string, headings: string[]): string[] => {
  const keywords = new Set<string>();

  headings.forEach((h) => {
    const words = h.split(/\s+/).filter((w) => w.length > 3);
    words.forEach((w) => keywords.add(w.toLowerCase()));
  });

  const wordFreq: Record<string, number> = {};
  const words = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];

  words.forEach((word) => {
    const lower = word.toLowerCase();
    wordFreq[lower] = (wordFreq[lower] || 0) + 1;
  });

  Object.entries(wordFreq)
    .filter(([_, count]) => count > 2)
    .forEach(([word]) => keywords.add(word));

  return Array.from(keywords).slice(0, 30);
};

export const isValidFileType = (file: File): boolean => {
  const validTypes = ["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  return validTypes.includes(extension || "");
};

export const isValidFileSize = (file: File): boolean => {
  const maxSize = 25 * 1024 * 1024;
  return file.size <= maxSize;
};

export const getFileTypeLabel = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const labels: Record<string, string> = {
    pdf: "PDF",
    docx: "Word",
    doc: "Word",
    pptx: "PowerPoint",
    ppt: "PowerPoint",
    xlsx: "Excel",
    xls: "Excel",
  };
  return labels[extension] || extension.toUpperCase();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
