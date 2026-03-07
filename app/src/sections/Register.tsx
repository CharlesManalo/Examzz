import { useState } from 'react';
import type { View, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUser, getUserByEmail } from '@/services/database';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';

interface RegisterProps {
  onNavigate: (view: View) => void;
  onRegister: (user: User) => void;
}

const Register = ({ onNavigate, onRegister }: RegisterProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const existingUser = getUserByEmail(formData.email);
    if (existingUser) {
      setError('An account with this email already exists');
      setIsLoading(false);
      return;
    }

    const newUser = createUser({
      email: formData.email,
      password: formData.password,
      lastLogin: new Date().toISOString(),
      isPremium: false
    });

    setIsLoading(false);
    onRegister(newUser);
  };

  const features = [
    'Unlimited document uploads',
    'Smart quiz generation',
    'Progress tracking',
    'Free forever'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-50 to-white">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block">
            <div 
              className="flex items-center gap-2 mb-8 cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                StudyQuiz Pro
              </span>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Start Your Learning Journey Today
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of students who are already studying smarter with our AI-powered quiz generation platform.
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
                <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
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
                        type={showPassword ? 'text' : 'password'}
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        type={showPassword ? 'text' : 'password'}
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
                      I agree to the{' '}
                      <button type="button" className="text-violet-600 hover:text-violet-700 font-medium">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" className="text-violet-600 hover:text-violet-700 font-medium">
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
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
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
