import { createClient } from "@supabase/supabase-js";
import type {
  User,
  UploadedFile,
  Quiz,
  Question,
  QuizResult,
  UserAnalytics,
  Subscription,
  UsageLimits,
} from "@/types";

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set - show warning instead of crashing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Missing Supabase environment variables!\n" +
      "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Netlify dashboard.\n" +
      "The app will continue but authentication may not work properly.",
  );
}

// Create client only if we have the required values, otherwise use placeholder
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient("https://placeholder.supabase.co", "placeholder-key");

// Database types based on Supabase schema
interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_premium: boolean;
  paymongo_customer_id: string | null;
  subscription_status: string;
  plan_type: string;
  subscription_id: string | null;
  subscription_end_date: string | null;
  email_verified: boolean;
}

interface DatabaseUploadedFile {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  extracted_text: string | null;
  upload_date: string;
  file_path: string | null;
  mime_type: string | null;
}

interface DatabaseQuiz {
  id: string;
  user_id: string;
  quiz_type: string;
  title: string;
  total_questions: number;
  created_at: string;
  updated_at: string;
  file_ids: string[];
  is_public: boolean;
  tags: string[];
}

interface DatabaseQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  question_type: string;
  explanation: string | null;
  difficulty: string;
  points: number;
  created_at: string;
}

interface DatabaseQuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  completed_at: string;
  time_spent: number;
  total_questions: number;
  answers: any[];
  percentage: number;
  passed: boolean;
}

interface DatabaseUsageTracking {
  id: string;
  user_id: string;
  date: string;
  quizzes_today: number;
  files_uploaded_today: number;
  last_activity: string;
}

// Helper functions to convert between database and app types
const mapDatabaseUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  password: "", // Never return password hash
  createdAt: dbUser.created_at,
  lastLogin: dbUser.last_login || dbUser.created_at,
  isPremium: dbUser.is_premium,
  paymongoCustomerId: dbUser.paymongo_customer_id || undefined,
  subscriptionStatus: dbUser.subscription_status as any,
  planType: dbUser.plan_type as any,
  subscriptionId: dbUser.subscription_id || undefined,
  subscriptionEndDate: dbUser.subscription_end_date || undefined,
});

const mapDatabaseFile = (dbFile: DatabaseUploadedFile): UploadedFile => ({
  id: dbFile.id,
  userId: dbFile.user_id,
  fileName: dbFile.file_name,
  fileType: dbFile.file_type as any,
  fileSize: dbFile.file_size,
  extractedText: dbFile.extracted_text || "",
  uploadDate: dbFile.upload_date,
});

const mapDatabaseQuiz = (dbQuiz: DatabaseQuiz): Quiz => ({
  id: dbQuiz.id,
  userId: dbQuiz.user_id,
  quizType: dbQuiz.quiz_type as any,
  title: dbQuiz.title,
  totalQuestions: dbQuiz.total_questions,
  createdAt: dbQuiz.created_at,
  fileIds: dbQuiz.file_ids,
});

const mapDatabaseQuestion = (dbQuestion: DatabaseQuestion): Question => ({
  id: dbQuestion.id,
  quizId: dbQuestion.quiz_id,
  question: dbQuestion.question,
  options: dbQuestion.options,
  correctAnswer: dbQuestion.correct_answer,
  questionType: dbQuestion.question_type as any,
  explanation: dbQuestion.explanation || undefined,
});

const mapDatabaseResult = (dbResult: DatabaseQuizResult): QuizResult => ({
  id: dbResult.id,
  userId: dbResult.user_id,
  quizId: dbResult.quiz_id,
  score: dbResult.score,
  correctAnswers: dbResult.correct_answers,
  wrongAnswers: dbResult.wrong_answers,
  completedAt: dbResult.completed_at,
  answers: dbResult.answers,
  timeSpent: dbResult.time_spent,
});

// Authentication functions
export const signUp = async (
  email: string,
  password: string,
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  // Profile row is created automatically by your sync_user_profile trigger
  return mapDatabaseUser({
    id: data.user.id,
    email: data.user.email!,
    password_hash: "",
    created_at: data.user.created_at,
    updated_at: data.user.created_at,
    last_login: null,
    is_premium: false,
    paymongo_customer_id: null,
    subscription_status: "free",
    plan_type: "free",
    subscription_id: null,
    subscription_end_date: null,
    email_verified: false,
  });
};

export const signIn = async (
  email: string,
  password: string,
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in failed");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  return mapDatabaseUser(profile);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user data from users table
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return mapDatabaseUser(data);
};

// User management functions
export const updateUser = async (
  id: string,
  updates: Partial<User>,
): Promise<User | null> => {
  // Convert User updates to database format
  const dbUpdates: Partial<DatabaseUser> = {};

  if (updates.paymongoCustomerId)
    dbUpdates.paymongo_customer_id = updates.paymongoCustomerId;
  if (updates.subscriptionStatus)
    dbUpdates.subscription_status = updates.subscriptionStatus;
  if (updates.planType) dbUpdates.plan_type = updates.planType;
  if (updates.subscriptionId)
    dbUpdates.subscription_id = updates.subscriptionId;
  if (updates.subscriptionEndDate)
    dbUpdates.subscription_end_date = updates.subscriptionEndDate;
  if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;

  const { data, error } = await supabase
    .from("users")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;

  return mapDatabaseUser(data);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) return null;

  return mapDatabaseUser(data);
};

// File management functions
export const createFile = async (
  file: Omit<UploadedFile, "id" | "uploadDate">,
): Promise<UploadedFile> => {
  const { data, error } = await supabase
    .from("uploaded_files")
    .insert({
      user_id: file.userId,
      file_name: file.fileName,
      file_type: file.fileType,
      file_size: file.fileSize,
      extracted_text: file.extractedText,
    })
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseFile(data);
};

export const getFilesByUserId = async (
  userId: string,
): Promise<UploadedFile[]> => {
  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("user_id", userId)
    .order("upload_date", { ascending: false });

  if (error) throw error;

  return data.map(mapDatabaseFile);
};

export const deleteFile = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("uploaded_files").delete().eq("id", id);

  return !error;
};

// Quiz management functions
export const createQuiz = async (
  quiz: Omit<Quiz, "id" | "createdAt">,
): Promise<Quiz> => {
  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      user_id: quiz.userId,
      quiz_type: quiz.quizType,
      title: quiz.title,
      total_questions: quiz.totalQuestions,
      file_ids: quiz.fileIds,
    })
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseQuiz(data);
};

export const getQuizzesByUserId = async (userId: string): Promise<Quiz[]> => {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(mapDatabaseQuiz);
};

export const deleteQuiz = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  return !error;
};

// Question management functions - Fixed options guard for b.slice error
export const createQuestions = async (
  questions: Omit<Question, "id">[],
): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .insert(
      questions.map((q) => ({
        quiz_id: q.quizId,
        question: q.question,
        options: (() => {
          if (Array.isArray(q.options)) return q.options;
          if (typeof q.options === "string") {
            try {
              return JSON.parse(q.options);
            } catch {
              return [];
            }
          }
          return [];
        })(),
        correct_answer: q.correctAnswer,
        question_type: q.questionType,
        explanation: q.explanation,
      })),
    )
    .select();

  if (error) throw error;

  return data.map(mapDatabaseQuestion);
};

export const getQuestionsByQuizId = async (
  quizId: string,
): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map(mapDatabaseQuestion);
};

// Quiz results functions
export const createResult = async (
  result: Omit<QuizResult, "id" | "completedAt">,
): Promise<QuizResult> => {
  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      user_id: result.userId,
      quiz_id: result.quizId,
      score: result.score,
      correct_answers: result.correctAnswers,
      wrong_answers: result.wrongAnswers,
      time_spent: result.timeSpent,
      total_questions: result.answers.length,
      answers: result.answers,
    })
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseResult(data);
};

export const getResultsByUserId = async (
  userId: string,
): Promise<QuizResult[]> => {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error) throw error;

  return data.map(mapDatabaseResult);
};

// Usage tracking functions
export const incrementUsage = async (
  userId: string,
  type: "quiz" | "file",
): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  if (type === "quiz") {
    await supabase.rpc("increment_quiz_usage", {
      user_uuid: userId,
      date: today,
    });
  } else {
    await supabase.rpc("increment_file_usage", {
      user_uuid: userId,
      date: today,
    });
  }
};

export const getUserUsage = async (
  userId: string,
): Promise<{
  quizzesToday: number;
  filesUploaded: number;
  date: string;
}> => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("usage_tracking")
    .select("quizzes_today, files_uploaded_today, date")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error || !data) {
    return { quizzesToday: 0, filesUploaded: 0, date: today };
  }

  return {
    quizzesToday: data.quizzes_today,
    filesUploaded: data.files_uploaded_today,
    date: data.date,
  };
};

export const canCreateMoreQuizzes = async (
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("can_create_more_quizzes", {
    user_uuid: userId,
  });

  if (error) throw error;

  return data;
};

export const canUploadMoreFiles = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("can_upload_more_files", {
    user_uuid: userId,
  });

  if (error) throw error;

  return data;
};

// Subscription functions
export const getUserSubscription = async (
  userId: string,
): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    planId: data.plan_id,
    status: data.status as any,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    stripeSubscriptionId: data.paymongo_subscription_id,
    stripeCustomerId: data.paymongo_customer_id,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
};

export const updateUserSubscription = async (
  userId: string,
  subscriptionData: {
    paymongoCustomerId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionId?: string;
    subscriptionEndDate?: string;
  },
): Promise<User | null> => {
  return updateUser(userId, subscriptionData);
};

// Analytics functions
export const getAnalytics = async (): Promise<
  UserAnalytics & { lastUpdated: string }
> => {
  const { data, error } = await supabase.from("user_analytics").select("*");

  if (error) throw error;

  // Calculate totals from all user analytics
  const totals = data.reduce(
    (acc, row) => ({
      totalUsers: acc.totalUsers + 1,
      activeUsersToday:
        acc.activeUsersToday +
        (row.date === new Date().toISOString().split("T")[0] ? 1 : 0),
      totalExams: acc.totalExams + row.quizzes_completed,
      totalQuizzes: acc.totalQuizzes + row.quizzes_created,
      filesUploaded: acc.filesUploaded + row.files_uploaded,
      quizzesCompleted: acc.quizzes_completed,
      averageScore: acc.averageScore + (row.average_score || 0),
    }),
    {
      totalUsers: 0,
      activeUsersToday: 0,
      totalExams: 0,
      totalQuizzes: 0,
      filesUploaded: 0,
      quizzesCompleted: 0,
      averageScore: 0,
      lastUpdated: new Date().toISOString(),
    },
  );

  return totals;
};

// Session management
export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem("studyquiz_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("studyquiz_current_user");
  }
};

// Legacy compatibility functions
export const initDatabase = (): void => {
  // No initialization needed for Supabase
  console.log("Supabase database initialized");
};

export const trackActiveUser = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (user) {
    // Update last activity
    await supabase
      .from("usage_tracking")
      .update({ last_activity: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0]);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

export const clearDatabase = (): void => {
  // Not applicable for Supabase
  console.warn("clearDatabase not applicable for Supabase");
};
