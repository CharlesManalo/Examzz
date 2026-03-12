import { useState, useEffect } from "react";
import type { View, User, Quiz, Question, QuizResult } from "@/types";
import {
  getCurrentUser,
  onAuthStateChange,
  trackActiveUser,
  updateUser,
  needsNickname,
} from "@/services/auth";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import NicknamePrompt from "@/components/NicknamePrompt";
import AdModal from "@/components/AdModal";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

// Sections
import Navbar from "@/sections/Navbar";
import Home from "@/sections/Home";
import Login from "@/sections/Login";
import Register from "@/sections/Register";
import Dashboard from "@/sections/Dashboard";
import QuizUpload from "@/components/QuizUpload";
import Exam from "@/sections/Exam";
import Results from "@/sections/Results";
import Review from "@/sections/Review";
import Admin from "@/sections/Admin";
import Pricing from "@/sections/Pricing";
import Footer from "@/sections/Footer";

import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<string | null>(
    null,
  );
  const [adShownThisSession, setAdShownThisSession] = useState(false);

  useEffect(() => {
    const nicknameWasChecked = sessionStorage.getItem("nicknameChecked");

    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUserState(user);
        if (nicknameWasChecked !== "true" && needsNickname(user)) {
          setShowNicknamePrompt(true);
          sessionStorage.setItem("nicknameChecked", "true");
        }
      }
      setIsLoading(false);
      trackActiveUser();
    });

    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUserState(user);
      if (user) {
        trackActiveUser();
        if (
          sessionStorage.getItem("nicknameChecked") !== "true" &&
          needsNickname(user)
        ) {
          setShowNicknamePrompt(true);
          sessionStorage.setItem("nicknameChecked", "true");
        }
      } else {
        sessionStorage.removeItem("nicknameChecked");
      }
    });

    // Listen for PayMongo payment success — reload user to get isPremium = true
    const onPaymentSuccess = () => {
      getCurrentUser().then((user) => {
        if (user) setCurrentUserState({ ...user });
      });
    };
    window.addEventListener("paymongo:payment_success", onPaymentSuccess);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener("paymongo:payment_success", onPaymentSuccess);
    };
  }, []);

  // Navigation
  const navigateTo = (view: View) => {
    const comingFromIndex =
      currentView === "home" ||
      currentView === "login" ||
      currentView === "register";
    const isAppPage = [
      "dashboard",
      "upload",
      "exam",
      "results",
      "review",
      "admin",
    ].includes(view);

    // Show ad only once per session when leaving index pages,
    // but NEVER if user is a Supporter (premium)
    const userIsPremium =
      currentUser?.isPremium === true || currentUser?.planType === "premium";

    if (comingFromIndex && isAppPage && !adShownThisSession && !userIsPremium) {
      setPendingDestination(view);
      setShowAdModal(true);
      setAdShownThisSession(true);
      return;
    }

    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
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
    toast.success("Account created!", { description: "Welcome to EXAMZZ" });
    navigateTo("dashboard");
  };

  const handleNicknameSubmit = async (nickname: string) => {
    if (!currentUser) return;
    try {
      await updateUser(currentUser.id, { nickname });
      const updatedUser = await getCurrentUser();
      if (updatedUser) setCurrentUserState({ ...updatedUser });
      setShowNicknamePrompt(false);
      toast.success("Nickname saved!");
      navigateTo("dashboard");
    } catch (error) {
      console.error("Failed to save nickname:", error);
    }
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

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="text-4xl font-black text-black tracking-wider"
            style={{
              fontFamily:
                'Blanka, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            EXAMZZ
          </div>
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
          <QuizUpload onStartQuiz={startQuiz} onNavigate={navigateTo} />
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

      case "pricing":
        return <Pricing onNavigate={navigateTo} />;

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
    <SubscriptionProvider user={currentUser}>
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
        <NicknamePrompt
          isOpen={showNicknamePrompt}
          onSubmit={handleNicknameSubmit}
          userEmail={currentUser?.email || ""}
        />
        {showAdModal && pendingDestination && (
          <AdModal
            destination={pendingDestination}
            user={currentUser}
            onNavigate={(page) => {
              setCurrentView(page as View);
              setShowAdModal(false);
              setPendingDestination(null);
              window.scrollTo(0, 0);
            }}
            onClose={() => {
              setShowAdModal(false);
              setPendingDestination(null);
            }}
          />
        )}
      </div>
    </SubscriptionProvider>
  );
}

export default App;
