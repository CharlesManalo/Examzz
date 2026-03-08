export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin: string;
  isPremium: boolean;
  stripeCustomerId?: string;
  paymongoCustomerId?: string;
  subscriptionStatus?:
    | "active"
    | "canceled"
    | "past_due"
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "unpaid"
    | null;
  planType?: "free" | "premium";
  subscriptionId?: string;
  subscriptionEndDate?: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: "pdf" | "docx" | "pptx" | "xlsx";
  fileSize: number;
  extractedText: string;
  uploadDate: string;
}

export type QuizType = "quiz" | "mock-exam" | "full-exam" | "lesson-review";

export interface ExtractedContent {
  text: string;
  headings: string[];
  keywords: string[];
  sentences: string[];
}

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
  questionType: "definition" | "fill-blank" | "keyword" | "multiple-choice";
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

export type View =
  | "home"
  | "dashboard"
  | "upload"
  | "quiz"
  | "exam"
  | "results"
  | "review"
  | "login"
  | "register"
  | "admin"
  | "pricing"
  | "subscription";

export interface AppState {
  currentView: View;
  currentUser: User | null;
  currentQuiz: Quiz | null;
  currentQuestions: Question[];
  currentResult: QuizResult | null;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  stripePriceId: string;
  features: string[];
  limits: {
    quizzesPerDay: number;
    fileUploads: number;
    maxFileSize: number; // in MB
    features: string[];
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status:
    | "active"
    | "canceled"
    | "past_due"
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "unpaid";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageLimits {
  quizzesToday: number;
  filesUploaded: number;
  quizzesPerDayLimit: number;
  fileUploadsLimit: number;
  maxFileSizeLimit: number;
  canUploadMore: boolean;
  canCreateMoreQuizzes: boolean;
}
