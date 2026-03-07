import axios from 'axios';
import type { User, SubscriptionPlan, Subscription } from '@/types';

// PayMongo API configuration
const PAYMONGO_API_BASE_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || 'pk_test_...';

export interface CreateCheckoutRequest {
  amount: number;
  description: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface PayMongoCheckout {
  id: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    checkout_url: string;
    reference_number: string;
    status: string;
    payment_method_types: string[];
    line_items: Array<{
      name: string;
      amount: number;
      quantity: number;
      currency: string;
    }>;
    metadata: Record<string, string>;
  };
}

interface PayMongoCustomer {
  id: string;
  attributes: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at: number;
    updated_at: number;
  };
}

interface PayMongoSubscription {
  id: string;
  attributes: {
    status: string;
    created_at: number;
    updated_at: number;
    currency: string;
    amount: number;
    description: string;
    line_items: Array<{
      name: string;
      amount: number;
      quantity: number;
      currency: string;
    }>;
    customer: string;
    payment_method: string;
    metadata: Record<string, string>;
  };
}

class PayMongoService {
  private getAuthHeaders() {
    const authKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY || 'sk_test_...';
    return {
      'Authorization': `Basic ${btoa(authKey + ':')}`,
      'Content-Type': 'application/json',
    };
  }

  private getPublicAuthHeaders() {
    return {
      'Authorization': `Basic ${btoa(PAYMONGO_PUBLIC_KEY + ':')}`,
      'Content-Type': 'application/json',
    };
  }

  async createCheckout(request: CreateCheckoutRequest): Promise<{ checkoutUrl: string; checkoutId: string }> {
    try {
      const response = await fetch('/.netlify/functions/create-paymongo-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayMongo checkout');
      }

      const checkout = await response.json();
      
      // Redirect to PayMongo checkout
      window.location.href = checkout.checkout_url;

      return checkout;
    } catch (error) {
      console.error('Error creating PayMongo checkout:', error);
      throw error;
    }
  }

  async createCustomer(customer: CreateCustomerRequest): Promise<PayMongoCustomer> {
    try {
      const response = await axios.post(
        `${PAYMONGO_API_BASE_URL}/customers`,
        { data: { attributes: customer } },
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error creating PayMongo customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<PayMongoCustomer | null> {
    try {
      const response = await axios.get(
        `${PAYMONGO_API_BASE_URL}/customers/${customerId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching PayMongo customer:', error);
      return null;
    }
  }

  async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(`/.netlify/functions/get-paymongo-subscription?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch('/.netlify/functions/cancel-paymongo-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Helper method to check if user has active subscription
  isSubscriptionActive(user: User | null): boolean {
    if (!user) return false;
    return user.subscriptionStatus === 'active' && user.planType === 'premium';
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
        features: ['unlimited-quizzes', 'no-ads', 'advanced-analytics', 'priority-support'],
      };
    }

    return {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10, // 10MB
      features: ['basic-quizzes', 'ads-supported'],
    };
  }

  // Process webhook events
  async processWebhook(event: any): Promise<void> {
    try {
      const response = await fetch('/.netlify/functions/paymongo-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to process webhook');
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymongoService = new PayMongoService();

// Export subscription plans configuration with PHP pricing
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    interval: 'month',
    stripePriceId: '', // Not used for PayMongo
    features: [
      '15 quizzes per day',
      'Basic quiz creation',
      'File upload support',
      'Ads supported',
      'Basic analytics',
    ],
    limits: {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10,
      features: ['basic-quizzes', 'file-upload', 'basic-analytics'],
    },
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 95, // 95 PHP per month
    interval: 'month',
    stripePriceId: '', // Not used for PayMongo
    features: [
      'Unlimited quizzes',
      'No advertisements',
      'Advanced analytics',
      'Priority support',
      '15 file uploads',
      '50MB max file size',
      'Export results',
      'Custom themes',
    ],
    limits: {
      quizzesPerDay: Infinity,
      fileUploads: 15,
      maxFileSize: 50,
      features: ['unlimited-quizzes', 'no-ads', 'advanced-analytics', 'priority-support', 'export-results', 'custom-themes'],
    },
  },
];

export default paymongoService;
