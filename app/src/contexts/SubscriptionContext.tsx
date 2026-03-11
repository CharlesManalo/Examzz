import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, UsageLimits } from "@/types";
import { paymongoService, subscriptionPlans } from "@/services/paymongo";
import { getUserUsage } from "@/services/supabase";

interface SubscriptionContextType {
  user: User | null;
  usageLimits: UsageLimits;
  isLoading: boolean;
  isPremium: boolean;
  upgradeToPremium: () => Promise<void>;
  refreshUser: () => Promise<void>;
  incrementUsage: (type: "quiz" | "file") => void;
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

  const isPremium = paymongoService.isSupporter(user);

  useEffect(() => {
    if (user) {
      loadUsage();
    } else {
      resetUsage();
    }
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
      if (isPremium) return prev; // premium has no limits
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

  const upgradeToPremium = async () => {
    if (!user) throw new Error("Please log in to upgrade");
    setIsLoading(true);
    try {
      const result = await paymongoService.createPaymentLink({
        userId: user.id,
        userEmail: user.email,
      });
      // Save link_id to sessionStorage so we can verify on return
      sessionStorage.setItem("paymongo_link_id", result.link_id);
      sessionStorage.setItem("paymongo_user_id", user.id);
      // Redirect to PayMongo checkout
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error("Failed to start payment:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUsage();
  };

  const value: SubscriptionContextType = {
    user,
    usageLimits,
    isLoading,
    isPremium,
    upgradeToPremium,
    refreshUser,
    incrementUsage,
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
