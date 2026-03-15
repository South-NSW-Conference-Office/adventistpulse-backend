'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { Mail, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
        <div className={cn('w-full max-w-md rounded-2xl border p-10 text-center', tokens.bg.card, tokens.border.default)}>
          <div className={cn('inline-flex items-center justify-center w-14 h-14 rounded-full mb-5', tokens.bg.accentSoft)}>
            <Mail className={cn('w-7 h-7', tokens.text.accent)} />
          </div>
          <h2 className={cn('text-xl font-bold mb-2', tokens.text.heading)}>Check your email</h2>
          <p className={cn('text-sm mb-6', tokens.text.muted)}>
            If an account exists for <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>, we&apos;ve sent password reset instructions.
          </p>
          <Link href="/login" className={cn('text-sm font-semibold hover:underline', tokens.text.accent)}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-8', tokens.bg.card, tokens.border.default)}>
        <Link href="/login" className={cn('inline-flex items-center gap-1.5 text-sm mb-6 hover:underline', tokens.text.muted)}>
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <h1 className={cn('text-2xl font-bold mb-1', tokens.text.heading)}>Forgot password?</h1>
        <p className={cn('text-sm mb-6', tokens.text.muted)}>Enter your email and we&apos;ll send you a reset link.</p>

        {status === 'error' && (
          <div className={cn('rounded-lg border px-4 py-3 text-sm mb-5', tokens.bg.danger, 'border-red-200 dark:border-red-800', tokens.text.danger)}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', tokens.text.muted)}>Email address</label>
            <div className={cn('flex items-center gap-3 px-3.5 h-11 rounded-lg border', tokens.bg.cardAlt, tokens.border.default)}>
              <Mail className={cn('w-4 h-4 shrink-0', tokens.text.muted)} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className={cn('w-full h-11 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50', tokens.bg.accent)}
          >
            {status === 'loading' ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
