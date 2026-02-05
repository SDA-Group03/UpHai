import React, { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { register } from '../services/authService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- Icons Components ---
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="mr-2">
    <path fill="#4285F4" d="M14.9 8.161c0-.476-.039-.954-.118-1.421H8.021v2.681h3.833a3.321 3.321 0 01-1.431 2.161v1.785h2.3c1.349-1.25 2.177-3.103 2.177-5.206z"/>
    <path fill="#34A853" d="M8.021 15c1.951 0 3.57-.65 4.761-1.754l-2.3-1.785c-.653.447-1.477.707-2.461.707-1.887 0-3.487-1.274-4.057-2.991H1.617V11.1C2.8 13.481 5.282 15 8.021 15z"/>
    <path fill="#FBBC05" d="M3.964 9.177a4.97 4.97 0 010-2.354V4.9H1.617a8.284 8.284 0 000 7.623l2.347-1.346z"/>
    <path fill="#EA4335" d="M8.021 3.177c1.064 0 2.02.375 2.75 1.111l2.041-2.041C11.616 1.016 9.97.446 8.021.446c-2.739 0-5.221 1.519-6.404 3.9l2.347 1.346c.57-1.717 2.17-2.515 4.057-2.515z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="mr-2">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const BrandLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-4">
    <rect width="32" height="32" rx="6" fill="#635BFF"/>
    <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="white"/>
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
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
      await register({ username, password });
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            Create an account
          </CardTitle>
          <CardDescription className="text-slate-500">
Join UpHai to get started.          
</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                placeholder="Choose a username"
                className="h-11 focus-visible:ring-[#635BFF]"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Create a password"
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
              <p className="text-xs text-slate-400">Must be at least 8 characters</p>
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
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#ffffff] px-4 text-slate-500 font-medium">
                or register with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <GoogleIcon />
              Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <GitHubIcon />
              GitHub
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-8">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#635BFF] hover:text-[#4c44d4] hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}