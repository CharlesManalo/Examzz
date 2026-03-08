import type { ExtractedContent, Question, QuizType } from "@/types";

// API endpoints
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ||
    "https://examzz.vercel.app") + "/api";

// Process document via Python API
export const processDocument = async (
  file: File,
): Promise<ExtractedContent> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/process-document`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Document processing failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Document processing error:", error);
    throw error;
  }
};

// Generate quiz via Python API
export const generateQuizFromContent = async (
  content: ExtractedContent,
  options: {
    questionCount?: number;
    quizType?: QuizType;
  } = {},
): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        questionCount: options.questionCount || 10,
        quizType: options.quizType || "quiz",
      }),
    });

    if (!response.ok) {
      throw new Error(`Quiz generation failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert API response to frontend Question format
    return data.questions.map((q: any, index: number) => ({
      id: `generated-${index}`,
      quizId: "temp-quiz",
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      questionType: q.questionType as any,
      explanation: q.explanation,
    }));
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

// Helper functions for file validation
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
