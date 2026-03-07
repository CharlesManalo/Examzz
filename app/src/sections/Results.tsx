import type { View, QuizResult, Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  BookOpen, 
  Home,
  TrendingUp,
  Share2,
  ChevronRight
} from 'lucide-react';

interface ResultsProps {
  result: QuizResult;
  questions: Question[];
  onNavigate: (view: View) => void;
  onReview: () => void;
}

const Results = ({ result, questions, onNavigate, onReview }: ResultsProps) => {
  const getScoreMessage = () => {
    if (result.score >= 90) return { message: 'Outstanding!', color: 'text-green-600', emoji: '🏆' };
    if (result.score >= 80) return { message: 'Great job!', color: 'text-blue-600', emoji: '🌟' };
    if (result.score >= 70) return { message: 'Good work!', color: 'text-violet-600', emoji: '👍' };
    if (result.score >= 60) return { message: 'Keep practicing!', color: 'text-yellow-600', emoji: '💪' };
    return { message: 'Need more study!', color: 'text-red-600', emoji: '📚' };
  };

  const getScoreColor = () => {
    if (result.score >= 80) return 'from-green-500 to-emerald-500';
    if (result.score >= 60) return 'from-violet-500 to-purple-500';
    return 'from-orange-500 to-red-500';
  };

  const scoreInfo = getScoreMessage();
  const minutes = Math.floor(result.timeSpent / 60);
  const seconds = result.timeSpent % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-8">
      <div className="container max-w-3xl">
        <Card className="border-0 shadow-xl mb-6 overflow-hidden">
          <div className={`bg-gradient-to-r ${getScoreColor()} p-8 text-white text-center`}>
            <div className="text-6xl mb-4">{scoreInfo.emoji}</div>
            <h1 className="text-3xl font-bold mb-2">{scoreInfo.message}</h1>
            <div className="text-7xl font-bold mb-2">{result.score}%</div>
            <p className="text-white/80">Your Score</p>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{minutes}:{seconds.toString().padStart(2, '0')}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>

            <Progress value={result.score} className="h-3 mb-2" />
            <p className="text-center text-sm text-muted-foreground">
              {result.correctAnswers} out of {questions.length} questions correct
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Performance Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Accuracy</span>
                  <span className="text-sm font-medium">{result.score}%</span>
                </div>
                <Progress value={result.score} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Speed</span>
                  <span className="text-sm font-medium">
                    {Math.round(result.timeSpent / questions.length)}s per question
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (30 / (result.timeSpent / questions.length)) * 100)} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Question Summary</h3>
            <div className="flex flex-wrap gap-2">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center font-medium ${
                    answer.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
              {Array.from({ length: questions.length - result.answers.length }).map((_, index) => (
                <div
                  key={`unanswered-${index}`}
                  className="h-10 w-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center font-medium"
                >
                  {result.answers.length + index + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="flex-col h-auto py-4"
            onClick={onReview}
          >
            <BookOpen className="h-5 w-5 mb-2" />
            <span className="text-xs">Review</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4"
            onClick={() => onNavigate('upload')}
          >
            <RotateCcw className="h-5 w-5 mb-2" />
            <span className="text-xs">Retry</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4"
            onClick={() => onNavigate('dashboard')}
          >
            <Home className="h-5 w-5 mb-2" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4"
            onClick={() => toast.info('Share feature coming soon!')}
          >
            <Share2 className="h-5 w-5 mb-2" />
            <span className="text-xs">Share</span>
          </Button>
        </div>

        <Card className="border-0 shadow-md mt-6 bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Continue Learning</h3>
                <p className="text-sm text-violet-100">
                  Practice more with similar quizzes
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-violet-600 hover:bg-violet-50"
                onClick={() => onNavigate('upload')}
              >
                New Quiz
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
