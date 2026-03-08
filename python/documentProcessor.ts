export interface ExtractedContent {
  text: string;
  headings: string[];
  keywords: string[];
  sentences: string[];
}

const API_BASE = "/api/process";

export const processDocument = async (file: File): Promise<ExtractedContent> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_BASE, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Processing failed");

  return data.content as ExtractedContent;
};

export const generateQuizFromContent = async (
  content: ExtractedContent,
  questionCount: number
): Promise<any[]> => {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, questionCount }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Generation failed");

  return data.questions;
};

// ── Unchanged helpers used by the rest of the app ──────────────────────────

export const isValidFileType = (file: File): boolean => {
  const validTypes = ["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  return validTypes.includes(extension || "");
};

export const isValidFileSize = (file: File): boolean => {
  return file.size <= 25 * 1024 * 1024;
};

export const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const labels: Record<string, string> = {
    pdf: "PDF", docx: "Word", doc: "Word",
    pptx: "PowerPoint", ppt: "PowerPoint",
    xlsx: "Excel", xls: "Excel",
  };
  return labels[ext] || ext.toUpperCase();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
