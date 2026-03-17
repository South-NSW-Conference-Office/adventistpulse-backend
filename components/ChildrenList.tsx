import Link from 'next/link';
import type { EntityWithStats } from '@/types/pulse';
import { LevelBadge } from './LevelBadge';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function ChildrenList({ entities }: { entities: EntityWithStats[] }) {
  // Sort by membership descending
  const sorted = [...entities].sort((a, b) => {
    const aM = a.latestYear?.membership?.ending ?? 0;
    const bM = b.latestYear?.membership?.ending ?? 0;
    return bM - aM;
  });

  const needsScroll = sorted.length > 6;

  return (
    <div className={`${needsScroll ? 'bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg overflow-hidden' : ''}`}>
      <div className={`${needsScroll ? 'max-h-[480px] overflow-y-auto p-3' : ''}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((entity) => {
            const membership = entity.latestYear?.membership?.ending;
            const churches = entity.latestYear?.churches;
            const growth = entity.latestYear?.membership?.growthRate;
            const baptisms = entity.latestYear?.membership?.baptisms;

            return (
              <Link
                key={entity.code}
                href={`/entity/${entity.code}`}
                className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 hover:border-[#6366F1]/50 hover:shadow-md dark:hover:bg-[#1f2b3d]/80 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-slate-200 group-hover:text-[#6366F1] dark:group-hover:text-white text-sm leading-tight">
                    {entity.name}
                  </h3>
                  <LevelBadge level={entity.level} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Members</span>
                    <span className="block text-gray-900 dark:text-white font-medium tabular-nums">{fmt(membership)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Churches</span>
                    <span className="block text-gray-900 dark:text-white font-medium tabular-nums">{fmt(churches)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Baptisms</span>
                    <span className="block text-gray-900 dark:text-white font-medium tabular-nums">{fmt(baptisms)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Growth</span>
                    <span className={`block font-medium tabular-nums ${
                      growth !== null && growth !== undefined
                        ? growth > 0 ? 'text-emerald-500 dark:text-emerald-400' : growth < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-slate-300'
                        : 'text-gray-400 dark:text-slate-500'
                    }`}>
                      {growth !== null && growth !== undefined
                        ? `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                </div>

                {entity.yearRange && (
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-2">
                    {entity.yearRange.from}–{entity.yearRange.to}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      {needsScroll && (
        <div className="text-center py-2 border-t border-gray-200 dark:border-[#2a3a50]">
          <span className="text-xs text-slate-600">↕ Scroll for all {sorted.length} entities</span>
        </div>
      )}
    </div>
  );
}
