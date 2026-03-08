import { useState, useCallback } from "react";
import type { View, User, Quiz, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  processDocument,
  isValidFileType,
  isValidFileSize,
  formatFileSize,
  getFileTypeLabel,
} from "@/services/documentProcessor";
import {
  generateQuiz,
  getQuizTitle,
  getRecommendedQuestionCount,
} from "@/services/quizGenerator";
import { createFile, createQuiz, createQuestions } from "@/services/database";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  Trophy,
  BookOpen,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface UploadProps {
  onNavigate: (view: View) => void;
  user: User;
  onStartQuiz: (quiz: Quiz, questions: Question[]) => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  extractedText?: string;
}

const Upload = ({ user, onStartQuiz }: UploadProps) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<
    "quiz" | "mock-exam" | "full-exam" | "lesson-review"
  >("quiz");
  const [isGenerating, setIsGenerating] = useState(false);

  const quizTypes = [
    {
      id: "quiz",
      label: "Quick Quiz",
      icon: Brain,
      description: "10 questions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "mock-exam",
      label: "Mock Exam",
      icon: Target,
      description: "25 questions",
      color: "from-violet-500 to-purple-500",
    },
    {
      id: "full-exam",
      label: "Full Exam",
      icon: Trophy,
      description: "50 questions",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "lesson-review",
      label: "Lesson Review",
      icon: BookOpen,
      description: "15 questions",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > 15) {
      toast.error("Maximum 15 files allowed per session");
      return;
    }

    const validFiles: UploadingFile[] = [];

    newFiles.forEach((file) => {
      if (!isValidFileType(file)) {
        toast.error(`${file.name}: Unsupported file type`);
        return;
      }

      if (!isValidFileSize(file)) {
        toast.error(`${file.name}: File too large (max 25MB)`);
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: "uploading",
      });
    });

    setFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((uploadFile) => {
      processFile(uploadFile);
    });
  };

  const processFile = async (uploadFile: UploadingFile) => {
    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: i } : f)),
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "processing" } : f,
        ),
      );

      const content = await processDocument(uploadFile.file);

      createFile({
        userId: user.id,
        fileName: uploadFile.file.name,
        fileType: uploadFile.file.name.split(".").pop()?.toLowerCase() as any,
        fileSize: uploadFile.file.size,
        extractedText: content.text,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "completed",
                extractedText: content.text,
              }
            : f,
        ),
      );

      toast.success(`${uploadFile.file.name} processed successfully`);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: "Failed to process file",
              }
            : f,
        ),
      );
      toast.error(`Failed to process ${uploadFile.file.name}`);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleGenerateQuiz = async () => {
    const completedFiles = files.filter((f) => f.status === "completed");
    if (completedFiles.length === 0) {
      toast.error("Please upload and process at least one file first");
      return;
    }

    setIsGenerating(true);
    toast.info("Generating your quiz...");

    try {
      const combinedText = completedFiles
        .map((f) => f.extractedText)
        .join("\n\n");

      if (!combinedText || combinedText.trim().length < 50) {
        toast.error("Not enough content to generate questions", {
          description: "Please upload files with more text content",
        });
        setIsGenerating(false);
        return;
      }

      const mockFile = new File([combinedText], "combined.txt", {
        type: "text/plain",
      });
      const content = await processDocument(mockFile);

      if (!content || !content.text || content.text.trim().length < 50) {
        toast.error("Could not process document content", {
          description: "The uploaded files may not contain readable text",
        });
        setIsGenerating(false);
        return;
      }

      const questionCount = getRecommendedQuestionCount(selectedQuizType);
      const questions = generateQuiz(content, {
        questionCount,
        quizType: selectedQuizType,
      });

      if (questions.length === 0) {
        toast.error("Could not generate questions from the uploaded files", {
          description:
            "Try uploading files with more structured content (definitions, terms, etc.)",
        });
        setIsGenerating(false);
        return;
      }

      const quiz = createQuiz({
        userId: user.id,
        quizType: selectedQuizType,
        title: `${getQuizTitle(selectedQuizType)} - ${new Date().toLocaleDateString()}`,
        totalQuestions: questions.length,
        fileIds: [],
      });

      const createdQuestions = createQuestions(
        questions.map((q) => ({ ...q, quizId: quiz.id })),
      );

      toast.success("Quiz generated successfully!");
      setIsGenerating(false);
      onStartQuiz(quiz, createdQuestions);
    } catch (error) {
      toast.error("Failed to generate quiz");
      setIsGenerating(false);
    }
  };

  const completedCount = files.filter((f) => f.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white py-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Study Materials</h1>
          <p className="text-muted-foreground">
            Upload your documents and we'll generate quizzes automatically
          </p>
        </div>

        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium mb-4">Select Quiz Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quizTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedQuizType(type.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedQuizType === type.id
                        ? "border-violet-600 bg-violet-50"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-2 border-dashed mb-6 transition-colors ${
            isDragging ? "border-violet-600 bg-violet-50" : "border-muted"
          }`}
        >
          <CardContent className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="text-center"
            >
              <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Drag and drop your files here
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse from your computer
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: PDF, Word, PowerPoint, Excel (Max 25MB per file, up
                to 15 files)
              </p>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card className="border-0 shadow-md mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Uploaded Files ({completedCount}/{files.length} completed)
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                  Clear All
                </Button>
              </div>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted"
                  >
                    <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {file.file.name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {getFileTypeLabel(file.file.name)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </p>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {file.status === "processing" && (
                        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {files.length > 0 && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleGenerateQuiz}
              disabled={completedCount === 0 || isGenerating}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  Generate {getQuizTitle(selectedQuizType)}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
