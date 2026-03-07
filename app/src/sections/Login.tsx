import { useState } from 'react';
import type { View, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserByEmail, setCurrentUser } from '@/services/database';
import { Eye, EyeOff, Mail, Lock, ArrowRight, BookOpen } from 'lucide-react';

interface LoginProps {
  onNavigate: (view: View) => void;
  onLogin: (user: User) => void;
}

const Login = ({ onNavigate, onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const user = getUserByEmail(email);
    
    if (!user) {
      setError('No account found with this email. Please register first.');
      setIsLoading(false);
      return;
    }

    if (user.password !== password) {
      setError('Incorrect password. Please try again.');
      setIsLoading(false);
      return;
    }

    user.lastLogin = new Date().toISOString();
    setCurrentUser(user);
    
    setIsLoading(false);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-50 to-white">
      <div className="w-full max-w-md">
        <div 
          className="flex justify-center mb-8 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent ml-3">
            StudyQuiz Pro
          </span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-muted-foreground">Demo Credentials</span>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Email: demo@studyquiz.com</p>
                <p>Password: demo123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-medium text-violet-600 hover:text-violet-700"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
