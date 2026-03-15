'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, TrendingUp, Users, Church, Target, Zap } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';
import { SortableTable, type Column } from '@/components/ui';

interface RankedEntity {
  code: string;
  name: string;
  level: string;
  parentCode: string;
  membership: number;
  churches: number;
  baptisms: number;
  growthRate: number | null;
  membersPerChurch: number;
  baptismsPerChurch: number;
  year: number;
}

type Scope = 'siblings' | 'all';

interface Props {
  data: RankedEntity[];
  level: string;
  levelLabel: string;
  highlightCode: string;
  highlightName: string;
  parentCode: string;
  parentName: string;
}

const METRICS = [
  { key: 'membership', label: 'Membership', icon: Users, fmt: (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toString() },
  { key: 'churches', label: 'Churches', icon: Church, fmt: (n: number) => n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toString() },
  { key: 'baptisms', label: 'Baptisms', icon: Target, fmt: (n: number) => n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toString() },
  { key: 'growthRate', label: 'Growth Rate', icon: TrendingUp, fmt: (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%` },
  { key: 'membersPerChurch', label: 'Members/Church', icon: Users, fmt: (n: number) => n.toLocaleString() },
  { key: 'baptismsPerChurch', label: 'Baptisms/Church', icon: Zap, fmt: (n: number) => n.toFixed(1) },
] as const;

type MetricKey = typeof METRICS[number]['key'];

function getRank(data: RankedEntity[], metric: MetricKey, code: string): { rank: number; total: number; value: number; best: RankedEntity } {
  const sorted = [...data]
    .filter(e => metric === 'growthRate' ? e.growthRate !== null : true)
    .sort((a, b) => {
      const av = metric === 'growthRate' ? (a.growthRate ?? -999) : (a as any)[metric];
      const bv = metric === 'growthRate' ? (b.growthRate ?? -999) : (b as any)[metric];
      return bv - av;
    });
  const idx = sorted.findIndex(e => e.code === code);
  return {
    rank: idx + 1,
    total: sorted.length,
    value: metric === 'growthRate' ? (data.find(e => e.code === code)?.growthRate ?? 0) : (data.find(e => e.code === code) as any)?.[metric] ?? 0,
    best: sorted[0],
  };
}

export function RankingsClient({ data, level, levelLabel, highlightCode, highlightName, parentCode, parentName }: Props) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('membership');
  const [scope, setScope] = useState<Scope>(parentCode ? 'siblings' : 'all');
  const router = useRouter();

  const LEVELS = [
    { key: 'division', label: 'Divisions' },
    { key: 'union', label: 'Unions' },
    { key: 'conference', label: 'Conferences' },
  ];

  // Filter data by scope
  const scopedData = useMemo(() => {
    if (scope === 'siblings' && parentCode) {
      return data.filter(e => e.parentCode === parentCode);
    }
    return data;
  }, [data, scope, parentCode]);

  // Summary ranks for highlighted entity
  const summaryRanks = useMemo(() => {
    if (!highlightCode) return null;
    return METRICS.map(m => ({
      ...m,
      ...getRank(scopedData, m.key, highlightCode),
    }));
  }, [scopedData, highlightCode]);

  // Table columns
  const columns: Column<RankedEntity>[] = useMemo(() => {
    const metricDef = METRICS.find(m => m.key === activeMetric)!;
    
    // Sort data for rank
    const sorted = [...scopedData].sort((a, b) => {
      const av = activeMetric === 'growthRate' ? (a.growthRate ?? -999) : (a as any)[activeMetric];
      const bv = activeMetric === 'growthRate' ? (b.growthRate ?? -999) : (b as any)[activeMetric];
      return bv - av;
    });
    const rankMap = new Map(sorted.map((e, i) => [e.code, i + 1]));

    return [
      {
        key: 'rank',
        label: '#',
        align: 'left' as const,
        sortFn: (a: RankedEntity, b: RankedEntity) => (rankMap.get(a.code) ?? 0) - (rankMap.get(b.code) ?? 0),
        render: (e: RankedEntity) => {
          const r = rankMap.get(e.code) ?? 0;
          return <span className={cn('font-mono text-xs', r <= 3 ? 'text-[#6366F1] font-bold' : 'text-gray-400 dark:text-slate-600')}>{r}</span>;
        },
      },
      {
        key: 'name',
        label: 'Entity',
        align: 'left' as const,
        sortFn: (a: RankedEntity, b: RankedEntity) => a.name.localeCompare(b.name),
        render: (e: RankedEntity) => (
          <span className={cn('font-medium', e.code === highlightCode ? 'text-[#6366F1]' : tokens.text.heading)}>
            {e.code === highlightCode && <Trophy className="w-3.5 h-3.5 inline mr-1.5 text-[#6366F1]" />}
            {e.name}
          </span>
        ),
      },
      {
        key: activeMetric,
        label: metricDef.label,
        align: 'right' as const,
        sortFn: (a: RankedEntity, b: RankedEntity) => {
          const av = activeMetric === 'growthRate' ? (a.growthRate ?? -999) : (a as any)[activeMetric];
          const bv = activeMetric === 'growthRate' ? (b.growthRate ?? -999) : (b as any)[activeMetric];
          return av - bv;
        },
        render: (e: RankedEntity) => {
          const v = activeMetric === 'growthRate' ? e.growthRate : (e as any)[activeMetric];
          if (v === null || v === undefined) return <span className="text-gray-400">—</span>;
          const isGrowth = activeMetric === 'growthRate';
          return (
            <span className={cn('font-medium tabular-nums', isGrowth ? (v > 0 ? 'text-emerald-500' : 'text-red-500') : tokens.text.heading)}>
              {metricDef.fmt(v)}
            </span>
          );
        },
      },
      {
        key: 'bar',
        label: '',
        align: 'left' as const,
        hideOnMobile: true,
        render: (e: RankedEntity) => {
          const v = activeMetric === 'growthRate' ? Math.abs(e.growthRate ?? 0) : (e as any)[activeMetric];
          const maxV = Math.max(...scopedData.map(d => activeMetric === 'growthRate' ? Math.abs(d.growthRate ?? 0) : (d as any)[activeMetric]));
          const pct = maxV > 0 ? (v / maxV) * 100 : 0;
          return (
            <div className="w-full bg-gray-100 dark:bg-[#2a3a50] rounded-full h-2 overflow-hidden">
              <div className={cn('h-full rounded-full', e.code === highlightCode ? 'bg-[#6366F1]' : 'bg-gray-300 dark:bg-slate-600')} style={{ width: `${pct}%` }} />
            </div>
          );
        },
      },
      {
        key: 'year',
        label: 'Year',
        align: 'right' as const,
        hideOnMobile: true,
        sortFn: (a: RankedEntity, b: RankedEntity) => a.year - b.year,
        render: (e: RankedEntity) => <span className="text-xs text-gray-400 dark:text-slate-600">{e.year || '—'}</span>,
      },
    ];
  }, [scopedData, activeMetric, highlightCode]);

  return (
    <div>
      {/* Back button */}
      {highlightCode && (
        <Link href={`/entity/${highlightCode}`} className="inline-flex items-center gap-1.5 text-sm text-[#6366F1] hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to {highlightName}
        </Link>
      )}

      {/* Title */}
      <h1 className={cn('text-2xl md:text-3xl font-bold mb-1', tokens.text.heading)}>
        {highlightCode ? `${highlightName} Rankings` : `${levelLabel} Rankings`}
      </h1>
      <p className={cn('text-sm mb-4', tokens.text.body)}>
        {highlightCode
          ? scope === 'siblings' && parentName
            ? `Where ${highlightName} stands among ${scopedData.length} ${parentName} ${levelLabel.toLowerCase()}`
            : `Where ${highlightName} stands among all ${scopedData.length} ${levelLabel.toLowerCase()} worldwide`
          : `Compare ${scopedData.length} ${levelLabel.toLowerCase()} across key metrics`
        }
      </p>

      {/* Scope toggle (only when highlighting and has parent) */}
      {highlightCode && parentCode && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setScope('siblings')}
            className={cn(
              'text-xs px-4 py-2 rounded-lg font-medium transition-colors border',
              scope === 'siblings'
                ? 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30'
                : cn(tokens.bg.card, tokens.border.default, 'text-gray-500 dark:text-slate-400'),
            )}
          >
            {parentName} only ({data.filter(e => e.parentCode === parentCode).length})
          </button>
          <button
            onClick={() => setScope('all')}
            className={cn(
              'text-xs px-4 py-2 rounded-lg font-medium transition-colors border',
              scope === 'all'
                ? 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30'
                : cn(tokens.bg.card, tokens.border.default, 'text-gray-500 dark:text-slate-400'),
            )}
          >
            All {levelLabel} ({data.length})
          </button>
        </div>
      )}

      {/* Summary cards (when highlighting) */}
      {summaryRanks && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {summaryRanks.map(r => {
            const Icon = r.icon;
            const isTop3 = r.rank <= 3;
            return (
              <button
                key={r.key}
                onClick={() => setActiveMetric(r.key)}
                className={cn(
                  'rounded-xl p-3 border text-left transition-all',
                  activeMetric === r.key
                    ? 'border-[#6366F1] bg-[#6366F1]/5 dark:bg-[#6366F1]/10'
                    : cn(tokens.bg.card, tokens.border.default, 'hover:border-[#6366F1]/30'),
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span className="text-[10px] text-gray-500 dark:text-slate-500">{r.label}</span>
                </div>
                <div className={cn('text-lg font-extrabold', tokens.text.heading)}>
                  {r.fmt(r.value)}
                </div>
                <div className={cn('text-xs mt-0.5', isTop3 ? 'text-[#6366F1] font-semibold' : 'text-gray-400 dark:text-slate-500')}>
                  {isTop3 && <Trophy className="w-4 h-4 inline-block mr-1 text-amber-400" />}#{r.rank} of {r.total}
                </div>
                {r.rank > 1 && (
                  <div className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">
                    Best: {r.best.name.length > 15 ? r.best.name.slice(0, 15) + '…' : r.best.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Level tabs (when not highlighting) */}
      {!highlightCode && (
        <div className="flex gap-2 mb-4">
          {LEVELS.map(l => (
            <Link
              key={l.key}
              href={`/rankings?level=${l.key}`}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                level === l.key
                  ? 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30'
                  : cn(tokens.bg.card, tokens.border.default, 'border text-gray-500 dark:text-slate-400'),
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Metric pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5',
                activeMetric === m.key
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : cn(tokens.bg.card, tokens.border.default, 'text-gray-500 dark:text-slate-400 hover:border-[#6366F1]/50'),
              )}
            >
              <Icon className="w-3 h-3" /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <SortableTable
        data={scopedData}
        columns={columns}
        defaultSortKey="rank"
        defaultSortDir="asc"
        maxHeight="600px"
        rowKey={(e) => e.code}
        onRowClick={(e) => router.push(`/entity/${e.code}`)}
      />
    </div>
  );
}
