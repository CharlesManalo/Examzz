import React from "react";
import type { ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import UpgradeButton from "@/components/UpgradeButton";

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: "quiz" | "file-upload" | "advanced-analytics" | "export-results";
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { isPremium, usageLimits, incrementUsage } = useSubscription();

  const checkFeatureAccess = () => {
    switch (feature) {
      case "quiz":
        return usageLimits.canCreateMoreQuizzes;
      case "file-upload":
        return usageLimits.canUploadMore;
      case "advanced-analytics":
        return isPremium;
      case "export-results":
        return isPremium;
      default:
        return true;
    }
  };

  const handleFeatureAccess = () => {
    if (!checkFeatureAccess()) {
      if (feature === "quiz") {
        toast.error(
          `Daily quiz limit reached (${usageLimits.quizzesPerDayLimit})`,
          {
            description: "Upgrade to Premium for unlimited quizzes",
            action: showUpgradePrompt
              ? {
                  label: "Upgrade",
                  onClick: () => (window.location.href = "/pricing"),
                }
              : undefined,
          },
        );
      } else if (feature === "file-upload") {
        toast.error(
          `File upload limit reached (${usageLimits.fileUploadsLimit})`,
          {
            description: "Upgrade to Premium for more uploads",
            action: showUpgradePrompt
              ? {
                  label: "Upgrade",
                  onClick: () => (window.location.href = "/pricing"),
                }
              : undefined,
          },
        );
      } else {
        toast.error("Premium feature", {
          description: "Upgrade to Premium to access this feature",
          action: showUpgradePrompt
            ? {
                label: "Upgrade",
                onClick: () => (window.location.href = "/pricing"),
              }
            : undefined,
        });
      }
      return false;
    }
    return true;
  };

  const handleFeatureUse = () => {
    if (feature === "quiz") {
      incrementUsage("quiz");
    } else if (feature === "file-upload") {
      incrementUsage("file");
    }
  };

  if (checkFeatureAccess()) {
    return <div onClick={handleFeatureUse}>{children}</div>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
        <span className="text-2xl">🔒</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-muted-foreground mb-4">
        {feature === "quiz" && "You've reached your daily quiz limit"}
        {feature === "file-upload" && "You've reached your file upload limit"}
        {feature === "advanced-analytics" &&
          "Advanced analytics require Premium"}
        {feature === "export-results" && "Export results require Premium"}
      </p>
      {showUpgradePrompt && <UpgradeButton size="sm" />}
    </div>
  );
};

// Hook for checking feature access
export const useFeatureAccess = () => {
  const { isPremium, usageLimits, incrementUsage } = useSubscription();

  const canCreateQuiz = () => {
    if (!usageLimits.canCreateMoreQuizzes) {
      toast.error(
        `Daily quiz limit reached (${usageLimits.quizzesPerDayLimit})`,
        {
          description: "Upgrade to Premium for unlimited quizzes",
        },
      );
      return false;
    }
    incrementUsage("quiz");
    return true;
  };

  const canUploadFile = () => {
    if (!usageLimits.canUploadMore) {
      toast.error(
        `File upload limit reached (${usageLimits.fileUploadsLimit})`,
        {
          description: "Upgrade to Premium for more uploads",
        },
      );
      return false;
    }
    incrementUsage("file");
    return true;
  };

  const canAccessAdvancedFeatures = () => {
    if (!isPremium) {
      toast.error("Premium feature", {
        description: "Upgrade to Premium to access this feature",
      });
      return false;
    }
    return true;
  };

  return {
    canCreateQuiz,
    canUploadFile,
    canAccessAdvancedFeatures,
    isPremium,
    usageLimits,
  };
};

export default SubscriptionGuard;
