import { useState, useEffect } from "react";
import type { View, User, QuizResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  Trophy,
  TrendingUp,
  Play,
  BookOpen,
  Zap,
  Target,
  ChevronRight,
  Star,
} from "lucide-react";
import { getResultsByUserId, getQuizzesByUserId } from "@/services/supabase";

interface DashboardProps {
  user: User;
  onNavigate: (view: View) => void;
  onStartQuiz: (quizId: string) => void;
  onLogout: () => void;
}

const Dashboard = ({ user, onNavigate, onLogout }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0,
    recentActivity: 0,
  });
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [results, quizzes] = await Promise.all([
          getResultsByUserId(user.id),
          getQuizzesByUserId(user.id),
        ]);

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const recentWeek = results.filter(
          (r) => new Date(r.completedAt) >= oneWeekAgo,
        );
        const thisMonth = results.filter(
          (r) => new Date(r.completedAt) >= startOfMonth,
        );
        const avgScore =
          results.length > 0
            ? Math.round(
                results.reduce((sum, r) => sum + r.score, 0) / results.length,
              )
            : 0;

        setStats({
          totalQuizzes: quizzes.length,
          averageScore: avgScore,
          totalQuestions: thisMonth.reduce(
            (sum, r) => sum + r.correctAnswers + r.wrongAnswers,
            0,
          ),
          recentActivity: recentWeek.length,
        });

        setRecentResults(results.slice(0, 3));
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

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Examzz Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email}!
          </h2>
          <p className="text-gray-600">
            Ready to create and take AI-powered quizzes?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Quizzes
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalQuizzes}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${stats.averageScore}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all quizzes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questions Answered
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalQuestions}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.recentActivity}
              </div>
              <p className="text-xs text-muted-foreground">Quizzes this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Create New Quiz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Upload a document and let AI generate a quiz for you.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>PDF, Word, PowerPoint</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4" />
                  <span>10, 25, or 50 questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Easy, Medium, or Hard</span>
                </div>
              </div>
              <Button
                onClick={() => onNavigate("upload")}
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Jump back into your learning.</p>
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
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading activity...</p>
            ) : recentResults.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No quizzes taken yet
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Upload a document to get started!
                </p>
                <Button size="sm" onClick={() => onNavigate("upload")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Your First Quiz
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${result.score >= 70 ? "bg-green-500" : "bg-red-400"}`}
                      />
                      <div>
                        <p className="font-medium">Quiz Completed</p>
                        <p className="text-sm text-gray-600">
                          Score: {result.score}% • {result.correctAnswers}/
                          {result.correctAnswers + result.wrongAnswers} correct
                          • {formatTimeAgo(result.completedAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
