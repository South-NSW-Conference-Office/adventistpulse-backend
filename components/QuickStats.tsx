import type { QuickStats } from '@/types/pulse';

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
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}

interface StatItemProps {
  label: string;
  value: string;
  accent?: boolean;
}

function StatItem({ label, value, accent }: StatItemProps) {
  return (
    <div className="flex flex-col items-center px-4 py-2 min-w-[100px]">
      <span className={`text-xl md:text-2xl font-bold tabular-nums ${
        accent ? 'text-[#14b8a6]' : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </span>
      <span className="text-xs text-gray-400 dark:text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export function QuickStatsBar({ stats }: { stats: QuickStats }) {
  return (
    <div className="flex flex-wrap justify-center md:justify-between gap-2 md:gap-0">
      <StatItem label="Members" value={fmt(stats.membership)} accent />
      <StatItem label="Churches" value={fmt(stats.churches)} />
      <StatItem label="Baptisms" value={fmt(stats.baptisms)} />
      <StatItem label="Growth" value={fmtPct(stats.growthRate)} />
      <StatItem label="Tithe" value={fmtCurrency(stats.tithe)} />
      <StatItem label="Workers" value={fmt(stats.workers)} />
      <div className="flex flex-col items-center px-4 py-2">
        <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">as of {stats.year}</span>
      </div>
    </div>
  );
}
