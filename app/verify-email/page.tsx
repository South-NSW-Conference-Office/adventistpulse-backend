'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please use the link from your email.');
      return;
    }

    fetch(`${API_BASE}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
          setTimeout(() => router.push('/onboarding'), 2500);
        } else {
          setStatus('error');
          setMessage(data.error?.message ?? 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please check your connection and try again.');
      });
  }, [searchParams, router]);

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-10 text-center', tokens.bg.card, tokens.border.default)}>
        {status === 'loading' && (
          <>
            <Loader2 className={cn('w-10 h-10 mx-auto mb-4 animate-spin', tokens.text.accent)} />
            <h2 className={cn('text-lg font-semibold', tokens.text.heading)}>Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto mb-4 text-green-500" />
            <h2 className={cn('text-lg font-semibold mb-2', tokens.text.heading)}>Email verified!</h2>
            <p className={cn('text-sm', tokens.text.muted)}>Redirecting you to complete your profile…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 mx-auto mb-4 text-red-500" />
            <h2 className={cn('text-lg font-semibold mb-2', tokens.text.heading)}>Verification failed</h2>
            <p className={cn('text-sm mb-6', tokens.text.muted)}>{message}</p>
            <Link href="/login" className={cn('text-sm font-semibold hover:underline', tokens.text.accent)}>
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={cn('min-h-screen flex items-center justify-center', tokens.bg.page)}>
        <Loader2 className={cn('w-8 h-8 animate-spin', tokens.text.accent)} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
