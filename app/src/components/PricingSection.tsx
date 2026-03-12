import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { subscriptionPlans } from "@/services/paymongo";
import { toast } from "sonner";

const PricingSection: React.FC<{
  onNavigate?: (view: string) => void;
  onUpgrade?: () => void;
}> = ({ onNavigate, onUpgrade }) => {
  const { isPremium, upgradeToPremium, isLoading } = useSubscription();

  const handleUpgrade = async () => {
    try {
      if (onUpgrade) {
        onUpgrade();
      } else {
        await upgradeToPremium();
      }
    } catch (error) {
      toast.error("Failed to start payment. Please try again.");
    }
  };

  return (
    <div className="py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-violet-100 text-violet-700 border-0">
          Pricing
        </Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Simple, honest pricing
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          One plan. One payment. Lifetime access. No subscriptions, no renewals.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Plan */}
        <Card className="border border-gray-200">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📚</span>
            </div>
            <CardTitle className="text-xl">Free</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">₱0</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">Always free</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {subscriptionPlans[0].features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {!isPremium ? "Current Plan" : "Free Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Supporter Plan */}
        <Card className="border-2 border-violet-500 shadow-lg shadow-violet-100 relative">
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 px-3">
              <Sparkles className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          </div>

          <CardHeader className="text-center pb-4 pt-6">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-violet-600" />
            </div>
            <CardTitle className="text-xl text-violet-700">Supporter</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">₱100</span>
            </div>
            <p className="text-sm text-violet-500 font-medium mt-1">
              One-time · Lifetime access
            </p>
          </CardHeader>

          <CardContent>
            <ul className="space-y-2">
              {subscriptionPlans[1].features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            {isPremium ? (
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                disabled
              >
                <Crown className="w-4 h-4 mr-2" />
                You're a Supporter ✓
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Redirecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Become a Supporter — ₱100
                  </span>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Trust note */}
      <div className="text-center mt-10 space-y-1">
        <p className="text-sm text-gray-400">
          🔒 Secure payment via PayMongo · GCash · Maya · QR Ph · GrabPay
        </p>
        <p className="text-xs text-gray-400">
          Pay once. Use forever. No hidden charges.
        </p>
      </div>
    </div>
  );
};

export default PricingSection;
