import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, ArrowUp, Settings } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

const SubscriptionStatus: React.FC = () => {
  const { user, subscription, isPremium, manageSubscription, isLoading } =
    useSubscription();

  if (!user) {
    return null;
  }

  const handleManageSubscription = async () => {
    try {
      await manageSubscription();
    } catch (error) {
      toast.error("Failed to open subscription management");
    }
  };

  if (isPremium && subscription) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Premium Plan</CardTitle>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={isLoading}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm">
            Your premium subscription is active. Enjoy unlimited quizzes and all
            premium features!
          </CardDescription>
          <div className="mt-2 text-xs text-muted-foreground">
            {subscription.cancelAtPeriodEnd ? (
              <span className="text-orange-500">
                Cancels on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            ) : (
              <span>
                Renews on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
              <span className="text-xs">📚</span>
            </div>
            <CardTitle className="text-lg">Free Plan</CardTitle>
            <Badge variant="secondary">Free</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = "/pricing")}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">
          You're on the free plan. Upgrade to Premium for unlimited quizzes and
          more features.
        </CardDescription>
        <div className="mt-2 text-xs text-muted-foreground">
          Limited to 15 quizzes per day and 10 file uploads.
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
