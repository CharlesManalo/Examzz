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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quizAPI } from "@/lib/api";

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

interface QuizResponse {
  success: boolean;
  quiz: QuizQuestion[];
  metadata: QuizMetadata;
}

const QuizUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [metadata, setMetadata] = useState<QuizMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (selectedFile.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF, Word, PowerPoint, or Excel file");
        return;
      }

      setFile(selectedFile);
      setQuiz([]);
      setMetadata(null);
      toast.success("File uploaded successfully");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
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
        setQuiz(response.data.quiz);
        setMetadata(response.data.metadata);
        toast.success(`Generated ${response.data.quiz.length} quiz questions!`);
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
    setQuiz([]);
    setMetadata(null);
    setProgress(0);
  };

  if (quiz.length > 0) {
    return (
      <QuizComponent questions={quiz} metadata={metadata} onReset={resetQuiz} />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Generate Quiz from Document
          </CardTitle>
          <CardDescription>
            Upload a PDF, Word, PowerPoint, or Excel file to generate an
            AI-powered quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Drop the file here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, Word, PowerPoint, or Excel (MAX. 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}

          {/* Quiz Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Questions (Quiz)</SelectItem>
                  <SelectItem value="25">25 Questions (Mock Exam)</SelectItem>
                  <SelectItem value="50">50 Questions (Exam)</SelectItem>
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
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating quiz...</span>
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

// Quiz Component (embedded for now)
const QuizComponent = ({
  questions,
  metadata,
  onReset,
}: {
  questions: QuizQuestion[];
  metadata: QuizMetadata | null;
  onReset: () => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
      }
    }, 500);
  };

  const calculateScore = () => {
    return answers.reduce((correct, answer, index) => {
      return correct + (answer === questions[index].answer_index ? 1 : 0);
    }, 0);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setSelectedAnswer(null);
    onReset();
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">
                {percentage}%
              </div>
              <div className="text-lg">
                You got {score} out of {questions.length} questions correct
              </div>
              <Badge
                variant={percentage >= 70 ? "default" : "secondary"}
                className="text-lg px-4 py-2"
              >
                {percentage >= 90
                  ? "Excellent!"
                  : percentage >= 70
                    ? "Good Job!"
                    : "Keep Practicing!"}
              </Badge>
            </div>

            {metadata && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Quiz Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>File: {metadata.file_name}</div>
                  <div>Questions: {metadata.question_count}</div>
                  <div>Difficulty: {metadata.difficulty}</div>
                  <div>Model: {metadata.model_used}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={resetQuiz} className="flex-1">
                Generate New Quiz
              </Button>
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Review Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === index ? "default" : "outline"}
              className={`w-full justify-start text-left h-auto p-4 ${
                selectedAnswer === index
                  ? index === question.answer_index
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                  : ""
              }`}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              <span className="flex items-center gap-3">
                <span className="font-medium">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
                {selectedAnswer === index &&
                  index === question.answer_index && (
                    <span className="ml-auto text-green-600">✓ Correct</span>
                  )}
                {selectedAnswer === index &&
                  index !== question.answer_index && (
                    <span className="ml-auto text-red-600">✗ Incorrect</span>
                  )}
              </span>
            </Button>
          ))}

          {selectedAnswer !== null && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Explanation:</p>
              <p className="text-sm text-blue-700">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizUpload;
