export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getEntitiesByLevel } from '@/lib/data';
import { tokens, cn } from '@/lib/theme';
import { AlertTriangle, TrendingDown, Users, Church } from 'lucide-react';

export const metadata = {
  title: 'Entities at Risk | Adventist Pulse',
  description: 'Conferences and unions showing concerning trends — declining membership, low baptism rates, or stalling growth.',
};

export default async function AtRiskPage() {
  const conferences = await getEntitiesByLevel('conference').catch(() => []);

  // Identify at-risk entities: declining or zero growth
  const atRisk = conferences
    .filter(e => e.latestYear?.membership?.ending && e.latestYear.membership.ending > 0)
    .map(e => {
      const gr = e.latestYear?.membership?.growthRate ?? 0;
      const mem = e.latestYear?.membership?.ending ?? 0;
      const bap = e.latestYear?.membership?.baptisms ?? 0;
      const churches = e.latestYear?.churches ?? 0;
      const bapPerChurch = churches > 0 ? bap / churches : 0;
      const risk = gr < 0 ? 'high' : gr < 0.5 ? 'medium' : bapPerChurch < 1 ? 'medium' : null;
      return { ...e, growthRate: gr, membership: mem, baptisms: bap, churches, bapPerChurch, risk };
    })
    .filter(e => e.risk)
    .sort((a, b) => a.growthRate - b.growthRate);

  const highRisk = atRisk.filter(e => e.risk === 'high');
  const mediumRisk = atRisk.filter(e => e.risk === 'medium');

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className={cn('text-2xl font-extrabold', tokens.text.heading)}>Entities at Risk</h1>
        </div>
        <p className={cn('text-sm mb-8 max-w-xl', tokens.text.muted)}>
          Conferences showing declining membership, negative growth, or critically low baptism rates. Data from most recent available year.
        </p>

        {atRisk.length === 0 ? (
          <div className={cn('rounded-xl border p-12 text-center', tokens.bg.card, tokens.border.default)}>
            <p className={cn('text-sm', tokens.text.muted)}>No at-risk data available yet — statistics are still being loaded.</p>
          </div>
        ) : (
          <>
            {highRisk.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className={cn('text-sm font-bold uppercase tracking-wider', tokens.text.heading)}>
                    Declining — Negative Growth ({highRisk.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {highRisk.map(e => (
                    <RiskCard key={e.code} entity={e} />
                  ))}
                </div>
              </div>
            )}

            {mediumRisk.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className={cn('text-sm font-bold uppercase tracking-wider', tokens.text.heading)}>
                    Stalling — Low Growth or Baptisms ({mediumRisk.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {mediumRisk.map(e => (
                    <RiskCard key={e.code} entity={e} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className={cn('rounded-xl border p-5 mt-6 text-sm', tokens.bg.card, tokens.border.default)}>
          <p className={cn('font-semibold mb-1', tokens.text.heading)}>How risk is assessed</p>
          <ul className={cn('space-y-1 text-xs', tokens.text.muted)}>
            <li>🔴 <strong>High risk</strong> — negative membership growth rate</li>
            <li>🟡 <strong>Medium risk</strong> — growth below 0.5% per year, or fewer than 1 baptism per church</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function RiskCard({ entity }: { entity: any }) {
  const isDecline = entity.growthRate < 0;
  return (
    <Link
      href={`/entity/${entity.code}`}
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 hover:border-[#6366F1]/50 transition-colors',
        isDecline
          ? 'border-red-500/20 bg-red-500/5 dark:bg-red-900/10'
          : 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-900/10',
        'hover:bg-transparent'
      )}
    >
      <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
        isDecline ? 'bg-red-500/10' : 'bg-amber-500/10'
      )}>
        <TrendingDown className={cn('w-5 h-5', isDecline ? 'text-red-500' : 'text-amber-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', 'text-gray-900 dark:text-white')}>{entity.name}</p>
        <p className={cn('text-xs', 'text-gray-500 dark:text-slate-400')}>{entity.code}</p>
      </div>
      <div className="flex gap-5 text-right flex-shrink-0">
        <div>
          <div className={cn('text-sm font-bold tabular-nums', isDecline ? 'text-red-500' : 'text-amber-500')}>
            {entity.growthRate > 0 ? '+' : ''}{entity.growthRate?.toFixed(2) ?? '—'}%
          </div>
          <div className="text-[10px] text-gray-400 dark:text-slate-500">growth</div>
        </div>
        <div>
          <div className={cn('text-sm font-bold tabular-nums', 'text-gray-700 dark:text-slate-300')}>
            {entity.membership >= 1000 ? `${(entity.membership/1000).toFixed(1)}K` : entity.membership}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-0.5 justify-end">
            <Users className="w-2.5 h-2.5" />members
          </div>
        </div>
        <div>
          <div className={cn('text-sm font-bold tabular-nums', 'text-gray-700 dark:text-slate-300')}>
            {entity.bapPerChurch?.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-0.5 justify-end">
            <Church className="w-2.5 h-2.5" />bap/ch
          </div>
        </div>
      </div>
    </Link>
  );
}
