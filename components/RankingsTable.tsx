'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RankedEntity, RankingMetric } from '@/types/pulse';
import { SortableTable, type Column } from '@/components/ui';
import { tokens, cn } from '@/lib/theme';

function fmtValue(n: number | null, metric: RankingMetric): string {
  if (n === null) return '—';
  if (metric === 'growthRate') return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
  if (metric === 'tithe') {
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    return '$' + n.toLocaleString();
  }
  if (metric === 'tithePerCapita') return '$' + n.toFixed(0);
  return n.toLocaleString();
}

function metricLabel(metric: RankingMetric): string {
  switch (metric) {
    case 'growthRate': return 'Growth Rate';
    case 'tithePerCapita': return 'Tithe/Capita';
    default: return metric.charAt(0).toUpperCase() + metric.slice(1);
  }
}

export function RankingsTable({ rankings, metric }: { rankings: RankedEntity[]; metric: RankingMetric }) {
  const router = useRouter();

  if (rankings.length === 0) {
    return <div className="text-center text-slate-500 py-12">No rankings data available for this selection.</div>;
  }

  const maxValue = Math.max(...rankings.map(r => Math.abs(r.value ?? 0)));

  const columns: Column<RankedEntity>[] = [
    {
      key: 'rank',
      label: '#',
      align: 'left',
      sortFn: (a, b) => a.rank - b.rank,
      render: (e) => <span className="text-gray-400 dark:text-slate-600 font-mono text-xs">{e.rank}</span>,
    },
    {
      key: 'name',
      label: 'Entity',
      align: 'left',
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (e) => (
        <div>
          <Link href={`/entity/${e.code}`} className={cn('font-medium hover:text-[#14b8a6]', tokens.text.heading)} onClick={ev => ev.stopPropagation()}>
            {e.name}
          </Link>
          <span className="text-xs text-gray-400 dark:text-slate-600 ml-2">{e.level}</span>
        </div>
      ),
    },
    {
      key: 'value',
      label: metricLabel(metric),
      align: 'right',
      sortFn: (a, b) => (a.value ?? 0) - (b.value ?? 0),
      render: (e) => {
        const isGrowth = metric === 'growthRate';
        const isPositive = (e.value ?? 0) >= 0;
        return (
          <span className={cn(
            'font-medium',
            isGrowth ? (isPositive ? 'text-emerald-500' : 'text-red-500') : tokens.text.heading
          )}>
            {fmtValue(e.value, metric)}
          </span>
        );
      },
    },
    {
      key: 'bar',
      label: '',
      align: 'left',
      hideOnMobile: true,
      render: (e) => {
        const barWidth = maxValue > 0 ? Math.abs(e.value ?? 0) / maxValue * 100 : 0;
        const isPositive = (e.value ?? 0) >= 0;
        return (
          <div className="w-full bg-gray-100 dark:bg-[#2a3a50] rounded-full h-2 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', isPositive ? 'bg-[#14b8a6]' : 'bg-red-500')}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        );
      },
    },
    {
      key: 'year',
      label: 'Year',
      align: 'right',
      sortFn: (a, b) => (a.year ?? 0) - (b.year ?? 0),
      render: (e) => <span className="text-xs text-gray-400 dark:text-slate-600">{e.year ?? '—'}</span>,
    },
  ];

  return (
    <SortableTable
      data={rankings}
      columns={columns}
      defaultSortKey="rank"
      defaultSortDir="asc"
      maxHeight="600px"
      rowKey={(e) => e.code}
      onRowClick={(e) => router.push(`/entity/${e.code}`)}
    />
  );
}
