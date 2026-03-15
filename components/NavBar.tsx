'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
import { CommandSearch } from './CommandSearch';
import { Logo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { tokens, cn } from '@/lib/theme';
import { BarChart3, FileText, Globe2, Microscope, Search, Earth, DollarSign, Wrench, User, LogOut } from 'lucide-react';

const PILLARS = [
  {
    label: 'Statistics',
    icon: BarChart3,
    href: '/browse',
    children: [
      { href: '/browse', label: 'Browse Entities', desc: 'Explore every Adventist entity' },
      { href: '/rankings', label: 'Rankings', desc: 'Compare by membership, growth, baptisms' },
      { href: '/compare', label: 'Compare', desc: 'Side-by-side entity comparison' },
      { href: '/at-risk', label: 'At Risk', desc: 'Entities needing urgent attention' },
      { href: '/hierarchy', label: 'Hierarchy', desc: 'GC → Division → Union → Conference' },
      { href: '/institutions', label: 'Institutions', desc: 'Schools, hospitals, media centres' },
      { href: '/australia', label: 'Australia', desc: 'All 9 Australian conferences' },
      { href: '/tithe-flow', label: 'Tithe Flow', desc: 'How your $100 tithe flows through the organization' },
      { href: '/church-tools/canberra-national', label: 'Church Tools', desc: 'Pastor\'s Dashboard with demographics, health metrics & AI insights' },
      { href: '/export', label: 'Export Data', desc: 'Download datasets' },
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
];

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openPillar, setOpenPillar] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  // Global CMD+K / Ctrl+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav className="bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#2a3a50] sticky top-0 z-[1100]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo size="md" className="text-gray-900 dark:text-white" />
        </Link>

        {/* Desktop nav — 4 pillars and theme toggle */}
        <div className="hidden md:flex items-center gap-1">
          {PILLARS.map(pillar =>
            pillar.children ? (
              /* Statistics dropdown */
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
                  <pillar.icon className="w-4 h-4" /> {pillar.label} <span className="text-[10px] opacity-60">▾</span>
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
              /* Direct link pillars */
              <Link
                key={pillar.label}
                href={pillar.href}
                className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-[#6366F1] transition-colors flex items-center gap-1.5"
              >
                <pillar.icon className="w-4 h-4" /> {pillar.label}
              </Link>
            )
          )}

          {/* Search pill */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="ml-2 px-3 py-1.5 text-xs text-gray-500 dark:text-slate-500 hover:text-[#6366F1] border border-gray-200 dark:border-[#2a3a50] rounded-full transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Search
            <kbd className="text-[10px] text-gray-400 dark:text-slate-600">⌘K</kbd>
          </button>



          {/* Auth */}
          <div className="ml-2 flex items-center gap-2">
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
                <Link href="/login" className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors', tokens.border.default, tokens.text.body, 'hover:bg-gray-100 dark:hover:bg-[#253344]')}>
                  Sign in
                </Link>
                <Link href="/register" className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#6366f1] hover:bg-[#4f46e5] transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile menu button and theme toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-[#2a3a50] bg-white dark:bg-[#1a2332] max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3">
            {PILLARS.map(pillar => (
              <div key={pillar.label} className="mb-3">
                {pillar.children ? (
                  <>
                    <button
                      className="w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center justify-between"
                      onClick={() => setOpenPillar(openPillar === pillar.label ? null : pillar.label)}
                    >
                      <span className="flex items-center gap-2"><pillar.icon className="w-4 h-4 text-[#6366F1]" /> {pillar.label}</span>
                      <span className={`text-xs transition-transform ${openPillar === pillar.label ? 'rotate-180' : ''}`}>▾</span>
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
                    <pillar.icon className="w-4 h-4 text-[#6366F1]" /> {pillar.label}
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
                  <Link href="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center py-2 rounded-full text-sm font-semibold text-white bg-[#6366f1]">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Command Search Modal */}
      <CommandSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </nav>
  );
}
