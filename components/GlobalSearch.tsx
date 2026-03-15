'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EntityWithStats } from '@/types/pulse';

interface GlobalSearchProps {
  entities: EntityWithStats[];
  placeholder?: string;
  autofocus?: boolean;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

export function GlobalSearch({ entities, placeholder, autofocus }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.length >= 1
    ? entities
        .filter(e =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.code.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function navigate(code: string) {
    setQuery('');
    setIsOpen(false);
    router.push(`/entity/${code}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigate(results[selectedIdx].code);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autofocus}
          placeholder={placeholder || "Search any entity..."}
          className="w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/30 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map((entity, i) => {
            const mem = entity.latestYear?.membership?.ending;
            const growth = entity.latestYear?.membership?.growthRate;
            return (
              <button
                key={entity.code}
                onClick={() => navigate(entity.code)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between ${
                  i === selectedIdx ? 'bg-slate-800' : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <span className="text-white text-sm font-medium">{entity.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{entity.code}</span>
                </div>
                <div className="flex items-center gap-3">
                  {mem && <span className="text-xs text-slate-400 tabular-nums">{fmt(mem)}</span>}
                  {growth !== null && growth !== undefined && (
                    <span className={`text-xs tabular-nums ${growth > 0 ? 'text-emerald-400' : growth < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[10px] text-slate-600 uppercase w-16 text-right">{entity.level}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.length >= 1 && results.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 p-4 text-center">
          <span className="text-slate-500 text-sm">No entities found for &ldquo;{query}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
