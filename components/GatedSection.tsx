'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { tokens, cn } from '@/lib/theme';
import { Lock, Clock } from 'lucide-react';

interface GatedSectionProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function GatedSection({ children, title, description }: GatedSectionProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  // Approved — show real content
  if (user?.accountStatus === 'approved') {
    return <>{children}</>;
  }

  // Logged in but pending
  if (user && (user.accountStatus as string) !== 'approved') {
    return (
      <div className={cn('relative rounded-xl overflow-hidden border', tokens.border.default)}>
        <div aria-hidden="true" style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }} className={cn('p-5', tokens.bg.card)}>
          {children}
        </div>
        <div className={cn('absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl text-center px-6', 'bg-white/75 dark:bg-[#1a2332]/85')}>
          <Clock className={cn('w-7 h-7 mb-3', tokens.text.accent)} />
          <p className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>Account pending approval</p>
          <p className={cn('text-sm', tokens.text.muted)}>You&apos;ll get access to {title} once your application is approved.</p>
          <Link href="/pending-approval" className={cn('mt-3 text-xs font-semibold hover:underline', tokens.text.accent)}>
            Check status
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in — show lock overlay
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div aria-hidden="true" style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }} className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
        {children}
      </div>
      <div className={cn('absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl text-center px-6', 'bg-white/75 dark:bg-[#1a2332]/85')}>
        <Lock className={cn('w-7 h-7 mb-3', tokens.text.accent)} />
        <p className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>{title}</p>
        {description && <p className={cn('text-sm mb-4', tokens.text.muted)}>{description}</p>}
        <Link
          href="/register"
          className={cn('px-5 py-2 rounded-full text-sm font-semibold text-white', tokens.bg.accent, 'hover:opacity-90 transition-opacity')}
        >
          Create free account
        </Link>
        <p className={cn('mt-2 text-xs', tokens.text.muted)}>
          Already a member?{' '}
          <Link href="/login" className={cn('hover:underline', tokens.text.accent)}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
