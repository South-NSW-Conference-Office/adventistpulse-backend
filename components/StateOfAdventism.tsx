import Link from 'next/link';
import type { EntityWithStats } from '@/types/pulse';

interface Props {
  divisions: EntityWithStats[];
  gcStats: any;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function StateOfAdventism({ divisions, gcStats }: Props) {
  // Calculate aggregated insights
  const growing = divisions.filter(d => (d.latestYear?.membership?.growthRate ?? 0) > 0);
  const declining = divisions.filter(d => (d.latestYear?.membership?.growthRate ?? 0) < 0);
  const stagnant = divisions.filter(d => {
    const r = d.latestYear?.membership?.growthRate;
    return r !== null && r !== undefined && r === 0;
  });

  const fastestGrowing = [...divisions]
    .filter(d => d.latestYear?.membership?.growthRate !== null)
    .sort((a, b) => (b.latestYear?.membership?.growthRate ?? 0) - (a.latestYear?.membership?.growthRate ?? 0))
    .slice(0, 3);

  const fastestDeclining = [...divisions]
    .filter(d => (d.latestYear?.membership?.growthRate ?? 0) < 0)
    .sort((a, b) => (a.latestYear?.membership?.growthRate ?? 0) - (b.latestYear?.membership?.growthRate ?? 0))
    .slice(0, 3);

  const totalBaptisms = divisions.reduce((sum, d) => sum + (d.latestYear?.membership?.baptisms ?? 0), 0);

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">State of Adventism</h3>
          <p className="text-xs text-slate-500 mt-1">Global snapshot from the latest available data</p>
        </div>
        <span className="text-xs bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30 px-2 py-1 rounded">
          {gcStats?.year || '2024'}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Growth summary */}
        <div>
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Division Health</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">Growing divisions</span>
              <span className="text-sm font-medium text-emerald-400">{growing.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">Declining divisions</span>
              <span className="text-sm font-medium text-red-400">{declining.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">Total baptisms</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{fmt(totalBaptisms)}</span>
            </div>
          </div>
        </div>

        {/* Fastest growing */}
        <div>
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Fastest Growing</h4>
          <div className="space-y-2">
            {fastestGrowing.map(div => (
              <div key={div.code} className="flex items-center justify-between">
                <Link href={`/entity/${div.code}`} className="text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {div.name}
                </Link>
                <span className="text-sm font-medium text-emerald-400 tabular-nums">
                  +{(div.latestYear?.membership?.growthRate ?? 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* At risk */}
        {fastestDeclining.length > 0 && (
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Needs Attention</h4>
            <div className="space-y-2">
              {fastestDeclining.map(div => (
                <div key={div.code} className="flex items-center justify-between">
                  <Link href={`/entity/${div.code}`} className="text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {div.name}
                  </Link>
                  <span className="text-sm font-medium text-red-400 tabular-nums">
                    {(div.latestYear?.membership?.growthRate ?? 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key insight */}
        <div>
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Key Insight</h4>
          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
            {growing.length > declining.length
              ? `${growing.length} of ${divisions.length} divisions are growing. The church is expanding in ${growing.map(d => d.code).join(', ')}, driven primarily by ${fastestGrowing[0]?.name || 'emerging regions'}.`
              : `${declining.length} of ${divisions.length} divisions are declining. The growth engine is concentrated in ${fastestGrowing[0]?.name || 'fewer regions'}.`
            }
          </p>
          <Link href="/at-risk" className="text-xs text-[#6366F1] hover:text-[#8b5cf6] mt-2 inline-block">
            View all at-risk entities →
          </Link>
        </div>
      </div>
    </div>
  );
}
