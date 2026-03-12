import { useEffect } from "react";
import {
  Crown,
  ArrowLeft,
  CheckCircle,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PricingSection from "@/components/PricingSection";
import PaymentModal from "@/components/PaymentModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { View } from "@/types";

interface PricingProps {
  onNavigate: (view: View) => void;
}

export default function Pricing({ onNavigate }: PricingProps) {
  const {
    user,
    showEmailConfirm,
    confirmAndProceed,
    cancelEmailConfirm,
    showPaymentModal,
    paymentComplete,
    setShowPaymentModal,
    setPaymentComplete,
    isPremium,
  } = useSubscription();

  // Listen for successful payment event
  useEffect(() => {
    const onSuccess = () => {
      // page will re-render via isPremium becoming true — nothing extra needed
    };
    window.addEventListener("paymongo:payment_success", onSuccess);
    return () =>
      window.removeEventListener("paymongo:payment_success", onSuccess);
  }, []);

  // ── Success screen ────────────────────────────────────────────────────────
  if (isPremium) {
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
            You now have lifetime access to all premium features.
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
      {/* ── Email confirmation dialog ─────────────────────────────────────── */}
      <Dialog
        open={showEmailConfirm}
        onOpenChange={(open) => {
          if (!open) cancelEmailConfirm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-600" />
              Confirm your email
            </DialogTitle>
            <DialogDescription>
              Make sure you pay using this email address so we can automatically
              activate your Supporter access.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-center">
            <p className="text-xs text-violet-500 mb-1">Logged in as</p>
            <p className="text-lg font-semibold text-violet-800 break-all">
              {user?.email}
            </p>
          </div>

          <p className="text-sm text-gray-500 text-center">
            PayMongo will ask for your email during checkout.{" "}
            <span className="font-medium text-gray-700">
              Enter the exact email above
            </span>{" "}
            so your account is upgraded automatically.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              onClick={confirmAndProceed}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Yes, proceed to payment
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={cancelEmailConfirm}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment Modal ────────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          if (paymentComplete) {
            setPaymentComplete(false);
          }
        }}
        paymentComplete={paymentComplete}
      />

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate("dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* ── Pricing content ───────────────────────────────────────────────── */}
      <PricingSection />
    </div>
  );
}
