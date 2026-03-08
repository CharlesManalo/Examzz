import { useState } from "react";
import type { View, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUp, signUpWithGoogle } from "@/services/auth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

// Assets
import Logo from "../assets/Logo.png";

interface RegisterProps {
  onNavigate: (view: View) => void;
  onRegister: (user: User) => void;
}

const Register = ({ onNavigate, onRegister }: RegisterProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const newUser = await signUp(formData.email, formData.password);
      onRegister(newUser);
      toast.success("Account created successfully!", {
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle specific Supabase auth errors
      if (error.message?.includes("User already registered")) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (error.message?.includes("Password should be at least")) {
        setError("Password must be at least 6 characters long.");
      } else {
        setError(
          error.message || "Failed to create account. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signUpWithGoogle();
      toast.info("Redirecting to Google...", {
        description: "Complete the sign-up with your Google account",
      });
    } catch (error: any) {
      setError(error.message || "Failed to sign up with Google.");
    }
  };

  const features = [
    "Unlimited document uploads",
    "Smart quiz generation",
    "Progress tracking",
    "Free forever",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-50 to-white">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block">
            <div
              className="flex items-center gap-2 mb-8 cursor-pointer"
              onClick={() => onNavigate("home")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <img src={Logo} alt="Examzz" className="h-6 w-6 rounded-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Examzz
              </span>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Start Your Learning Journey Today
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of students who are already studying smarter with
              our AI-powered quiz generation platform.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  Create an account
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm font-normal">
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Create Account
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => onNavigate("login")}
                className="font-medium text-violet-600 hover:text-violet-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
