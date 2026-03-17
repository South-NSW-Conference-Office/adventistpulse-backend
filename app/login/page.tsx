export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.adventistpulse.org';
  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center"><Logo size="md" /></div>
        <h1 className={cn('text-2xl font-bold', tokens.text.heading)}>Sign in to Adventist Pulse</h1>
        <p className={cn('text-sm', tokens.text.muted)}>
          Member access is currently in beta. If you have an account, sign in below.
        </p>
        <a
          href={`${adminUrl}/login`}
          className={cn(
            'block w-full py-3 px-6 rounded-lg font-semibold text-white transition-opacity hover:opacity-90',
            tokens.bg.accent
          )}
        >
          Sign In
        </a>
        <p className={cn('text-sm', tokens.text.muted)}>
          Don&apos;t have access?{' '}
          <Link href="/beta" className={cn('font-medium', tokens.text.accent)}>
            Request beta access →
          </Link>
        </p>
      </div>
    </div>
  );
}
