import { useState, useEffect } from 'react';
import type { View, User, Quiz, Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  getFilesByUserId, 
  getQuizzesByUserId, 
  getResultsByUserId,
  getQuestionsByQuizId,
  createQuiz,
  createQuestions
} from '@/services/database';
import { generateQuiz, getQuizTitle } from '@/services/quizGenerator';
import { processDocument } from '@/services/documentProcessor';
import { toast } from 'sonner';
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
  Star
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: View) => void;
  user: User;
  onLogout: () => void;
  onStartQuiz: (quiz: Quiz, questions: Question[]) => void;
}

const Dashboard = ({ onNavigate, user, onStartQuiz }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0
  });
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [weakTopics] = useState(['Biology', 'Chemistry', 'History']);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = () => {
    const files = getFilesByUserId(user.id);
    const quizzes = getQuizzesByUserId(user.id);
    const results = getResultsByUserId(user.id);

    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    setStats({
      totalFiles: files.length,
      totalQuizzes: quizzes.length,
      completedQuizzes: results.length,
      averageScore: avgScore
    });

    setRecentQuizzes(quizzes.slice(-5).reverse());
    setRecentFiles(files.slice(-3).reverse());
  };

  const handleQuickQuiz = async () => {
    const files = getFilesByUserId(user.id);
    if (files.length === 0) {
      toast.error('No files found', { description: 'Please upload some study materials first' });
      onNavigate('upload');
      return;
    }

    toast.info('Generating quiz from your latest files...');

    try {
      const latestFile = files[files.length - 1];
      
      const mockFile = new File([latestFile.extractedText], latestFile.fileName, { 
        type: 'text/plain' 
      });
      
      const content = await processDocument(mockFile);
      const questions = generateQuiz(content, { questionCount: 10, quizType: 'quiz' });

      if (questions.length === 0) {
        toast.error('Could not generate questions', { description: 'Try uploading a different file' });
        return;
      }

      const quiz = createQuiz({
        userId: user.id,
        quizType: 'quiz',
        title: `Quick Quiz - ${latestFile.fileName}`,
        totalQuestions: questions.length,
        fileIds: [latestFile.id]
      });

      const createdQuestions = createQuestions(
        questions.map(q => ({ ...q, quizId: quiz.id }))
      );

      onStartQuiz(quiz, createdQuestions);
    } catch (error) {
      toast.error('Failed to generate quiz');
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    const questions = getQuestionsByQuizId(quiz.id);
    if (questions.length === 0) {
      toast.error('No questions found for this quiz');
      return;
    }
    onStartQuiz(quiz, questions);
  };

  const getQuizIcon = (type: string) => {
    switch (type) {
      case 'quiz': return Brain;
      case 'mock-exam': return Target;
      case 'full-exam': return Trophy;
      case 'lesson-review': return BookOpen;
      default: return Brain;
    }
  };

  const getQuizColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'from-blue-500 to-cyan-500';
      case 'mock-exam': return 'from-violet-500 to-purple-500';
      case 'full-exam': return 'from-orange-500 to-red-500';
      case 'lesson-review': return 'from-green-500 to-emerald-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Student</span>
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
            onClick={() => onNavigate('upload')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {stats.totalFiles} files
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
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Quick
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Generate Quiz</h3>
              <p className="text-blue-100 text-sm">Create from latest file</p>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-500 text-white"
            onClick={() => onNavigate('upload')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  25 Qs
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Mock Exam</h3>
              <p className="text-violet-100 text-sm">Practice test mode</p>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-500 text-white"
            onClick={() => onNavigate('upload')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Study
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-1">Lesson Review</h3>
              <p className="text-green-100 text-sm">Review key concepts</p>
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
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('dashboard')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{stats.averageScore}%</span>
                    </div>
                    <Progress value={stats.averageScore} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-violet-50 rounded-xl">
                      <Trophy className="h-5 w-5 text-violet-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.completedQuizzes}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Brain className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                      <p className="text-xs text-muted-foreground">Quizzes</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Star className="h-5 w-5 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.averageScore}%</p>
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
                  <Button variant="ghost" size="sm">View All</Button>
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
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getQuizColor(quiz.quizType)} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{quiz.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {quiz.totalQuestions} questions • {getQuizTitle(quiz.quizType)}
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
                      onClick={() => onNavigate('upload')}
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
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{topic}</span>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-600" />
                    Recent Files
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('upload')}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentFiles.length > 0 ? (
                  <div className="space-y-3">
                    {recentFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">No files uploaded yet</p>
                    <Button size="sm" onClick={() => onNavigate('upload')}>
                      Upload Files
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {!user.isPremium && (
              <Card className="border-0 shadow-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">Upgrade to Premium</span>
                  </div>
                  <p className="text-sm text-violet-100 mb-4">
                    Get unlimited quizzes, advanced analytics, and no ads.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-violet-600 hover:bg-violet-50"
                  >
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
