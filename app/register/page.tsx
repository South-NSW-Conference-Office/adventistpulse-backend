'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePublicRoute } from '@/lib/hooks/useRouteGuard';
import { tokens, cn } from '@/lib/theme';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

function passwordStrength(p: string): { label: string; color: string; width: string } | null {
  if (!p) return null;
  if (p.length < 8) return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' };
  if (p.length < 12) return { label: 'Weak', color: 'bg-orange-500', width: 'w-2/4' };
  const variety = [/[A-Z]/, /[a-z]/, /\d/, /[^a-zA-Z0-9]/].filter(r => r.test(p)).length;
  if (variety < 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { isReady } = usePublicRoute();

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      router.push('/pending-verification');
    } catch (err) {
      toast.fromApiError(err, "Couldn't create your account. Please check your details and try again.");
    }
  };

  if (!isReady) return null;

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-8', tokens.bg.card, tokens.border.default)}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={cn('text-2xl font-bold mb-1', tokens.text.heading)}>Create account</h1>
          <p className={cn('text-sm', tokens.text.muted)}>Join Adventist Pulse to access church intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', tokens.text.muted)}>Full name</label>
            <div className={cn('flex items-center gap-3 px-3.5 h-11 rounded-lg border', tokens.bg.cardAlt, tokens.border.default)}>
              <User className={cn('w-4 h-4 shrink-0', tokens.text.muted)} />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
          </div>

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
                autoComplete="email"
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
                placeholder="At least 12 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className={cn('shrink-0', tokens.text.muted)} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {strength && (
              <div className="mt-2 space-y-1">
                <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={cn('h-1 rounded-full transition-all', strength.color, strength.width)} />
                </div>
                <p className={cn('text-xs', strength.color.replace('bg-', 'text-'))}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn('w-full h-11 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2', tokens.bg.accent)}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={cn('mt-6 text-center text-sm', tokens.text.muted)}>
          Already have an account?{' '}
          <Link href="/login" className={cn('font-semibold hover:underline', tokens.text.accent)}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
