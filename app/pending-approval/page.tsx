'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { tokens, cn } from '@/lib/theme';
import { Clock } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className={cn('w-full max-w-md rounded-2xl border p-10 text-center', tokens.bg.card, tokens.border.default)}>
        <div className={cn('inline-flex items-center justify-center w-14 h-14 rounded-full mb-5', tokens.bg.accentSoft)}>
          <Clock className={cn('w-7 h-7', tokens.text.accent)} />
        </div>

        <h1 className={cn('text-xl font-bold mb-2', tokens.text.heading)}>Application submitted</h1>
        <p className={cn('text-sm mb-6', tokens.text.muted)}>
          Your application is under review. You&apos;ll receive an email once it&apos;s approved.
          This usually takes 1–2 business days.
        </p>

        {user && (
          <p className={cn('text-xs mb-6 px-4 py-3 rounded-lg', tokens.bg.cardAlt, tokens.text.muted)}>
            Signed in as <span className={cn('font-medium', tokens.text.body)}>{user.email}</span>
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className={cn('block w-full h-11 rounded-full text-sm font-semibold text-white text-center leading-[44px]', tokens.bg.accent)}
          >
            Browse public data
          </Link>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            className={cn('block w-full h-11 rounded-full text-sm font-semibold border text-center', tokens.border.default, tokens.text.body, 'hover:bg-gray-100 dark:hover:bg-[#253344] transition-colors')}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
