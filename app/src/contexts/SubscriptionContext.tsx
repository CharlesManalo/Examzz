import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { User, UsageLimits } from "@/types";
import { paymongoService } from "@/services/paymongo";
import { getUserUsage } from "@/services/supabase";

// Polling config
const POLL_INTERVAL_MS = 5000; // check every 5 seconds
const POLL_TIMEOUT_MS = 300000; // stop after 5 minutes

interface SubscriptionContextType {
  user: User | null;
  usageLimits: UsageLimits;
  isLoading: boolean;
  isPremium: boolean;
  isPolling: boolean;
  pollTimeRemaining: number;
  upgradeToPremium: () => Promise<void>;
  refreshUser: () => Promise<void>;
  incrementUsage: (type: "quiz" | "file") => void;
  cancelPolling: () => void;
  showEmailConfirm: boolean;
  pendingCheckoutUrl: string | null;
  confirmAndProceed: () => void;
  cancelEmailConfirm: () => void;
  showPaymentModal: boolean;
  paymentComplete: boolean;
  setShowPaymentModal: (show: boolean) => void;
  setPaymentComplete: (complete: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  user,
  onUserUpdate,
}) => {
  const [usageLimits, setUsageLimits] = useState<UsageLimits>({
    quizzesToday: 0,
    filesUploaded: 0,
    quizzesPerDayLimit: 10,
    fileUploadsLimit: 10,
    maxFileSizeLimit: 10,
    canUploadMore: true,
    canCreateMoreQuizzes: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimeRemaining, setPollTimeRemaining] = useState(0);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const pollStartTimeRef = useRef<number>(0);

  const isPremium = paymongoService.isSupporter(user);

  useEffect(() => {
    if (user) {
      loadUsage();
    } else {
      resetUsage();
      stopPolling();
    }
    return () => stopPolling();
  }, [user]);

  const resetUsage = () => {
    setUsageLimits({
      quizzesToday: 0,
      filesUploaded: 0,
      quizzesPerDayLimit: 10,
      fileUploadsLimit: 10,
      maxFileSizeLimit: 10,
      canUploadMore: true,
      canCreateMoreQuizzes: true,
    });
  };

  const loadUsage = async () => {
    if (!user) return;
    try {
      const usage = await getUserUsage(user.id);
      const limits = paymongoService.getLimits(user);
      setUsageLimits({
        quizzesToday: usage.quizzesToday,
        filesUploaded: usage.filesUploaded,
        quizzesPerDayLimit: limits.quizzesPerDay,
        fileUploadsLimit: limits.fileUploads,
        maxFileSizeLimit: limits.maxFileSize,
        canUploadMore: isPremium || usage.filesUploaded < limits.fileUploads,
        canCreateMoreQuizzes:
          isPremium || usage.quizzesToday < limits.quizzesPerDay,
      });
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  };

  const incrementUsage = (type: "quiz" | "file") => {
    setUsageLimits((prev) => {
      if (isPremium) return prev;
      const newQuizzes =
        type === "quiz" ? prev.quizzesToday + 1 : prev.quizzesToday;
      const newFiles =
        type === "file" ? prev.filesUploaded + 1 : prev.filesUploaded;
      return {
        ...prev,
        quizzesToday: newQuizzes,
        filesUploaded: newFiles,
        canCreateMoreQuizzes: newQuizzes < prev.quizzesPerDayLimit,
        canUploadMore: newFiles < prev.fileUploadsLimit,
      };
    });
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsPolling(false);
    setPollTimeRemaining(0);
  };

  const startPolling = (userId: string) => {
    pollStartTimeRef.current = Date.now();
    setIsPolling(true);
    setPollTimeRemaining(POLL_TIMEOUT_MS / 1000);

    // Countdown — updates every second
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pollStartTimeRef.current;
      const remaining = Math.max(
        0,
        Math.ceil((POLL_TIMEOUT_MS - elapsed) / 1000),
      );
      setPollTimeRemaining(remaining);
    }, 1000);

    // Payment check — polls every 5 seconds
    pollIntervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - pollStartTimeRef.current;

      if (elapsed >= POLL_TIMEOUT_MS) {
        stopPolling();
        sessionStorage.setItem("paymongo_poll_expired", "true");
        return;
      }

      try {
        const res = await fetch(
          `/api/paymongo/verify?user_id=${encodeURIComponent(userId)}`,
        );
        const data = await res.json();
        if (data.paid) {
          stopPolling();
          sessionStorage.removeItem("paymongo_user_id");
          sessionStorage.removeItem("paymongo_poll_expired");
          setPaymentComplete(true);
          setShowPaymentModal(true);
          window.dispatchEvent(new CustomEvent("paymongo:payment_success"));
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, POLL_INTERVAL_MS);
  };

  const PAYMONGO_PAGE_URL = "https://paymongo.page/l/examzz-premiumsupporter";

  const upgradeToPremium = async () => {
    if (!user) throw new Error("Please log in to upgrade");
    // No backend call needed — just use the fixed Pages URL
    setPendingCheckoutUrl(PAYMONGO_PAGE_URL);
    sessionStorage.setItem("paymongo_user_id", user.id);
    setShowEmailConfirm(true);
  };

  const confirmAndProceed = () => {
    if (!pendingCheckoutUrl || !user) return;
    setShowEmailConfirm(false);
    setShowPaymentModal(true);
    startPolling(user.id);
    // Open in new tab so our app stays alive and polling continues
    window.open(pendingCheckoutUrl, "_blank");
    setPendingCheckoutUrl(null);
  };

  const cancelEmailConfirm = () => {
    setShowEmailConfirm(false);
    setPendingCheckoutUrl(null);
    sessionStorage.removeItem("paymongo_user_id");
  };

  const refreshUser = async () => {
    await loadUsage();
  };

  const value: SubscriptionContextType = {
    user,
    usageLimits,
    isLoading,
    isPremium,
    isPolling,
    pollTimeRemaining,
    upgradeToPremium,
    refreshUser,
    incrementUsage,
    cancelPolling: stopPolling,
    showEmailConfirm,
    pendingCheckoutUrl,
    confirmAndProceed,
    cancelEmailConfirm,
    showPaymentModal,
    paymentComplete,
    setShowPaymentModal,
    setPaymentComplete,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

export default SubscriptionContext;
