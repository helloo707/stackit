'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        // Fetch user details to check role
        const response = await fetch(`/api/users/me`);
        const userData = await response.json();

        toast.success('Signed in successfully!');
        
        // Redirect based on user role
        if (userData.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch {
      toast.error('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      toast.error('An error occurred during Google sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center py-12 px-4">
      {/* Grid and Pattern Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid z-0"></div>
        <div className="absolute inset-0 bg-pattern z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue/5 via-purple/5 to-emerald/5"></div>
        </div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="card-modern p-8 mb-8 text-center">
          <div className="w-42 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-xl font-bold  text-foreground font-orbitron font-inter">StackIt</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground font-inter mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground font-inter">
            Sign in to your StackIt account
          </p>
        </div>
        <div className="card-modern py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Credentials Sign In */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground font-inter">
                Email address
              </label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground font-inter">
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-blue hover:text-blue-light">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue hover:bg-blue-light"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground font-inter">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue hover:text-blue-light font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 