'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CompareEntity {
  code: string;
  name: string;
  membership: number | null;
  churches: number | null;
  baptisms: number | null;
  growthRate: number | null;
  workers: number | null;
  tithe: number | null;
}

type SortKey = 'name' | 'membership' | 'churches' | 'baptisms' | 'growthRate' | 'workers' | 'tithe';
type SortDir = 'asc' | 'desc';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  return '$' + n.toLocaleString();
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
      className={`py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none ${className ?? ''}`}
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

export function CompareTable({ entities }: { entities: CompareEntity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('membership');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  const sorted = [...entities].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const diff = (av as number) - (bv as number);
    return sortDir === 'asc' ? diff : -diff;
  });

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg overflow-hidden">
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[#1f2b3d] z-10">
            <tr className="border-b border-slate-700">
              <SortHeader label="Entity" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-left" />
              <SortHeader label="Members" sortKey="membership" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Churches" sortKey="churches" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Baptisms" sortKey="baptisms" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Growth" sortKey="growthRate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortHeader label="Workers" sortKey="workers" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
              <SortHeader label="Tithe" sortKey="tithe" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <tr key={e.code} className="border-b border-gray-200 dark:border-[#2a3a50]/50 hover:bg-gray-100/50 dark:hover:bg-slate-800/30">
                <td className="py-3 px-3">
                  <Link href={`/entity/${e.code}`} className="text-white hover:text-[#14b8a6] font-medium">
                    {e.name}
                  </Link>
                  <span className="text-xs text-slate-600 ml-2">{e.code}</span>
                </td>
                <td className="py-3 px-3 text-right text-white tabular-nums">{fmt(e.membership)}</td>
                <td className="py-3 px-3 text-right text-white tabular-nums">{fmt(e.churches)}</td>
                <td className="py-3 px-3 text-right text-white tabular-nums">{fmt(e.baptisms)}</td>
                <td className={`py-3 px-3 text-right tabular-nums ${
                  e.growthRate !== null
                    ? e.growthRate > 0 ? 'text-emerald-400' : e.growthRate < 0 ? 'text-red-400' : 'text-slate-300'
                    : 'text-slate-500'
                }`}>
                  {fmtPct(e.growthRate)}
                </td>
                <td className="py-3 px-3 text-right text-white tabular-nums hidden md:table-cell">{fmt(e.workers)}</td>
                <td className="py-3 px-3 text-right text-white tabular-nums hidden md:table-cell">{fmtCurrency(e.tithe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
