import { useState } from "react";
import type { View, QuizResult, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  RotateCcw,
  BookOpen,
  AlertCircle,
} from "lucide-react";

interface ReviewProps {
  result: QuizResult;
  questions: Question[];
  onNavigate: (view: View) => void;
}

const Review = ({ result, questions, onNavigate }: ReviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const userAnswer = result.answers.find(
    (a) => a.questionId === currentQuestion?.id,
  );
  const isCorrect = userAnswer?.isCorrect || false;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const getOptionStyle = (index: number) => {
    if (index === currentQuestion.correctAnswer) {
      return "bg-green-100 border-green-500 text-green-800";
    }

    if (userAnswer?.selectedAnswer === index && !isCorrect) {
      return "bg-red-100 border-red-500 text-red-800";
    }

    return "bg-gray-50 border-gray-200 text-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Review Answers</h1>
            <p className="text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Correct</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Incorrect</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          {questions.map((q, index) => {
            const answer = result.answers.find((a) => a.questionId === q.id);
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-violet-600"
                    : answer?.isCorrect
                      ? "bg-green-400"
                      : "bg-red-400"
                }`}
              />
            );
          })}
        </div>

        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${getOptionStyle(index)}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                        index === currentQuestion.correctAnswer
                          ? "bg-green-500 text-white"
                          : userAnswer?.selectedAnswer === index && !isCorrect
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {index === currentQuestion.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {userAnswer?.selectedAnswer === index && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {currentQuestion.explanation && (
          <Card className="border-0 shadow-md mb-6 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 mb-1">Explanation</p>
                  <p className="text-sm text-blue-700">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isCorrect && userAnswer && (
          <Card className="border-0 shadow-md mb-6 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 mb-1">Your Answer</p>
                  <p className="text-sm text-red-700">
                    You selected:{" "}
                    {String.fromCharCode(65 + userAnswer.selectedAnswer)}.{" "}
                    {currentQuestion.options[userAnswer.selectedAnswer]}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Correct answer:{" "}
                    {String.fromCharCode(65 + currentQuestion.correctAnswer)}.{" "}
                    {currentQuestion.options[currentQuestion.correctAnswer]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate("dashboard")}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => onNavigate("upload")}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Review;
