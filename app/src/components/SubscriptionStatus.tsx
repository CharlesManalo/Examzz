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
import { Crown, ArrowUp } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

const SubscriptionStatus: React.FC = () => {
  const { user, isPremium, upgradeToPremium, isLoading } = useSubscription();

  if (!user) return null;

  if (isPremium) {
    return (
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">Supporter</CardTitle>
            <Badge className="bg-violet-600 text-white border-0 text-xs">
              Lifetime
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm">
            You have lifetime access. No ads, unlimited quizzes, forever.
          </CardDescription>
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
            onClick={upgradeToPremium}
            disabled={isLoading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">
          Upgrade to Supporter for unlimited quizzes and no ads — ₱100 one-time.
        </CardDescription>
        <div className="mt-2 text-xs text-muted-foreground">
          Limited to 15 quizzes per day and 10 file uploads.
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
