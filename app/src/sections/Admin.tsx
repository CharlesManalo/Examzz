import { useState, useEffect } from 'react';
import type { View } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getUsers, 
  getFiles, 
  getQuizzes, 
  getResults, 
  getAnalytics,
  clearDatabase 
} from '@/services/database';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  Brain,
  Trophy,
  TrendingUp,
  Activity,
  Trash2,
  RefreshCw,
  BarChart3,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface AdminProps {
  onNavigate: (view: View) => void;
}

const Admin = ({ onNavigate }: AdminProps) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalQuizzes: 0,
    totalResults: 0,
    activeUsersToday: 0,
    averageScore: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    const users = getUsers();
    const files = getFiles();
    const quizzes = getQuizzes();
    const results = getResults();
    const analytics = getAnalytics();

    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    setStats({
      totalUsers: users.length,
      totalFiles: files.length,
      totalQuizzes: quizzes.length,
      totalResults: results.length,
      activeUsersToday: analytics.activeUsersToday || 0,
      averageScore: avgScore
    });

    setRecentUsers(users.slice(-5).reverse());
    setRecentFiles(files.slice(-5).reverse());
    setRecentQuizzes(quizzes.slice(-5).reverse());
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearDatabase();
      toast.success('All data cleared');
      loadAdminData();
    }
  };

  const handleRefresh = () => {
    loadAdminData();
    toast.success('Data refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform analytics and management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeUsersToday}</p>
                  <p className="text-xs text-muted-foreground">Active Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFiles}</p>
                  <p className="text-xs text-muted-foreground">Files Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalResults}</p>
                  <p className="text-xs text-muted-foreground">Exams Taken</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={user.isPremium ? 'default' : 'secondary'}>
                        {user.isPremium ? 'Premium' : 'Free'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No users yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-600" />
                Recent Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.fileType.toUpperCase()} • {new Date(file.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No files yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-600" />
                Recent Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {recentQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.totalQuestions} questions • {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{quiz.quizType}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No quizzes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-3">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-medium">System Status</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-medium">Uptime</p>
                <p className="text-sm text-blue-600">99.9%</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-violet-100 mb-3">
                  <Users className="h-8 w-8 text-violet-600" />
                </div>
                <p className="font-medium">User Growth</p>
                <p className="text-sm text-violet-600">+{stats.totalUsers} this month</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-3">
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
                <p className="font-medium">Quiz Completion</p>
                <p className="text-sm text-orange-600">{stats.totalResults} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
