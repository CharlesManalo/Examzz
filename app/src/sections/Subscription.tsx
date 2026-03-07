import React from "react";
import SubscriptionManagement from "@/components/SubscriptionManagement";
import { ArrowLeft } from "lucide-react";

const Subscription: React.FC = () => {
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
            <h1 className="text-4xl font-bold mb-4">Subscription Management</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your subscription, view your benefits, and upgrade or
              downgrade your plan.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <SubscriptionManagement />
        </div>
      </div>
    </div>
  );
};

export default Subscription;
