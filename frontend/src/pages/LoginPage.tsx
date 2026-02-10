import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { login, fetchProfile, setCurrentUser } from '../services/authService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const BrandLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-4">
    <rect width="32" height="32" rx="6" fill="#635BFF"/>
    <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="white"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      await login({ username, password });
      const user = await fetchProfile();
      setCurrentUser(user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-4 font-sans">
      <Card className="w-full max-w-[400px] border border-gray-100 shadow-xl shadow-gray-200/50">
        <CardHeader className="space-y-1 text-center pb-8">
          <BrandLogo />
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            Sign in to UpHai
          </CardTitle>
          <CardDescription className="text-slate-500">
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                placeholder="username"
                className="h-11 focus-visible:ring-[#635BFF]"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="h-11 pr-10 focus-visible:ring-[#635BFF]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 w-11 px-3 py-3 text-slate-400 hover:text-[#635BFF] hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  className="data-[state=checked]:bg-[#635BFF] data-[state=checked]:border-[#635BFF]"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500"
                >
                  Remember me
                </Label>
              </div>
              <Link 
                to="#" 
                className="text-sm font-medium text-[#635BFF] hover:text-[#4c44d4] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-md border border-rose-100">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 bg-[#635BFF] hover:bg-[#4c44d4] text-white shadow-md transition-all active:scale-[0.98]" 
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#ffffff] px-4 text-slate-500 font-medium">
                or continue with
              </span>
            </div>
          </div>

        </CardContent>
        
        {/* Footer */}
        <CardFooter className="flex justify-center pb-8">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-[#635BFF] hover:text-[#4c44d4] hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
