'use client';

import { useEffect, useState, useMemo } from 'react';
import { tokens, cn } from '@/lib/theme';

interface CountryData {
  country: string;
  population: number;
  adventist_members: number;
  churches: number;
  division: string;
  ratio: number;
  presence: 'established' | 'limited' | 'minimal' | 'none';
}

type SortKey = 'country' | 'population' | 'adventist_members' | 'presence';
type SortDir = 'asc' | 'desc';

function formatPop(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

const PRESENCE_ORDER = { none: 0, minimal: 1, limited: 2, established: 3 };
const PRESENCE_LABELS: Record<string, { label: string; color: string }> = {
  none:    { label: 'No presence', color: 'bg-red-600 text-white' },
  minimal: { label: 'Minimal',    color: 'bg-red-400 text-white' },
  limited: { label: 'Limited',    color: 'bg-amber-500 text-white' },
};

function SortHeader({ label, sortKey, currentSort, currentDir, onSort, className = '' }: {
  label: string; sortKey: SortKey; currentSort: SortKey; currentDir: SortDir;
  onSort: (key: SortKey) => void; className?: string;
}) {
  const active = currentSort === sortKey;
  return (
    <th 
      className={cn("px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-500 cursor-pointer select-none hover:text-[#6366F1] transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn("text-[10px]", active ? "text-[#6366F1]" : "opacity-30")}>
          {active ? (currentDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  );
}

export function UnreachedTable() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [filter, setFilter] = useState<'all' | 'none' | 'minimal' | 'limited'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('population');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetch('/data/country-mission-data.json')
      .then(r => r.json())
      .then(data => {
        const unreached = data.countries
          .filter((c: CountryData) => c.presence === 'none' || c.presence === 'minimal' || c.presence === 'limited')
          .filter((c: CountryData) => c.population > 5000);
        setCountries(unreached);
      });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'country' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    let list = filter === 'all' ? countries : countries.filter(c => c.presence === filter);
    
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'country': cmp = a.country.localeCompare(b.country); break;
        case 'population': cmp = a.population - b.population; break;
        case 'adventist_members': cmp = a.adventist_members - b.adventist_members; break;
        case 'presence': cmp = PRESENCE_ORDER[a.presence] - PRESENCE_ORDER[b.presence]; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    
    return list;
  }, [countries, filter, sortKey, sortDir]);

  const totalPop = filtered.reduce((sum, c) => sum + c.population, 0);
  const noneCount = countries.filter(c => c.presence === 'none').length;
  const minimalCount = countries.filter(c => c.presence === 'minimal').length;
  const limitedCount = countries.filter(c => c.presence === 'limited').length;

  if (countries.length === 0) return null;

  return (
    <div>
      {/* Header stats */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className={cn('rounded-lg px-4 py-3 border flex-1 min-w-[120px]', tokens.bg.card, tokens.border.default)}>
          <div className="text-2xl font-extrabold text-red-500">{noneCount + minimalCount + limitedCount}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Unreached countries</div>
        </div>
        <div className={cn('rounded-lg px-4 py-3 border flex-1 min-w-[120px]', tokens.bg.card, tokens.border.default)}>
          <div className="text-2xl font-extrabold text-red-500">{formatPop(totalPop)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">People without access</div>
        </div>
        <div className={cn('rounded-lg px-4 py-3 border flex-1 min-w-[120px]', tokens.bg.card, tokens.border.default)}>
          <div className="text-2xl font-extrabold text-[#6366F1]">{noneCount}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Zero presence</div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {([['all', 'All'], ['none', 'No Presence'], ['minimal', 'Minimal'], ['limited', 'Limited']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              filter === key 
                ? 'bg-[#6366F1] text-white border-[#6366F1]' 
                : cn(tokens.bg.card, tokens.border.default, 'text-gray-500 dark:text-slate-400 hover:border-[#6366F1]/50')
            )}
          >
            {label} {key === 'all' ? `(${countries.length})` : key === 'none' ? `(${noneCount})` : key === 'minimal' ? `(${minimalCount})` : `(${limitedCount})`}
          </button>
        ))}
      </div>

      {/* Scrollable table */}
      <div className={cn('rounded-xl border overflow-hidden', tokens.border.default)}>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className={cn('sticky top-0 z-10', tokens.bg.card)}>
              <tr className="border-b border-gray-200 dark:border-[#2a3a50]">
                <SortHeader label="Country" sortKey="country" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <SortHeader label="Population" sortKey="population" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="Members" sortKey="adventist_members" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right hidden sm:table-cell" />
                <SortHeader label="Status" sortKey="presence" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const p = PRESENCE_LABELS[c.presence];
                return (
                  <tr 
                    key={c.country} 
                    className={cn('border-b border-gray-100 dark:border-[#2a3a50]/50 hover:bg-gray-50 dark:hover:bg-[#253347] transition-colors', tokens.bg.card)}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn('font-medium', tokens.text.heading)}>{c.country}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-600 ml-2">{c.division}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 dark:text-slate-400 tabular-nums">
                      {formatPop(c.population)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 dark:text-slate-400 tabular-nums hidden sm:table-cell">
                      {c.adventist_members > 0 ? c.adventist_members.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p?.color || 'bg-gray-500 text-white')}>
                        {p?.label || c.presence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-600 mt-3 text-center italic">
        "Go ye therefore, and teach all nations" — Matthew 28:19
      </p>
    </div>
  );
}
