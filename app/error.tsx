'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { RefreshCw, Home, Search } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging — replace with error tracking later
    console.error('[Adventist Pulse error]', error);
  }, [error]);

  const isApiError = error.message?.includes('API error') || error.message?.includes('fetch');

  return (
    <main className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
      <div className="text-center max-w-md space-y-6">
        {/* Pulse flatline */}
        <svg viewBox="0 0 200 60" className="w-40 h-12 mx-auto text-[#14b8a6] opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="0,30 35,30 45,10 55,50 65,20 72,35 80,30 200,30" />
        </svg>

        <div className="space-y-2">
          <h1 className={cn('text-2xl font-bold', tokens.text.heading)}>
            {isApiError ? 'Data Unavailable' : 'Something Went Wrong'}
          </h1>
          <p className={cn('text-sm', tokens.text.muted)}>
            {isApiError
              ? 'We couldn\'t reach the data server. This section may not be seeded yet — check back soon.'
              : 'An unexpected error occurred. If this keeps happening, let us know.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              tokens.bg.accent, tokens.text.onAccent, 'hover:opacity-90'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              tokens.bg.card, tokens.border.default, tokens.text.body, 'hover:border-[#14b8a6]/50'
            )}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/browse"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              tokens.bg.card, tokens.border.default, tokens.text.body, 'hover:border-[#14b8a6]/50'
            )}
          >
            <Search className="w-4 h-4" />
            Browse
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="text-left">
            <summary className={cn('text-xs cursor-pointer', tokens.text.muted)}>Error details</summary>
            <pre className={cn('mt-2 text-xs p-3 rounded-lg overflow-auto', tokens.bg.card, tokens.text.muted)}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
