import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface NicknamePromptProps {
  isOpen: boolean;
  onSubmit: (nickname: string) => void;
  userEmail: string;
}

const NicknamePrompt = ({ isOpen, onSubmit, userEmail }: NicknamePromptProps) => {
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (nickname.trim().length < 2) {
      toast.error("Nickname must be at least 2 characters");
      return;
    }

    if (nickname.trim().length > 20) {
      toast.error("Nickname must be less than 20 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(nickname.trim());
    } catch (error) {
      toast.error("Failed to save nickname");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Examzz! 🎉</DialogTitle>
          <DialogDescription>
            Please choose a nickname to personalize your experience. This will be displayed on your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full"
              maxLength={20}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              2-20 characters. This can be changed later in settings.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={userEmail}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !nickname.trim()}
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NicknamePrompt;
