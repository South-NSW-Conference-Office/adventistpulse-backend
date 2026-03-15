'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { tokens, cn } from '@/lib/theme';
import { Mail } from 'lucide-react';

export default function PendingVerificationPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-10 text-center', tokens.bg.card, tokens.border.default)}>
        <div className={cn('inline-flex items-center justify-center w-14 h-14 rounded-full mb-5', tokens.bg.accentSoft)}>
          <Mail className={cn('w-7 h-7', tokens.text.accent)} />
        </div>

        <h1 className={cn('text-xl font-bold mb-2', tokens.text.heading)}>Check your email</h1>
        <p className={cn('text-sm mb-6', tokens.text.muted)}>
          We&apos;ve sent a verification link to{' '}
          {user?.email ? (
            <span className={cn('font-medium', tokens.text.body)}>{user.email}</span>
          ) : 'your email address'}.
          Click the link to verify your account and continue.
        </p>

        <p className={cn('text-xs mb-6', tokens.text.muted)}>
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button className={cn('hover:underline', tokens.text.accent)}>resend the email</button>.
        </p>

        <button
          onClick={async () => { await logout(); router.push('/'); }}
          className={cn('w-full h-11 rounded-full text-sm font-semibold border', tokens.border.default, tokens.text.body, 'hover:bg-gray-100 dark:hover:bg-[#253344] transition-colors')}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
