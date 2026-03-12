import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentComplete?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentComplete = false,
}) => {
  const {
    user,
    pollTimeRemaining,
    isPolling,
    pendingCheckoutUrl,
    confirmAndProceed,
  } = useSubscription();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (paymentComplete) {
    // Thank You Modal
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl text-violet-900">
              Thank You, {user?.nickname || "Supporter"}! 🎉
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">CM</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-violet-900 mb-1">
                    Message from Charles Manalo
                  </h4>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Hello {user?.nickname || "Supporter"}! My name is Charles
                    Manalo, founder/developer of{" "}
                    <span
                      className="font-bold"
                      style={{ fontFamily: "Blanka, sans-serif" }}
                    >
                      {" "}
                      Examzz
                    </span>
                    . Your support means everything to me and will help me add
                    more features and keep the platform running. Thank you
                    sincerely!
                  </p>
                  <p className="text-xs text-violet-600 mt-2 italic">
                    — Charles Manalo
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800 border-green-200 w-full justify-center py-2">
                <Crown className="w-4 h-4 mr-2" />
                Lifetime Supporter Status Activated
              </Badge>

              <div className="text-sm text-muted-foreground">
                <p>✅ Unlimited quizzes forever</p>
                <p>✅ No advertisements</p>
                <p>✅ Priority support</p>
                <p>✅ All premium features unlocked</p>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              Start Using Premium Features
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Waiting for Payment Modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl text-violet-900">
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
            <p className="text-sm text-violet-800 mb-3">
              Please complete your payment in the PayMongo tab. This page will
              update automatically when your payment is processed.
            </p>

            <div className="flex items-center justify-center space-x-2 text-violet-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">
                {formatTime(pollTimeRemaining)}
              </span>
            </div>
            <p className="text-xs text-violet-600 mt-1">
              Time remaining for payment
            </p>
          </div>

          {!isPolling && pendingCheckoutUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ready to proceed with payment?
              </p>
              <Button
                onClick={confirmAndProceed}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Payment Page
              </Button>
            </div>
          ) : isPolling ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-violet-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for payment...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Don't close this window. We'll detect your payment
                automatically.
              </p>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Make sure to pay with your registered email:</p>
            <p className="font-medium text-violet-600">{user?.email}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
