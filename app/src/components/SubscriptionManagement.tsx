import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, CreditCard, Settings, Trash2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

const SubscriptionManagement: React.FC = () => {
  const {
    user,
    subscription,
    isPremium,
    manageSubscription,
    cancelSubscription,
    isLoading,
  } = useSubscription();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to manage your subscription.</p>
        </CardContent>
      </Card>
    );
  }

  const handleManageSubscription = async () => {
    try {
      await manageSubscription();
    } catch (error) {
      toast.error("Failed to open subscription management");
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (
      window.confirm(
        "Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.",
      )
    ) {
      try {
        await cancelSubscription();
        toast.success(
          "Subscription will be canceled at the end of your billing period",
        );
      } catch (error) {
        toast.error("Failed to cancel subscription");
      }
    }
  };

  if (isPremium && subscription) {
    return (
      <div className="space-y-6">
        {/* Current Subscription Status */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-primary" />
                <CardTitle>Premium Plan</CardTitle>
                <Badge variant="default" className="bg-green-500">
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
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
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {subscription.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}:{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  ID: {subscription.stripeSubscriptionId.slice(-8)}
                </span>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  Your subscription will cancel on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  . You can reactivate anytime before then.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle>Your Premium Benefits</CardTitle>
            <CardDescription>
              You're enjoying all these premium features:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Unlimited quizzes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">No advertisements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Advanced analytics</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">15 file uploads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">50MB max file size</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Actions that will affect your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cancel Subscription</h4>
                  <p className="text-sm text-muted-foreground">
                    Cancel your subscription and lose access to premium features
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={isLoading || subscription.cancelAtPeriodEnd}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {subscription.cancelAtPeriodEnd
                    ? "Already Canceling"
                    : "Cancel"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Free plan user
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
              <span className="text-xs">📚</span>
            </div>
            <CardTitle>Free Plan</CardTitle>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            You're currently on the free plan. Upgrade to Premium to unlock more
            features.
          </CardDescription>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Daily quiz limit:</span>
              <span className="font-medium">15 quizzes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>File uploads:</span>
              <span className="font-medium">10 files</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Max file size:</span>
              <span className="font-medium">10MB</span>
            </div>
          </div>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={() => (window.location.href = "/pricing")}
          >
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>

      {/* Available Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>
            Features included in your free plan:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">15 quizzes per day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Basic quiz creation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">File upload support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Basic analytics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
