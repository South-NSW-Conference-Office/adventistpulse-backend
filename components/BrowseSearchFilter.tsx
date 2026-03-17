'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { EntityWithStats } from '@/types/pulse';
import { SortableTable, type Column } from '@/components/ui';
import { tokens, cn } from '@/lib/theme';

interface BrowseSearchFilterProps {
  entities: EntityWithStats[];
  level: string;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function BrowseSearchFilter({ entities, level }: BrowseSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities;
    const query = searchQuery.toLowerCase();
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(query) ||
      entity.code.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  const levelLabel = level === 'union' ? 'unions' : level === 'field' ? 'fields' : 'conferences';

  const columns: Column<EntityWithStats>[] = [
    {
      key: 'name',
      label: 'Entity',
      align: 'left',
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (e) => (
        <div>
          <Link href={`/entity/${e.code}`} className={cn('font-medium hover:text-[#6366F1]', tokens.text.heading)}>
            {e.name}
          </Link>
          <span className="text-xs text-gray-400 dark:text-slate-600 ml-2">{e.code}</span>
        </div>
      ),
    },
    {
      key: 'members',
      label: 'Members',
      align: 'right',
      sortFn: (a, b) => (a.latestYear?.membership?.ending ?? 0) - (b.latestYear?.membership?.ending ?? 0),
      render: (e) => (
        <span className={tokens.text.heading}>{fmt(e.latestYear?.membership?.ending)}</span>
      ),
    },
    {
      key: 'churches',
      label: 'Churches',
      align: 'right',
      sortFn: (a, b) => (a.latestYear?.churches ?? 0) - (b.latestYear?.churches ?? 0),
      render: (e) => (
        <span className={tokens.text.heading}>{fmt(e.latestYear?.churches)}</span>
      ),
    },
    {
      key: 'growth',
      label: 'Growth',
      align: 'right',
      sortFn: (a, b) => (a.latestYear?.membership?.growthRate ?? -999) - (b.latestYear?.membership?.growthRate ?? -999),
      render: (e) => {
        const g = e.latestYear?.membership?.growthRate;
        if (g === null || g === undefined) return <span className="text-gray-400">—</span>;
        return (
          <span className={g > 0 ? 'text-emerald-500' : g < 0 ? 'text-red-500' : 'text-gray-500'}>
            {g > 0 ? '+' : ''}{g.toFixed(2)}%
          </span>
        );
      },
    },
    {
      key: 'years',
      label: 'Years',
      align: 'right',
      hideOnMobile: true,
      sortFn: (a, b) => (a.yearRange?.from ?? 0) - (b.yearRange?.from ?? 0),
      render: (e) => (
        <span className="text-xs text-gray-400 dark:text-slate-600">
          {e.yearRange ? `${e.yearRange.from}–${e.yearRange.to}` : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Search input */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${levelLabel}...`}
            className="w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">
            {filteredEntities.length} of {entities.length} {levelLabel} match "{searchQuery}"
          </div>
        )}
      </div>

      <SortableTable
        data={filteredEntities}
        columns={columns}
        defaultSortKey="members"
        defaultSortDir="desc"
        maxHeight="600px"
        emptyMessage={searchQuery ? `No entities found matching "${searchQuery}"` : 'No entities found'}
        rowKey={(e) => e.code}
        onRowClick={(e) => router.push(`/entity/${e.code}`)}
      />

      <div className="text-center py-2 mt-1">
        <span className="text-xs text-gray-400 dark:text-slate-600">
          {filteredEntities.length} {levelLabel}
          {searchQuery && ` (${entities.length} total)`}
        </span>
      </div>
    </div>
  );
}
