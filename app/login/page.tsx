'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePublicRoute } from '@/lib/hooks/useRouteGuard';
import { consumeRedirectToast } from '@/lib/toast/redirect-toast';
import { tokens, cn } from '@/lib/theme';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { isReady } = usePublicRoute();

  useEffect(() => {
    const pending = consumeRedirectToast();
    if (pending) toast[pending.type](pending.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { mustChangePassword, emailVerified, accountStatus } = await login(email, password, remember);

      if (!emailVerified) {
        toast.warning("Please verify your email address. We've sent a new verification link.");
        router.push('/pending-verification');
      } else if (mustChangePassword) {
        router.push('/change-password');
      } else if (accountStatus === 'pending_onboarding') {
        router.push('/onboarding');
      } else if (accountStatus === 'pending_approval') {
        router.push('/pending-approval');
      } else if (accountStatus === 'rejected') {
        toast.error('Your account application was not approved. Please reapply.');
        router.push('/onboarding');
      } else {
        toast.success('Welcome back!');
        router.push('/');
      }
    } catch (err) {
      toast.fromApiError(err, 'Sign-in failed. Please check your details and try again.');
    }
  };

  if (!isReady) return null;

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-8', tokens.bg.card, tokens.border.default)}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={cn('text-2xl font-bold mb-1', tokens.text.heading)}>Sign in</h1>
          <p className={cn('text-sm', tokens.text.muted)}>Access your Adventist Pulse account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', tokens.text.muted)}>Email address</label>
            <div className={cn('flex items-center gap-3 px-3.5 h-11 rounded-lg border', tokens.bg.cardAlt, tokens.border.default)}>
              <Mail className={cn('w-4 h-4 shrink-0', tokens.text.muted)} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', tokens.text.muted)}>Password</label>
            <div className={cn('flex items-center gap-3 px-3.5 h-11 rounded-lg border', tokens.bg.cardAlt, tokens.border.default)}>
              <Lock className={cn('w-4 h-4 shrink-0', tokens.text.muted)} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className={cn('shrink-0', tokens.text.muted)} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className={cn('flex items-center gap-2 text-xs cursor-pointer', tokens.text.body)}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[#6366f1]" />
              Remember me
            </label>
            <Link href="/forgot-password" className={cn('text-xs hover:underline', tokens.text.accent)}>
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn('w-full h-11 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50', tokens.bg.accent)}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={cn('mt-6 text-center text-sm', tokens.text.muted)}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={cn('font-semibold hover:underline', tokens.text.accent)}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
