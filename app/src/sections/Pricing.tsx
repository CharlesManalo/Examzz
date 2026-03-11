import { useEffect, useState } from "react";
import { Crown, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PricingSection from "@/components/PricingSection";
import { paymongoService } from "@/services/paymongo";
import { getCurrentUser } from "@/services/auth";
import type { View } from "@/types";

interface PricingProps {
  onNavigate: (view: View) => void;
}

export default function Pricing({ onNavigate }: PricingProps) {
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if returning from PayMongo checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";
    const linkId = sessionStorage.getItem("paymongo_link_id");
    const userId = sessionStorage.getItem("paymongo_user_id");

    if (isSuccess && linkId && userId) {
      verifyPayment(linkId, userId);
    }
  }, []);

  const verifyPayment = async (linkId: string, userId: string) => {
    setVerifying(true);
    setError(null);
    try {
      // Poll up to 5 times with 2s delay (PayMongo webhooks can have slight delay)
      let result = null;
      for (let i = 0; i < 5; i++) {
        result = await paymongoService.verifyPayment(linkId, userId);
        if (result.paid) break;
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (result?.paid) {
        // Clear stored link info
        sessionStorage.removeItem("paymongo_link_id");
        sessionStorage.removeItem("paymongo_user_id");
        setPaymentSuccess(true);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        setError(
          "Payment not confirmed yet. If you paid, please wait a moment and refresh.",
        );
      }
    } catch (err) {
      setError(
        "Could not verify payment. Please contact support if you were charged.",
      );
    } finally {
      setVerifying(false);
    }
  };

  // Payment success screen
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Verifying your payment...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait, this only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome, Supporter! 🎉
          </h1>
          <p className="text-gray-500 mb-2">
            Your payment was successful. You now have lifetime access to all
            premium features.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            No ads. Unlimited quizzes. Forever.
          </p>
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-8"
            onClick={() => onNavigate("dashboard")}
          >
            <Crown className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate("dashboard")}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-md mx-auto mt-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Pricing content */}
      <PricingSection />
    </div>
  );
}
