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
import { Crown, Check } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

const SubscriptionManagement: React.FC = () => {
  const { user, isPremium, upgradeToPremium, isLoading } = useSubscription();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to manage your subscription.</p>
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <div className="space-y-6">
        {/* Supporter Status */}
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-violet-600" />
                <CardTitle>Supporter Plan</CardTitle>
                <Badge className="bg-violet-600 text-white border-0">
                  Lifetime
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              You made a one-time payment for lifetime access. No renewals, no
              expiry — ever.
            </p>
            <div className="bg-white rounded-lg border border-violet-100 px-4 py-3 text-sm text-violet-700 font-medium">
              ✅ Lifetime access active
            </div>

            {/* Personal Message from Developer */}
            <div className="bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">CM</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-violet-900 mb-1">
                    Message by the Developer (Charles Manalo)
                  </h4>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Hello {user?.nickname || "Supporter"}! My name is Charles
                    Manalo, founder/developer of
                    <span
                      className="font-bold"
                      style={{ fontFamily: "Blanka, sans-serif" }}
                    >
                      {" "}
                      Examzz
                    </span>
                    . This subscription will help me add more features and keep
                    the platform running. Thank you sincerely for your support!
                  </p>
                  <p className="text-xs text-violet-600 mt-2 italic">
                    — Charles Manalo
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle>Your Supporter Benefits</CardTitle>
            <CardDescription>
              Everything included in your lifetime plan:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Unlimited quizzes forever",
                "No advertisements",
                "Unlimited file uploads",
                "Priority support",
                "50MB max file size",
                "Supporter badge",
                "Supports Charles Manalo (Developer)",
              ].map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
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
            You're currently on the free plan. Become a Supporter for lifetime
            access to all features.
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
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={upgradeToPremium}
            disabled={isLoading}
          >
            <Crown className="w-4 h-4 mr-2" />
            Become a Supporter — ₱100 lifetime
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Free Plan Features</CardTitle>
          <CardDescription>What's included in your free plan:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              "15 quizzes per day",
              "Basic quiz creation",
              "File upload support",
              "Basic analytics",
            ].map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
