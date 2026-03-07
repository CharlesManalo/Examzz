import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionPlans } from '@/services/stripe';
import { toast } from 'sonner';

const PricingCard: React.FC<{
  plan: typeof subscriptionPlans[0];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
}> = ({ plan, isCurrentPlan, isPopular }) => {
  const { upgradeToPremium, isLoading } = useSubscription();

  const handleUpgrade = async () => {
    if (plan.stripePriceId) {
      try {
        await upgradeToPremium(plan.stripePriceId);
      } catch (error) {
        toast.error('Failed to start upgrade process');
      }
    }
  };

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {plan.id === 'premium' ? (
            <Crown className="w-12 h-12 text-primary" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          )}
        </div>
        
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.id === 'free' ? 'Perfect for getting started' : 'For serious learners'}
        </CardDescription>
        
        <div className="mt-4">
          <span className="text-4xl font-bold">${plan.price}</span>
          {plan.price > 0 && <span className="text-muted-foreground">/{plan.interval}</span>}
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" disabled>
            Current Plan
          </Button>
        ) : plan.price === 0 ? (
          <Button variant="outline" className="w-full" disabled>
            Free Plan
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const PricingSection: React.FC = () => {
  const { isPremium } = useSubscription();

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your learning journey. Upgrade anytime to unlock more features.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {subscriptionPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={
              (plan.id === 'free' && !isPremium) || 
              (plan.id === 'premium' && isPremium)
            }
            isPopular={plan.id === 'premium'}
          />
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          All plans include core quiz features. Cancel premium subscription anytime.
        </p>
      </div>
    </div>
  );
};

export default PricingSection;
