import type { User, SubscriptionPlan } from "@/types";

export interface CreatePaymentLinkRequest {
  userId: string;
  userEmail: string;
}

export interface PaymentLinkResponse {
  link_id: string;
  checkout_url: string;
  reference_number: string;
}

export interface PaymentVerifyResponse {
  status: string;
  paid: boolean;
  amount: number;
  payment_id: string | null;
}

class PayMongoService {
  // Create a ₱100 one-time payment link via our Vercel backend
  async createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResponse> {
    const response = await fetch("/api/paymongo/create-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create payment link");
    }

    return response.json();
  }

  // Poll payment status after redirect back — called on success page
  async verifyPayment(
    linkId: string,
    userId: string,
  ): Promise<PaymentVerifyResponse> {
    const response = await fetch(
      `/api/paymongo/verify?link_id=${encodeURIComponent(linkId)}&user_id=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to verify payment");
    }

    return response.json();
  }

  // Check if user is a Supporter (lifetime premium)
  isSupporter(user: User | null): boolean {
    if (!user) return false;
    return user.isPremium === true || user.planType === "premium";
  }

  // Get limits based on plan
  getLimits(user: User | null) {
    if (this.isSupporter(user)) {
      return {
        quizzesPerDay: Infinity,
        fileUploads: Infinity,
        maxFileSize: 50,
        noAds: true,
        features: [
          "unlimited-quizzes",
          "no-ads",
          "unlimited-uploads",
          "priority-support",
        ],
      };
    }
    return {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10,
      noAds: false,
      features: ["basic-quizzes", "ads-supported"],
    };
  }
}

export const paymongoService = new PayMongoService();

// Plans config — ₱100 one-time lifetime
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    stripePriceId: "",
    features: [
      "15 quizzes per day",
      "Up to 10 file uploads",
      "Max 10MB file size",
      "Ad-supported",
      "Basic analytics",
    ],
    limits: {
      quizzesPerDay: 15,
      fileUploads: 10,
      maxFileSize: 10,
      features: ["basic-quizzes", "ads-supported"],
    },
  },
  {
    id: "supporter",
    name: "Supporter",
    price: 100,
    interval: "month",
    stripePriceId: "",
    features: [
      "Unlimited quizzes forever",
      "Unlimited file uploads",
      "Max 50MB file size",
      "Zero ads — permanently",
      "Priority support",
      "Supporter badge",
      "✨ One-time payment · Lifetime access",
    ],
    limits: {
      quizzesPerDay: Infinity,
      fileUploads: Infinity,
      maxFileSize: 50,
      features: [
        "unlimited-quizzes",
        "no-ads",
        "unlimited-uploads",
        "priority-support",
      ],
    },
  },
];

export default paymongoService;
