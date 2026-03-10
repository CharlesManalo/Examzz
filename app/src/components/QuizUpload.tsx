import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quizAPI } from "@/lib/api";
import { createQuiz, createQuestions, incrementUsage } from '@/services/supabase';
import { getCurrentUser } from '@/services/supabase';
import type { Quiz, Question, View } from '@/types';

interface QuizQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

interface QuizMetadata {
  file_name: string;
  file_size: number;
  extracted_chars: number;
  question_count: number;
  difficulty: string;
  model_used: string;
}

interface QuizUploadProps {
  onStartQuiz: (quiz: Quiz, questions: Question[]) => void;
  onNavigate: (view: View) => void;
}

const QuizUpload = ({ onStartQuiz, onNavigate }: QuizUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  const handleGenerateQuiz = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question_count", questionCount);
      formData.append("difficulty", difficulty);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await quizAPI.generate(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        // Save quiz to Supabase
        const savedQuiz = await createQuiz({
          userId: user.id,
          quizType: 'quiz',
          title: file.name.replace(/\.[^/.]+$/, ''),
          totalQuestions: response.data.quiz.length,
          fileIds: []
        });

        // Save questions to Supabase
        const savedQuestions = await createQuestions(
          response.data.quiz.map((q: any) => ({
            quizId: savedQuiz.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer_index,
            questionType: 'multiple-choice' as const,
            explanation: q.explanation
          }))
        );

        await incrementUsage(user.id, 'quiz');

        toast.success(`Generated ${savedQuestions.length} questions!`);
        onStartQuiz(savedQuiz, savedQuestions);  // hands off to Exam
      } else {
        toast.error("Failed to generate quiz");
      }
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      if (error.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail || "Invalid request");
      } else if (error.code === "ECONNABORTED") {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to generate quiz. Please try again.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const resetQuiz = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Generate Quiz from Document
          </CardTitle>
          <CardDescription>
            Upload a PDF, Word, PowerPoint, or text file to generate an
            AI-powered quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop a document here, or click to select
                </p>
                <p className="text-sm text-gray-400">
                  Supports PDF, DOCX, PPTX, and TXT files
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetQuiz}>
                Remove
              </Button>
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="25">25 Questions</SelectItem>
                  <SelectItem value="50">50 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating quiz...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQuiz}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizUpload;
