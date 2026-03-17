'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { tokens, cn } from '@/lib/theme';
import { BarChart3, FileText, Globe2, Microscope, LogOut, Wrench } from 'lucide-react';

const PILLARS = [
  {
    label: 'Statistics',
    icon: BarChart3,
    href: '/browse',
    children: [
      { href: '/browse', label: 'Browse Entities', desc: 'Explore every Adventist entity' },
      { href: '/rankings', label: 'Rankings', desc: 'Compare by membership, growth, baptisms' },
      { href: '/compare', label: 'Compare', desc: 'Side-by-side entity comparison' },
      { href: '/tithe-flow', label: 'Tithe Flow', desc: 'See how your tithe dollar flows through the church' },
    ],
  },
  {
    label: 'Reports',
    icon: FileText,
    href: '/reports',
    children: null,
  },
  {
    label: 'Maps',
    icon: Globe2,
    href: '/map',
    children: null,
  },
  {
    label: 'Research',
    icon: Microscope,
    href: '/research',
    children: null,
  },
  {
    label: 'Tools',
    icon: Wrench,
    href: '/vitality-check',
    children: [
      { href: '/vitality-check', label: 'Vitality Check', desc: 'Diagnose your church across 7 mission dimensions' },
      { href: '/tithe-flow', label: 'Tithe Flow', desc: 'See how your tithe dollar flows through the church' },
    ],
  },
];

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openPillar, setOpenPillar] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[2000] bg-white/10 dark:bg-[#0d1117]/20 backdrop-blur-md border-b border-white/10">
      <div className="px-6 md:px-10 flex items-center justify-between h-14">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
          <span className="md:hidden"><Logo size="sm" className="text-gray-900 dark:text-white" /></span>
          <span className="hidden md:inline-flex"><Logo size="md" className="text-gray-900 dark:text-white" /></span>
        </Link>

        {/* Navigation Menu - Center */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {PILLARS.map(pillar =>
            pillar.children ? (
              <div
                key={pillar.label}
                className="relative group"
                onMouseEnter={() => setOpenPillar(pillar.label)}
                onMouseLeave={() => setOpenPillar(null)}
              >
                <Link
                  href={pillar.href}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-[#6366F1] transition-colors flex items-center gap-1"
                >
                  {pillar.label} <span className="text-[10px] opacity-60">▾</span>
                </Link>
                {openPillar === pillar.label && (
                  <div className="absolute left-0 top-full pt-1 z-50">
                    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg shadow-xl py-2 min-w-[260px]">
                      {pillar.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#253344] transition-colors"
                          onClick={() => setOpenPillar(null)}
                        >
                          <span className="text-sm text-gray-900 dark:text-slate-200">{child.label}</span>
                          <span className="block text-xs text-gray-500 dark:text-slate-500 mt-0.5">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={pillar.label}
                href={pillar.href}
                className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-[#6366F1] transition-colors"
              >
                {pillar.label}
              </Link>
            )
          )}
        </div>

        {/* Auth & Theme Toggle - Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              <span className={cn('text-xs hidden lg:block max-w-[120px] truncate', tokens.text.muted)}>
                {user.name ?? user.email}
              </span>
              <button
                onClick={handleSignOut}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors', tokens.border.default, tokens.text.body, 'hover:bg-gray-100 dark:hover:bg-[#253344]')}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="text-sm font-semibold text-[#6366F1] hover:text-[#4f46e5] transition-colors">
                Sign up
              </Link>
            </>
          )}
          <div className="ml-2">
            <GlobalSearch />
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-2 ml-auto"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-white/10 dark:bg-[#0d1117]/40 backdrop-blur-md max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3">
            {PILLARS.map(pillar => (
              <div key={pillar.label} className="mb-3">
                {pillar.children ? (
                  <>
                    <button
                      className="w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center justify-between"
                      onClick={() => setOpenPillar(openPillar === pillar.label ? null : pillar.label)}
                    >
                      <span>{pillar.label}</span>
                      <span className="text-[10px] opacity-60">▾</span>
                    </button>
                    {openPillar === pillar.label && (
                      <div className="ml-4 border-l border-gray-200 dark:border-[#2a3a50] pl-3 space-y-0.5">
                        {pillar.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            onClick={() => { setIsOpen(false); setOpenPillar(null); }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={pillar.href}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {pillar.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Auth — mobile */}
            <div className={cn('pt-3 mt-3 border-t', tokens.border.default)}>
              {user ? (
                <div className="space-y-2">
                  <p className={cn('text-xs', tokens.text.muted)}>Signed in as {user.name ?? user.email}</p>
                  <button onClick={handleSignOut} className={cn('flex items-center gap-2 text-sm font-medium', tokens.text.body)}>
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" onClick={() => setIsOpen(false)} className={cn('flex-1 text-center py-2 rounded-full text-sm border', tokens.border.default, tokens.text.body)}>
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center py-2 rounded-full text-sm font-semibold text-white bg-[#6366F1]">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
