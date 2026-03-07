import React from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

interface UpgradeButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  className = "",
  size = "default",
  variant = "default",
}) => {
  const { isPremium, upgradeToPremium, isLoading } = useSubscription();

  if (isPremium) {
    return null; // Don't show upgrade button for premium users
  }

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
    } catch (error) {
      toast.error("Failed to start upgrade process");
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 ${className}`}
      size={size}
      variant={variant}
    >
      <Crown className="w-4 h-4 mr-2" />
      {isLoading ? "Processing..." : "Upgrade to Premium"}
    </Button>
  );
};

export default UpgradeButton;
