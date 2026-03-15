import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';

// EKG / flatline SVG — a pulse that goes flat
function FlatlineSvg() {
  return (
    <svg
      viewBox="0 0 200 60"
      className="w-48 h-16 text-[#14b8a6] opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Flat line → spike → flat → spike decay → flatline */}
      <polyline points="0,30 35,30 45,10 55,50 65,20 72,35 80,30 200,30" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className={cn('min-h-screen flex items-center justify-center', tokens.bg.page)}>
      <div className="text-center px-6 max-w-md">
        {/* EKG graphic */}
        <div className="flex justify-center mb-6">
          <FlatlineSvg />
        </div>

        <h1 className={cn('text-4xl font-bold mb-3', tokens.text.heading)}>
          No Pulse Detected
        </h1>
        <p className={cn('text-base mb-8', tokens.text.body)}>
          We couldn&apos;t find the page you&apos;re looking for. It may have moved or never existed.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              tokens.bg.accent,
              tokens.bg.accentHover,
              tokens.text.onAccent
            )}
          >
            Back to Home
          </Link>
          <Link
            href="/browse"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              tokens.bg.card,
              tokens.border.default,
              tokens.text.body,
              'hover:border-[#14b8a6]/50'
            )}
          >
            Browse Entities
          </Link>
        </div>
      </div>
    </main>
  );
}
