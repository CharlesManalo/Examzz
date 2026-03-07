import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import type { User, SubscriptionPlan, Subscription } from "@/types";

// Initialize Stripe with your publishable key
// In production, this should come from environment variables
const stripePromise = loadStripe("pk_test_51234567890abcdef"); // Replace with your actual publishable key

export interface CreateCheckoutSessionRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerPortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    try {
      this.stripe = await stripePromise;
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
    }
  }

  async createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new Error("Stripe not initialized");
    }

    try {
      const response = await fetch(
        "/.netlify/functions/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const session = await response.json();

      // Redirect to Stripe Checkout using the session URL
      window.location.href = session.url;

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }

  async createCustomerPortalSession(
    request: CreateCustomerPortalSessionRequest,
  ): Promise<string> {
    try {
      const response = await fetch(
        "/.netlify/functions/create-customer-portal-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create customer portal session");
      }

      const session = await response.json();
      return session.url;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      throw error;
    }
  }

  async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(
        `/.netlify/functions/get-subscription-status?userId=${userId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to get subscription status");
      }

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      console.error("Error getting subscription status:", error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch("/.netlify/functions/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string,
  ): Promise<void> {
    try {
      const response = await fetch("/.netlify/functions/update-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId, priceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }

  // Helper method to check if user has active subscription
  isSubscriptionActive(user: User | null): boolean {
    if (!user) return false;
    return user.subscriptionStatus === "active" && user.planType === "premium";
  }

  // Helper method to get subscription limits
  getSubscriptionLimits(user: User | null): {
    quizzesPerDay: number;
    fileUploads: number;
    maxFileSize: number;
    features: string[];
  } {
    if (this.isSubscriptionActive(user)) {
      return {
        quizzesPerDay: Infinity,
        fileUploads: 15,
        maxFileSize: 50, // 50MB
        features: [
          "unlimited-quizzes",
          "no-ads",
          "advanced-analytics",
          "priority-support",
        ],
      };
    }

    return {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10, // 10MB
      features: ["basic-quizzes", "ads-supported"],
    };
  }
}

// Export singleton instance
export const stripeService = new StripeService();

// Export subscription plans configuration
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free Plan",
    price: 0,
    interval: "month",
    stripePriceId: "", // Free plans don't have Stripe price IDs
    features: [
      "15 quizzes per day",
      "Basic quiz creation",
      "File upload support",
      "Ads supported",
      "Basic analytics",
    ],
    limits: {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10,
      features: ["basic-quizzes", "file-upload", "basic-analytics"],
    },
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 5,
    interval: "month",
    stripePriceId: "price_1Hh1234567890abcdef", // Replace with your actual Stripe price ID
    features: [
      "Unlimited quizzes",
      "No advertisements",
      "Advanced analytics",
      "Priority support",
      "15 file uploads",
      "50MB max file size",
      "Export results",
      "Custom themes",
    ],
    limits: {
      quizzesPerDay: Infinity,
      fileUploads: 15,
      maxFileSize: 50,
      features: [
        "unlimited-quizzes",
        "no-ads",
        "advanced-analytics",
        "priority-support",
        "export-results",
        "custom-themes",
      ],
    },
  },
];

export default stripeService;
