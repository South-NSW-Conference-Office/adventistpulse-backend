'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Church, Building2, BookOpen, X, Loader2 } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';

interface Result {
  id: string;
  label: string;
  sublabel?: string;
  type: 'entity' | 'church' | 'research';
  href: string;
}

function levelIcon(level: string) {
  if (level === 'church') return <Church className="w-3.5 h-3.5" />;
  return <Building2 className="w-3.5 h-3.5" />;
}

function levelColor(level: string) {
  switch (level) {
    case 'division': return 'text-purple-400';
    case 'union':    return 'text-blue-400';
    case 'conference': return 'text-indigo-400';
    case 'church':   return 'text-emerald-400';
    default:         return 'text-gray-400';
  }
}

function churchToSlug(name: string): string {
  return name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/entities/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      const entities: any[] = data?.data ?? [];
      const mapped: Result[] = entities.map((e: any) => ({
        id: e.code,
        label: e.name,
        sublabel: `${e.level?.charAt(0).toUpperCase()}${e.level?.slice(1)} · ${e.code}`,
        type: e.level === 'church' ? 'church' : 'entity',
        href: e.level === 'church'
          ? `/church/${e.slug || churchToSlug(e.name)}`
          : `/entity/${e.code}`,
      }));
      setResults(mapped);
      setSelected(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].href);
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
          tokens.bg.card, tokens.border.default, tokens.text.muted,
          'hover:border-[#6366F1]/50 hover:text-[#6366F1]'
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Search</span>
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border opacity-50 font-mono" style={{ borderColor: 'currentColor' }}>⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className={cn('relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden', tokens.bg.card, tokens.border.default)}
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#2a3a50]">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin text-[#6366F1] flex-shrink-0" />
                : <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Search churches, conferences, entities…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                autoComplete="off"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="py-2 max-h-72 overflow-y-auto">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button
                      onClick={() => navigate(r.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        i === selected ? 'bg-[#6366F1]/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      )}
                    >
                      <span className={levelColor(r.type === 'church' ? 'church' : 'conference')}>
                        {r.type === 'church' ? <Church className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', tokens.text.heading)}>{r.label}</p>
                        {r.sublabel && <p className={cn('text-xs truncate', tokens.text.muted)}>{r.sublabel}</p>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="py-8 text-center">
                <p className={cn('text-sm', tokens.text.muted)}>No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {!query && (
              <div className="py-4 px-4">
                <p className={cn('text-xs mb-3', tokens.text.muted)}>Quick links</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'SNSW', href: '/entity/SNSW' },
                    { label: 'GSC', href: '/entity/GSC' },
                    { label: 'AUC', href: '/entity/AUC' },
                    { label: 'SPD', href: '/entity/SPD' },
                    { label: 'All Rankings', href: '/rankings' },
                    { label: 'Research', href: '/research' },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => navigate(q.href)}
                      className={cn('px-3 py-1 rounded-lg text-xs border transition-all', tokens.bg.page, tokens.border.default, tokens.text.body, 'hover:border-[#6366F1]/50')}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={cn('border-t px-4 py-2 flex items-center gap-4 text-[10px]', tokens.border.default, tokens.text.muted)}>
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
