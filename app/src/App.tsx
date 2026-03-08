import { useState, useEffect } from "react";
import type { View, User, Quiz, Question, QuizResult } from "@/types";
import {
  getCurrentUser,
  onAuthStateChange,
  trackActiveUser,
} from "@/services/auth";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Sections
import Navbar from "@/sections/Navbar";
import Home from "@/sections/Home";
import Login from "@/sections/Login";
import Register from "@/sections/Register";
import Dashboard from "@/sections/Dashboard";
import Upload from "@/sections/Upload";
import Exam from "@/sections/Exam";
import Results from "@/sections/Results";
import Review from "@/sections/Review";
import Admin from "@/sections/Admin";
import Footer from "@/sections/Footer";

// Assets - temporarily using text logo instead of image

import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth and check for existing session
  useEffect(() => {
    // Check for existing session on mount
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUserState(user);
      }
      setIsLoading(false);
      trackActiveUser();
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setCurrentUserState(user);
      if (user) {
        trackActiveUser();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Navigation handlers
  const navigateTo = (view: View) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
    // Auth state is managed by Supabase, no need to manually set
    toast.success("Welcome back!", {
      description: `Logged in as ${user.email}`,
    });
    navigateTo("dashboard");
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentQuiz(null);
    setCurrentQuestions([]);
    setCurrentResult(null);
    toast.info("Logged out successfully");
    navigateTo("home");
  };

  const handleRegister = (user: User) => {
    // Auth state is managed by Supabase, no need to manually set
    toast.success("Account created!", {
      description: "Welcome to StudyQuiz Pro",
    });
    navigateTo("dashboard");
  };

  const startQuiz = (quiz: Quiz, questions: Question[]) => {
    setCurrentQuiz(quiz);
    setCurrentQuestions(questions);
    navigateTo("exam");
  };

  const finishQuiz = (result: QuizResult) => {
    setCurrentResult(result);
    navigateTo("results");
  };

  const reviewQuiz = (result: QuizResult, questions: Question[]) => {
    setCurrentResult(result);
    setCurrentQuestions(questions);
    navigateTo("review");
  };

  // Render current view
  const renderView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-3xl font-bold text-black">Examzz</div>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        return <Home onNavigate={navigateTo} isAuthenticated={!!currentUser} />;

      case "login":
        return currentUser ? (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        ) : (
          <Login onNavigate={navigateTo} onLogin={handleLogin} />
        );

      case "register":
        return currentUser ? (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        ) : (
          <Register onNavigate={navigateTo} onRegister={handleRegister} />
        );

      case "dashboard":
        return currentUser ? (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        ) : (
          <Login onNavigate={navigateTo} onLogin={handleLogin} />
        );

      case "upload":
        return currentUser ? (
          <Upload
            onNavigate={navigateTo}
            user={currentUser}
            onStartQuiz={startQuiz}
          />
        ) : (
          <Login onNavigate={navigateTo} onLogin={handleLogin} />
        );

      case "exam":
        return currentUser && currentQuiz && currentQuestions.length > 0 ? (
          <Exam
            quiz={currentQuiz}
            questions={currentQuestions}
            onFinish={finishQuiz}
            onNavigate={navigateTo}
          />
        ) : (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser!}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        );

      case "results":
        return currentUser && currentResult ? (
          <Results
            result={currentResult}
            questions={currentQuestions}
            onNavigate={navigateTo}
            onReview={() => reviewQuiz(currentResult, currentQuestions)}
          />
        ) : (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser!}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        );

      case "review":
        return currentUser && currentResult ? (
          <Review
            result={currentResult}
            questions={currentQuestions}
            onNavigate={navigateTo}
          />
        ) : (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser!}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        );

      case "admin":
        return currentUser?.email === "admin@studyquiz.com" ? (
          <Admin onNavigate={navigateTo} />
        ) : (
          <Dashboard
            onNavigate={navigateTo}
            user={currentUser!}
            onLogout={handleLogout}
            onStartQuiz={startQuiz}
          />
        );

      default:
        return <Home onNavigate={navigateTo} isAuthenticated={!!currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        isAuthenticated={!!currentUser}
        onLogout={handleLogout}
        user={currentUser}
      />
      <main className="flex-1">{renderView()}</main>
      <Footer onNavigate={navigateTo} />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
