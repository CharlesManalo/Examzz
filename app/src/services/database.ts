import type { User, UploadedFile, Quiz, Question, QuizResult, UserAnalytics } from '@/types';

const DB_KEYS = {
  USERS: 'studyquiz_users',
  FILES: 'studyquiz_files',
  QUIZZES: 'studyquiz_quizzes',
  QUESTIONS: 'studyquiz_questions',
  RESULTS: 'studyquiz_results',
  ANALYTICS: 'studyquiz_analytics',
  CURRENT_USER: 'studyquiz_current_user',
  SESSION: 'studyquiz_session'
};

export const initDatabase = () => {
  Object.values(DB_KEYS).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
  
  const analytics = localStorage.getItem(DB_KEYS.ANALYTICS);
  if (!analytics || JSON.parse(analytics).length === 0) {
    localStorage.setItem(DB_KEYS.ANALYTICS, JSON.stringify({
      totalUsers: 0,
      activeUsersToday: 0,
      totalExams: 0,
      totalQuizzes: 0,
      filesUploaded: 0,
      quizzesCompleted: 0,
      averageScore: 0,
      lastUpdated: new Date().toISOString()
    }));
  }
};

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  updateAnalytics({ totalUsers: users.length });
  return newUser;
};

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  return users[index];
};

export const createFile = (file: Omit<UploadedFile, 'id' | 'uploadDate'>): UploadedFile => {
  const files = getFiles();
  const newFile: UploadedFile = {
    ...file,
    id: generateId(),
    uploadDate: new Date().toISOString()
  };
  files.push(newFile);
  localStorage.setItem(DB_KEYS.FILES, JSON.stringify(files));
  updateAnalytics({ filesUploaded: files.length });
  return newFile;
};

export const getFiles = (): UploadedFile[] => {
  return JSON.parse(localStorage.getItem(DB_KEYS.FILES) || '[]');
};

export const getFilesByUserId = (userId: string): UploadedFile[] => {
  return getFiles().filter(f => f.userId === userId);
};

export const deleteFile = (id: string): boolean => {
  const files = getFiles();
  const filtered = files.filter(f => f.id !== id);
  localStorage.setItem(DB_KEYS.FILES, JSON.stringify(filtered));
  return filtered.length < files.length;
};

export const createQuiz = (quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz => {
  const quizzes = getQuizzes();
  const newQuiz: Quiz = {
    ...quiz,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  quizzes.push(newQuiz);
  localStorage.setItem(DB_KEYS.QUIZZES, JSON.stringify(quizzes));
  updateAnalytics({ totalQuizzes: quizzes.length });
  return newQuiz;
};

export const getQuizzes = (): Quiz[] => {
  return JSON.parse(localStorage.getItem(DB_KEYS.QUIZZES) || '[]');
};

export const getQuizzesByUserId = (userId: string): Quiz[] => {
  return getQuizzes().filter(q => q.userId === userId);
};

export const getQuizById = (id: string): Quiz | undefined => {
  return getQuizzes().find(q => q.id === id);
};

export const deleteQuiz = (id: string): boolean => {
  const quizzes = getQuizzes();
  const filtered = quizzes.filter(q => q.id !== id);
  localStorage.setItem(DB_KEYS.QUIZZES, JSON.stringify(filtered));
  return filtered.length < quizzes.length;
};

export const createQuestions = (questions: Omit<Question, 'id'>[]): Question[] => {
  const existingQuestions = getQuestions();
  const newQuestions: Question[] = questions.map(q => ({
    ...q,
    id: generateId()
  }));
  existingQuestions.push(...newQuestions);
  localStorage.setItem(DB_KEYS.QUESTIONS, JSON.stringify(existingQuestions));
  return newQuestions;
};

export const getQuestions = (): Question[] => {
  return JSON.parse(localStorage.getItem(DB_KEYS.QUESTIONS) || '[]');
};

export const getQuestionsByQuizId = (quizId: string): Question[] => {
  return getQuestions().filter(q => q.quizId === quizId);
};

export const createResult = (result: Omit<QuizResult, 'id' | 'completedAt'>): QuizResult => {
  const results = getResults();
  const newResult: QuizResult = {
    ...result,
    id: generateId(),
    completedAt: new Date().toISOString()
  };
  results.push(newResult);
  localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(results));
  
  const allResults = getResults();
  const avgScore = allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;
  updateAnalytics({ 
    quizzesCompleted: results.length,
    averageScore: Math.round(avgScore)
  });
  
  return newResult;
};

export const getResults = (): QuizResult[] => {
  return JSON.parse(localStorage.getItem(DB_KEYS.RESULTS) || '[]');
};

export const getResultsByUserId = (userId: string): QuizResult[] => {
  return getResults().filter(r => r.userId === userId);
};

export const getResultsByQuizId = (quizId: string): QuizResult[] => {
  return getResults().filter(r => r.quizId === quizId);
};

export const getAnalytics = (): UserAnalytics & { lastUpdated: string } => {
  return JSON.parse(localStorage.getItem(DB_KEYS.ANALYTICS) || '{}');
};

export const updateAnalytics = (updates: Partial<UserAnalytics>) => {
  const current = getAnalytics();
  const updated = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(DB_KEYS.ANALYTICS, JSON.stringify(updated));
};

export const trackActiveUser = () => {
  const today = new Date().toDateString();
  const sessionKey = `active_${today}`;
  const currentSession = sessionStorage.getItem(sessionKey);
  
  if (!currentSession) {
    sessionStorage.setItem(sessionKey, '1');
    const analytics = getAnalytics();
    updateAnalytics({ activeUsersToday: (analytics.activeUsersToday || 0) + 1 });
  }
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    sessionStorage.setItem(DB_KEYS.SESSION, JSON.stringify({ 
      userId: user.id, 
      loginTime: new Date().toISOString() 
    }));
  } else {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    sessionStorage.removeItem(DB_KEYS.SESSION);
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(DB_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const clearDatabase = () => {
  Object.values(DB_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initDatabase();
};
