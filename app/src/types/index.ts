export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin: string;
  isPremium: boolean;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  fileSize: number;
  extractedText: string;
  uploadDate: string;
}

export type QuizType = 'quiz' | 'mock-exam' | 'full-exam' | 'lesson-review';

export interface Quiz {
  id: string;
  userId: string;
  quizType: QuizType;
  title: string;
  totalQuestions: number;
  createdAt: string;
  fileIds: string[];
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  questionType: 'definition' | 'fill-blank' | 'keyword' | 'multiple-choice';
  explanation?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  completedAt: string;
  answers: UserAnswer[];
  timeSpent: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsersToday: number;
  totalExams: number;
  totalQuizzes: number;
  filesUploaded: number;
  quizzesCompleted: number;
  averageScore: number;
}

export type View = 'home' | 'dashboard' | 'upload' | 'quiz' | 'exam' | 'results' | 'review' | 'login' | 'register' | 'admin';

export interface AppState {
  currentView: View;
  currentUser: User | null;
  currentQuiz: Quiz | null;
  currentQuestions: Question[];
  currentResult: QuizResult | null;
}
