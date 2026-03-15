'use client';

import { useState } from 'react';
import type { YearlyStats } from '@/types/pulse';

type SortKey = 'year' | 'membership' | 'accessions' | 'churches' | 'growthRate' | 'workers' | 'tithe';
type SortDir = 'asc' | 'desc';

function fmt(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString();
}

function fmtPct(n: number | null): string {
  if (n === null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

// Kingdom growth = baptisms + profession of faith (not transfers)
function getAccessions(s: YearlyStats): number | null {
  const b = s.membership.baptisms;
  const p = s.membership.professionOfFaith;
  if (b === null && p === null) return null;
  return (b ?? 0) + (p ?? 0);
}

function getValue(s: YearlyStats, key: SortKey): number | null {
  switch (key) {
    case 'year': return s.year;
    case 'membership': return s.membership.ending;
    case 'accessions': return getAccessions(s);
    case 'churches': return s.churches;
    case 'growthRate': return s.membership.growthRate;
    case 'workers': return s.workers.totalWorkers;
    case 'tithe': return s.finance.tithe;
  }
}

function SortHeader({ label, sortKey, currentKey, currentDir, onSort, className }: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={`py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none ${className ?? ''}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-[#14b8a6]">{currentDir === 'desc' ? '↓' : '↑'}</span>
        )}
      </span>
    </th>
  );
}

function BreakdownRow({ stats }: { stats: YearlyStats }) {
  const m = stats.membership;
  return (
    <tr className="bg-[#F8F9FA] dark:bg-[#1a2332]/50">
      <td colSpan={7} className="px-3 py-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
          <div className="text-slate-500">
            <span className="text-emerald-500/70">↑</span> Baptisms: <span className="text-gray-700 dark:text-slate-300">{fmt(m.baptisms)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-emerald-500/70">↑</span> Profession: <span className="text-gray-700 dark:text-slate-300">{fmt(m.professionOfFaith)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-emerald-500/70">↑</span> Transfers In: <span className="text-gray-700 dark:text-slate-300">{fmt(m.transfersIn)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-emerald-500/70">↑</span> Total Gains: <span className="text-gray-700 dark:text-slate-300">{fmt(m.totalGains)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-red-500/70">↓</span> Deaths: <span className="text-gray-700 dark:text-slate-300">{fmt(m.deaths)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-red-500/70">↓</span> Dropped: <span className="text-gray-700 dark:text-slate-300">{fmt(m.dropped)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-red-500/70">↓</span> Transfers Out: <span className="text-gray-700 dark:text-slate-300">{fmt(m.transfersOut)}</span>
          </div>
          <div className="text-slate-500">
            <span className="text-red-500/70">↓</span> Total Losses: <span className="text-gray-700 dark:text-slate-300">{fmt(m.totalLosses)}</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function MetricsTable({ stats }: { stats: YearlyStats[] }) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // Sort
  const rows = [...stats].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    const diff = av - bv;
    return sortDir === 'asc' ? diff : -diff;
  });

  // Find highest value for current sort to highlight
  const highestIdx = sortKey !== 'year' ? (() => {
    let maxVal = -Infinity;
    let maxI = -1;
    rows.forEach((s, i) => {
      const v = getValue(s, sortKey);
      if (v !== null && v > maxVal) { maxVal = v; maxI = i; }
    });
    return maxI;
  })() : -1;

  function toggleYear(year: number) {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg overflow-hidden">
      <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[#1f2b3d] z-10">
            <tr className="border-b border-slate-700">
              <SortHeader label="Year" sortKey="year" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-left" />
              <SortHeader label="Members" sortKey="membership" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Baptisms+POF" sortKey="accessions" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Churches" sortKey="churches" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Growth" sortKey="growthRate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Workers" sortKey="workers" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Tithe" sortKey="tithe" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const isExpanded = expandedYears.has(s.year);
              const hasBreakdown = s.membership.totalGains !== null || s.membership.totalLosses !== null;
              const isHighest = i === highestIdx;
              return (
                <>
                  <tr
                    key={s.year}
                    className={`border-b border-gray-200 dark:border-[#2a3a50]/50 hover:bg-gray-100 dark:hover:bg-gray-100/50 dark:hover:bg-slate-800/30 ${hasBreakdown ? 'cursor-pointer' : ''} ${isHighest ? 'bg-[#14b8a6]/5' : ''}`}
                    onClick={() => hasBreakdown && toggleYear(s.year)}
                  >
                    <td className="py-2 px-3 text-gray-700 dark:text-slate-300 font-medium tabular-nums">
                      {hasBreakdown && (
                        <span className="text-slate-600 mr-1 text-xs">{isExpanded ? '▾' : '▸'}</span>
                      )}
                      {s.year}
                      {isHighest && <span className="ml-1 text-[#14b8a6] text-xs">★</span>}
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isHighest && sortKey === 'membership' ? 'text-[#8b5cf6] font-semibold' : 'text-gray-900 dark:text-white'}`}>{fmt(s.membership.ending)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isHighest && sortKey === 'accessions' ? 'text-[#8b5cf6] font-semibold' : 'text-gray-900 dark:text-white'}`}>{fmt(getAccessions(s))}</td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isHighest && sortKey === 'churches' ? 'text-[#8b5cf6] font-semibold' : 'text-gray-900 dark:text-white'}`}>{fmt(s.churches)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums ${
                      isHighest && sortKey === 'growthRate' ? 'text-[#8b5cf6] font-semibold' :
                      s.membership.growthRate !== null
                        ? s.membership.growthRate > 0 ? 'text-emerald-400' : s.membership.growthRate < 0 ? 'text-red-400' : 'text-gray-500 dark:text-slate-300'
                        : 'text-slate-500'
                    }`}>
                      {fmtPct(s.membership.growthRate)}
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isHighest && sortKey === 'workers' ? 'text-[#8b5cf6] font-semibold' : 'text-gray-900 dark:text-white'}`}>{fmt(s.workers.totalWorkers)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden md:table-cell ${isHighest && sortKey === 'tithe' ? 'text-[#8b5cf6] font-semibold' : 'text-gray-900 dark:text-white'}`}>
                      {s.finance.tithe !== null ? `$${s.finance.tithe.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                  {isExpanded && hasBreakdown && (
                    <BreakdownRow key={`${s.year}-breakdown`} stats={s} />
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <div className="text-center py-2 border-t border-gray-200 dark:border-[#2a3a50]">
          <span className="text-xs text-slate-600">↕ {rows.length} years · Click headers to sort · Click rows for breakdown</span>
        </div>
      )}
    </div>
  );
}
