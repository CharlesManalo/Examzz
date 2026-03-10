import { useState, useEffect } from "react";
import type { View, Quiz, Question, QuizResult, UserAnswer } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { createResult, getCurrentUser } from "@/services/supabase";
import { toast } from "sonner";
import {
  Clock,
  ChevronRight,
  AlertCircle,
  Trophy,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ExamProps {
  quiz: Quiz;
  questions: Question[];
  onFinish: (result: QuizResult) => void;
  onNavigate: (view: View) => void;
}

const Exam = ({ quiz, questions, onFinish }: ExamProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [examStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, currentQuestionIndex]);

  useEffect(() => {
    setTimeLeft(30);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnswered(false);
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      setShowFeedback(true);

      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedAnswer: -1,
        isCorrect: false,
        timeSpent: 30,
      };

      setAnswers((prev) => [...prev, answer]);
      toast.error("Time's up!");
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;

    setSelectedAnswer(index);
    setIsAnswered(true);
    setShowFeedback(true);

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = index === currentQuestion.correctAnswer;

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: index,
      isCorrect,
      timeSpent,
    };

    setAnswers((prev) => [...prev, answer]);

    if (isCorrect) {
      toast.success("Correct!", { duration: 1000 });
    } else {
      toast.error("Incorrect", { duration: 1000 });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    const user = await getCurrentUser();
    if (!user) {
      toast.error("Session expired");
      return;
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const unansweredCount = questions.length - answers.length;
    const totalTimeSpent = Math.floor((Date.now() - examStartTime) / 1000);

    try {
      const result = await createResult({
        userId: user.id,
        quizId: quiz.id,
        score: Math.round((correctCount / questions.length) * 100),
        correctAnswers: correctCount,
        wrongAnswers: wrongCount + unansweredCount,
        answers,
        timeSpent: totalTimeSpent,
      });

      onFinish(result);
    } catch (err) {
      toast.error("Failed to save result");
      console.error(err);
    }
  };

  const getOptionColor = (index: number) => {
    if (!showFeedback) {
      return selectedAnswer === index
        ? "bg-violet-600 text-white border-violet-600"
        : "bg-white hover:bg-violet-50 border-gray-200";
    }

    if (index === currentQuestion.correctAnswer) {
      return "bg-green-500 text-white border-green-500";
    }

    if (selectedAnswer === index && index !== currentQuestion.correctAnswer) {
      return "bg-red-500 text-white border-red-500";
    }

    return "bg-white border-gray-200 opacity-50";
  };

  const getOptionIcon = (index: number) => {
    if (!showFeedback) return null;

    if (index === currentQuestion.correctAnswer) {
      return <CheckCircle className="h-6 w-6" />;
    }

    if (selectedAnswer === index && index !== currentQuestion.correctAnswer) {
      return <XCircle className="h-6 w-6" />;
    }

    return null;
  };

  const getTimerColor = () => {
    if (timeLeft > 15) return "text-green-600";
    if (timeLeft > 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 text-2xl font-bold ${getTimerColor()}`}
            >
              <Clock className="h-6 w-6" />
              {timeLeft}s
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-0 shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
            <h2 className="text-xl lg:text-2xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>
        </Card>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all transform hover:scale-[1.02] ${getOptionColor(
                index,
              )}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    showFeedback
                      ? "bg-white/20"
                      : selectedAnswer === index
                        ? "bg-white/20"
                        : "bg-violet-100 text-violet-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1 text-lg">{option}</span>
                {getOptionIcon(index)}
              </div>
            </button>
          ))}
        </div>

        {showFeedback && (
          <Card
            className={`border-0 shadow-md mb-6 ${
              selectedAnswer === currentQuestion.correctAnswer
                ? "bg-green-50"
                : "bg-red-50"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? "Correct!"
                      : selectedAnswer === -1
                        ? "Time's up!"
                        : "Incorrect"}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          {showFeedback && (
            <Button
              size="lg"
              onClick={handleNext}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Finish Exam
                  <Trophy className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index < currentQuestionIndex
                  ? answers[index]?.isCorrect
                    ? "bg-green-500"
                    : "bg-red-500"
                  : index === currentQuestionIndex
                    ? "bg-violet-600"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exam;
