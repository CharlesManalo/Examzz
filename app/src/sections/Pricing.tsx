import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PricingSection from '@/components/PricingSection';
import { ArrowLeft } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan for your learning journey. Start free and upgrade anytime.
            </p>
          </div>
        </div>

        <PricingSection />

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>30-Day Money Back Guarantee</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Try Premium risk-free. If you're not satisfied, cancel within 30 days for a full refund.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>• All prices are in USD • Cancel anytime • No hidden fees</p>
          <p className="mt-2">• Secure payments powered by Stripe • Your data is always protected</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
