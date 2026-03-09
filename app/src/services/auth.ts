import { supabase } from "./supabase";
import type {
  User,
  UploadedFile,
  Quiz,
  Question,
  QuizResult,
  UserAnalytics,
  Subscription,
} from "@/types";

// Database types based on Supabase schema
interface DatabaseUser {
  id: string;
  email: string;
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

// Helper functions to convert between database and app types
const mapAuthUserToAppUser = (authUser: any, dbUser?: DatabaseUser): User => ({
  id: authUser.id,
  email: authUser.email || "",
  password: "", // Never return password hash
  createdAt: authUser.created_at,
  lastLogin: dbUser?.last_login || authUser.created_at,
  isPremium: dbUser?.is_premium || false,
  paymongoCustomerId: dbUser?.paymongo_customer_id || undefined,
  subscriptionStatus: (dbUser?.subscription_status as any) || null,
  planType: (dbUser?.plan_type as any) || "free",
  subscriptionId: dbUser?.subscription_id || undefined,
  subscriptionEndDate: dbUser?.subscription_end_date || undefined,
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

// Authentication functions using Supabase Auth
export const signUp = async (
  email: string,
  password: string,
): Promise<User> => {
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/login`,
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Failed to create user");

  // User profile is created automatically by the sync_user_profile trigger
  // Just return the mapped user data
  return mapAuthUserToAppUser(authData.user, null);
};

export const signIn = async (
  email: string,
  password: string,
): Promise<User> => {
  // Sign in with Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Failed to sign in");

  // Get or create user profile
  let { data: dbUser, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (dbError && dbError.code === "PGRST116") {
    // User doesn't exist in our table, create profile
    const { data: newDbUser, error: createError } = await supabase
      .from("users")
      .upsert(
        {
          id: authData.user.id,
          email: authData.user.email,
          is_premium: false,
          paymongo_customer_id: null,
          subscription_status: "free",
          plan_type: "basic",
          subscription_id: null,
          subscription_end_date: null,
          email_verified: authData.user.email_confirmed_at ? true : false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (createError) throw createError;
    dbUser = newDbUser;
  } else if (dbError) {
    throw dbError;
  }

  // Update last login
  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", authData.user.id);

  return mapAuthUserToAppUser(authData.user, dbUser);
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Get current auth user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  // Get user profile from our users table
  const { data: dbUser, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (dbError) {
    // Create profile if it doesn't exist
    const { data: newDbUser, error: createError } = await supabase
      .from("users")
      .upsert(
        {
          id: authUser.id,
          email: authUser.email,
          is_premium: false,
          subscription_status: "free",
          plan_type: "free",
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (createError) return null;
    return mapAuthUserToAppUser(authUser, newDbUser);
  }

  return mapAuthUserToAppUser(authUser, dbUser);
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
};

// Google OAuth functions
export const signInWithGoogle = async (): Promise<void> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  // This will redirect to Google OAuth, user will be handled by the auth state change listener
};

export const signUpWithGoogle = async (): Promise<void> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  // This will redirect to Google OAuth, user will be handled by the auth state change listener
};

// Session management
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  let mounted = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!mounted) return; // Prevent updates if component unmounted

    if (session?.user) {
      const user = await getCurrentUser();
      if (mounted) {
        callback(user);
      }
    } else {
      if (mounted) {
        callback(null);
      }
    }
  });

  // Return cleanup function
  return () => {
    mounted = false;
    subscription?.unsubscribe();
  };
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

  // Get auth user to return complete User object
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return null;

  return mapAuthUserToAppUser(authUser.user, data);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  // This is mainly for admin purposes - use auth for regular login
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) return null;

  return mapAuthUserToAppUser(
    { id: data.id, email: data.email, created_at: data.created_at },
    data,
  );
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

// Question management functions
export const createQuestions = async (
  questions: Omit<Question, "id">[],
): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .insert(
      questions.map((q) => ({
        quiz_id: q.quizId,
        question: q.question,
        options: q.options,
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

// Session management (legacy compatibility)
export const setCurrentUser = (user: User | null): void => {
  // With Supabase Auth, we don't need to manually manage localStorage
  // The session is handled automatically by Supabase
  console.log("Session managed by Supabase Auth");
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
};
