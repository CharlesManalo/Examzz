import { useState, useEffect } from "react";
import type { View, User, Quiz, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getQuizzesByUserId,
  getResultsByUserId,
  getQuestionsByQuizId,
} from "@/services/supabase";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  Trophy,
  TrendingUp,
  AlertCircle,
  Play,
  BookOpen,
  Zap,
  Target,
  ChevronRight,
  Star,
} from "lucide-react";

interface DashboardProps {
  onNavigate: (view: View) => void;
  user: User;
  onLogout: () => void;
  onStartQuiz: (quiz: Quiz, questions: Question[]) => void;
}

const Dashboard = ({
  onNavigate,
  user,
  onLogout,
  onStartQuiz,
}: DashboardProps) => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0,
    recentActivity: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch user's quizzes and results
        const [quizzes, results] = await Promise.all([
          getQuizzesByUserId(user.id),
          getResultsByUserId(user.id),
        ]);

        setRecentQuizzes(quizzes.slice(0, 5));
        setRecentResults(results.slice(0, 3));

        // Calculate stats
        const avgScore =
          results.length > 0
            ? Math.round(
                results.reduce((sum, r) => sum + r.score, 0) / results.length,
              )
            : 0;

        // Calculate questions from last month
        const thisMonth = results.filter(
          (r) =>
            new Date(r.completedAt) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        );

        // Calculate recent week activity
        const recentWeek = results.filter(
          (r) =>
            new Date(r.completedAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        );

        setStats({
          totalQuizzes: quizzes.length,
          averageScore: avgScore,
          totalQuestions: thisMonth.reduce(
            (sum, r) => sum + r.correctAnswers + r.wrongAnswers,
            0,
          ),
          recentActivity: recentWeek.length,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);

  const handleLogout = () => {
    toast.success("Logged out successfully");
    onLogout();
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      const questions = await getQuestionsByQuizId(quiz.id);
      if (questions.length > 0) {
        onStartQuiz(quiz, questions);
      } else {
        toast.error("No questions found for this quiz");
      }
    } catch (error) {
      toast.error("Failed to load quiz questions");
    }
  };

  const handleQuickQuiz = () => {
    if (recentQuizzes.length > 0) {
      handleStartQuiz(recentQuizzes[0]);
    } else {
      onNavigate("upload");
    }
  };

  const getQuizIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return Brain;
      case "mock-exam":
        return Trophy;
      case "full-exam":
        return Target;
      case "lesson-review":
        return BookOpen;
      default:
        return Brain;
    }
  };

  const getQuizTitle = (type: string) => {
    switch (type) {
      case "quiz":
        return "Practice Quiz";
      case "mock-exam":
        return "Mock Exam";
      case "full-exam":
        return "Full Exam";
      case "lesson-review":
        return "Lesson Review";
      default:
        return "Quiz";
    }
  };

  const getQuizColor = (type: string) => {
    switch (type) {
      case "quiz":
        return "from-blue-500 to-cyan-500";
      case "mock-exam":
        return "from-violet-500 to-purple-500";
      case "full-exam":
        return "from-orange-500 to-red-500";
      case "lesson-review":
        return "from-green-500 to-emerald-500";
      default:
        return "from-blue-500 to-cyan-500";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {user.nickname || "Student"}
            </span>
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
            onClick={() => onNavigate("upload")}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  New
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Upload Files</h3>
              <p className="text-violet-100 text-sm">Add new study materials</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
            onClick={handleQuickQuiz}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  Quick
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Generate Quiz</h3>
              <p className="text-blue-100 text-sm">Create from latest file</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-500 text-white"
            onClick={() => {
              if (recentResults.length > 0) {
                onNavigate("results");
              } else {
                toast.info("No results yet — take a quiz first!");
              }
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {recentResults.length > 0
                    ? `${recentResults[0]?.score}%`
                    : "N/A"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Last Result</h3>
              <p className="text-violet-100 text-sm">
                {recentResults.length > 0
                  ? "View your last score"
                  : "No results yet"}
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-500 text-white"
            onClick={() => {
              if (recentResults.length > 0) {
                onNavigate("review");
              } else {
                toast.info("No answers to review yet!");
              }
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  Review
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Review Answers</h3>
              <p className="text-green-100 text-sm">
                {recentResults.length > 0
                  ? "Review last quiz answers"
                  : "No answers yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-600" />
                    Study Progress
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("results")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        Overall Progress
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {loading ? "..." : stats.averageScore}%
                      </span>
                    </div>
                    <Progress
                      value={loading ? 0 : stats.averageScore}
                      className="h-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-violet-50 rounded-xl">
                      <Trophy className="h-5 w-5 text-violet-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">
                        {loading ? "..." : recentResults.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Brain className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">
                        {loading ? "..." : stats.totalQuizzes}
                      </p>
                      <p className="text-xs text-muted-foreground">Quizzes</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Star className="h-5 w-5 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">
                        {loading ? "..." : stats.averageScore}%
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-violet-600" />
                    Recent Quizzes
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("upload")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentQuizzes.length > 0 ? (
                  <div className="space-y-3">
                    {recentQuizzes.map((quiz) => {
                      const Icon = getQuizIcon(quiz.quizType);
                      return (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getQuizColor(quiz.quizType)} flex items-center justify-center`}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {quiz.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {quiz.totalQuestions} questions •{" "}
                                {getQuizTitle(quiz.quizType)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartQuiz(quiz)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No quizzes yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => onNavigate("upload")}
                    >
                      Create Your First Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onNavigate("upload")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start New Quiz
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={recentResults.length === 0}
                    onClick={() =>
                      recentResults.length > 0
                        ? onNavigate("results")
                        : toast.info("No results yet — take a quiz first!")
                    }
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Last Result
                    {recentResults.length === 0 && (
                      <span className="ml-auto text-xs text-gray-400">
                        No results yet
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={recentResults.length === 0}
                    onClick={() =>
                      recentResults.length > 0
                        ? onNavigate("review")
                        : toast.info("No answers to review yet!")
                    }
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review Last Answers
                    {recentResults.length === 0 && (
                      <span className="ml-auto text-xs text-gray-400">
                        No results yet
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentResults.length > 0 ? (
                  <div className="space-y-3">
                    {recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                              result.score >= 80
                                ? "bg-green-100"
                                : result.score >= 60
                                  ? "bg-yellow-100"
                                  : "bg-red-100"
                            }`}
                          >
                            <Trophy
                              className={`h-4 w-4 ${
                                result.score >= 80
                                  ? "text-green-600"
                                  : result.score >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Quiz Completed
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score: {result.score}% •{" "}
                              {formatTimeAgo(result.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{result.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {result.correctAnswers}/
                            {result.correctAnswers + result.wrongAnswers}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm">
                      No recent activity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Questions This Month</span>
                    <span className="font-semibold">
                      {loading ? "..." : stats.totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quizzes This Week</span>
                    <span className="font-semibold">
                      {loading ? "..." : stats.recentActivity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Score</span>
                    <span className="font-semibold">
                      {loading
                        ? "..."
                        : recentResults.length > 0
                          ? Math.max(...recentResults.map((r) => r.score)) + "%"
                          : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
