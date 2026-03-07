import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, Subscription, UsageLimits } from "@/types";
import { paymongoService, subscriptionPlans } from "@/services/paymongo";

interface SubscriptionContextType {
  user: User | null;
  subscription: Subscription | null;
  usageLimits: UsageLimits;
  isLoading: boolean;
  isPremium: boolean;
  upgradeToPremium: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkUsageLimits: () => UsageLimits;
  incrementUsage: (type: "quiz" | "file") => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
  user: User | null;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  user,
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits>({
    quizzesToday: 0,
    filesUploaded: 0,
    quizzesPerDayLimit: 15,
    fileUploadsLimit: 10,
    maxFileSizeLimit: 10,
    canUploadMore: true,
    canCreateMoreQuizzes: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = paymongoService.isSubscriptionActive(user);

  // Fetch subscription status when user changes
  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setSubscription(null);
      updateUsageLimits();
    }
  }, [user]);

  const updateUsageLimits = () => {
    const limits = paymongoService.getSubscriptionLimits(user);
    const todayUsage = getTodayUsage(); // This would come from your database/localStorage

    setUsageLimits({
      quizzesToday: todayUsage.quizzes,
      filesUploaded: todayUsage.files,
      quizzesPerDayLimit: limits.quizzesPerDay,
      fileUploadsLimit: limits.fileUploads,
      maxFileSizeLimit: limits.maxFileSize,
      canUploadMore: todayUsage.files < limits.fileUploads,
      canCreateMoreQuizzes: todayUsage.quizzes < limits.quizzesPerDay,
    });
  };

  const getTodayUsage = () => {
    // This would typically come from your database
    // For now, using localStorage as a simple example
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`usage_${user?.id}`);

    if (stored) {
      const usage = JSON.parse(stored);
      if (usage.date === today) {
        return usage;
      }
    }

    return { quizzes: 0, files: 0, date: today };
  };

  const incrementUsage = (type: "quiz" | "file") => {
    const usage = getTodayUsage();
    if (type === "quiz") {
      usage.quizzes++;
    } else {
      usage.files++;
    }

    localStorage.setItem(`usage_${user?.id}`, JSON.stringify(usage));
    updateUsageLimits();
  };

  const refreshSubscription = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const sub = await paymongoService.getSubscriptionStatus(user.id);
      setSubscription(sub);
      updateUsageLimits();
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    if (!user) throw new Error("User not authenticated");

    setIsLoading(true);
    try {
      await paymongoService.createCheckout({
        amount: 95, // 95 PHP
        description: "Premium Plan - ₱95/month",
        userId: user.id,
        userEmail: user.email,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const manageSubscription = async () => {
    // PayMongo doesn't have a customer portal like Stripe
    // Redirect to subscription management page
    window.location.href = "/subscription";
  };

  const cancelSubscription = async () => {
    if (!subscription) throw new Error("No active subscription found");

    setIsLoading(true);
    try {
      await paymongoService.cancelSubscription(subscription.id);
      await refreshSubscription();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsageLimits = (): UsageLimits => {
    updateUsageLimits();
    return usageLimits;
  };

  const value: SubscriptionContextType = {
    user,
    subscription,
    usageLimits,
    isLoading,
    isPremium,
    upgradeToPremium,
    manageSubscription,
    cancelSubscription,
    refreshSubscription,
    checkUsageLimits,
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
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

export default SubscriptionContext;
