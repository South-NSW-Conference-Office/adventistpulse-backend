import Link from 'next/link';
import { getAllEntities, getEntity, getQuickStats, getEntitiesByLevel } from '@/lib/data';
import { WorldMissionMapLoader } from '@/components/WorldMissionMapLoader';
import { UnreachedTable, UnreachedStat } from '@/components/UnreachedTable';
import { StateOfAdventism } from '@/components/StateOfAdventism';
import { tokens, cn } from '@/lib/theme';
import { BarChart3, FileText, Globe2, Microscope } from 'lucide-react';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default async function Home() {
  const [allEntities, gc, gcStats, divisionsUnsorted] = await Promise.all([
    getAllEntities(),
    getEntity('G10001'),
    getQuickStats('G10001'),
    getEntitiesByLevel('division'),
  ]);
  const divisions = divisionsUnsorted
    .sort((a, b) => (b.latestYear?.membership?.ending ?? 0) - (a.latestYear?.membership?.ending ?? 0));

  return (
    <div id="main-content" className={cn("min-h-screen -mt-14", tokens.bg.page, tokens.text.heading)}>
      {/* Hero — map with overlay */}
      <WorldMissionMapLoader gcStats={gcStats} />

      {/* Search + Unfinished Work */}
      <div className={cn(tokens.bg.page)}>
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-16">

          {/* Divider */}
          <div className="mb-16 flex items-center gap-4">
            <div className={cn('flex-1 h-px', tokens.border.default)} />
            <span className={cn('text-xs font-semibold uppercase tracking-widest', tokens.text.muted)}>The Unfinished Work</span>
            <div className={cn('flex-1 h-px', tokens.border.default)} />
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-[1fr_480px] gap-12 items-start">

            {/* Left — headline + stat features */}
            <div>
              <h2 className={cn('text-4xl md:text-5xl font-extrabold leading-tight', tokens.text.heading)}>
                The work is<br />
                <span className={cn(tokens.text.accent)}>not finished.</span>
              </h2>

              <div className="mt-10 space-y-8">
                {[
                  {
                    icon: (
                      <svg className={cn('w-6 h-6', tokens.text.accent)} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                      </svg>
                    ),
                    title: 'Unreached Countries',
                    desc: 'Nations where the Adventist Church has no established, minimal, or limited presence.',
                    statKey: 'unreached',
                  },
                  {
                    icon: (
                      <svg className={cn('w-6 h-6', tokens.text.accent)} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    ),
                    title: 'People Without Access',
                    desc: 'The estimated population living in countries with no Adventist reach.',
                    statKey: 'population',
                  },
                  {
                    icon: (
                      <svg className={cn('w-6 h-6', tokens.text.accent)} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    ),
                    title: 'Zero Presence',
                    desc: 'Countries with absolutely no recorded Adventist members or churches.',
                    statKey: 'zero',
                  },
                ].map(({ icon, title, desc, statKey }) => (
                  <div key={title} className="flex items-start gap-5">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', tokens.bg.card, 'shadow-sm')}>
                      {icon}
                    </div>
                    <div>
                      <UnreachedStat statKey={statKey as 'unreached' | 'population' | 'zero'} title={title} desc={desc} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — country card list */}
            <UnreachedTable />
          </div>
        </div>
      </div>

      {/* World Divisions Rankings */}
      <div className={cn(tokens.bg.cardAlt)}>
        <div className="max-w-6xl mx-auto px-4 py-20">

          {/* Divider */}
          <div className="mb-16 flex items-center gap-4">
            <div className={cn('flex-1 h-px', tokens.border.default)} />
            <span className={cn('text-xs font-semibold uppercase tracking-widest', tokens.text.muted)}>World Divisions</span>
            <div className={cn('flex-1 h-px', tokens.border.default)} />
          </div>

          <div className="grid md:grid-cols-[560px_1fr] gap-12 items-start">

            {/* Left — two-column ranking list */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {divisions.map((div, i) => {
                const rank = i + 1;
                const membership = div.latestYear?.membership?.ending;
                const growth = div.latestYear?.membership?.growthRate;
                const shortName = div.name.replace(/\s*(Division|Union)$/i, '');
                return (
                  <Link key={div.code} href={`/entity/${div.code}`}>
                    <div className={cn('flex items-center gap-4 py-3 border-b group', tokens.border.default)}>
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', tokens.bg.card, 'shadow-sm')}>
                        <span className={cn('text-lg font-black tabular-nums', rank === 1 ? tokens.text.accent : tokens.text.muted)}>
                          {rank}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold truncate transition-colors', tokens.text.heading, `group-hover:${tokens.text.accent}`)}>{shortName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn('text-xs font-bold tabular-nums', tokens.text.heading)}>{fmt(membership)}</span>
                          {growth !== null && growth !== undefined && (
                            <span className={cn('text-[11px] font-semibold tabular-nums', growth > 0 ? tokens.text.success : growth < 0 ? tokens.text.danger : tokens.text.muted)}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Right — headline + context */}
            <div>
              <h2 className={cn('text-4xl md:text-5xl font-extrabold leading-tight', tokens.text.heading)}>
                Where the<br />
                <span className={cn(tokens.text.accent)}>church stands.</span>
              </h2>
              <p className={cn('mt-4 text-sm leading-relaxed max-w-xs', tokens.text.muted)}>
                World divisions ranked by total membership. Each division represents millions of Adventists across multiple countries and territories.
              </p>
              <div className="mt-8 space-y-6">
                {[
                  { label: 'Total Divisions', value: divisions.length.toString() },
                  { label: 'Largest Division', value: divisions[0]?.name.replace(' Division', '') ?? '—' },
                  { label: 'Total Members', value: fmt(divisions.reduce((s, d) => s + (d.latestYear?.membership?.ending ?? 0), 0)) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-5">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', tokens.bg.card, 'shadow-sm')}>
                      <div className={cn('w-2 h-2 rounded-full', tokens.bg.accent)} />
                    </div>
                    <div>
                      <p className={cn('text-xl font-extrabold tabular-nums', tokens.text.heading)}>{value}</p>
                      <p className={cn('text-sm mt-0.5', tokens.text.muted)}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/rankings" className={cn('inline-flex items-center gap-2 mt-8 text-sm font-semibold hover:underline', tokens.text.accent)}>
                Full rankings table →
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className={cn(tokens.bg.page)}>
        <div className="max-w-6xl mx-auto px-4 py-20">

          <h2 className={cn('text-4xl md:text-6xl font-extrabold text-center tracking-tight mb-16', tokens.text.heading)}>
            Explore. Analyse. <span className={cn(tokens.text.accent)}>Act.</span>
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/browse',   icon: <BarChart3  className={cn('w-10 h-10', tokens.text.accent)} />, title: 'Statistics', desc: 'Browse entities, rankings, comparisons, and at-risk alerts.' },
              { href: '/reports',  icon: <FileText   className={cn('w-10 h-10', tokens.text.accent)} />, title: 'Reports',    desc: 'Editorial deep dives, briefs, and thematic analysis.' },
              { href: '/maps',     icon: <Globe2     className={cn('w-10 h-10', tokens.text.accent)} />, title: 'Maps',       desc: 'Interactive church map, territory layers, nearest church.' },
              { href: '/research', icon: <Microscope className={cn('w-10 h-10', tokens.text.accent)} />, title: 'Research',   desc: '200+ living research projects on Adventist growth and health.' },
            ].map(({ href, icon, title, desc }) => (
              <Link key={title} href={href} className="group">
                <div className={cn('rounded-2xl border p-6 h-full flex flex-col gap-4 transition-colors', tokens.bg.card, tokens.border.default, tokens.bg.cardHover)}>
                  {icon}
                  <div>
                    <h3 className={cn('text-base font-bold', tokens.text.heading)}>{title}</h3>
                    <p className={cn('text-sm mt-1.5 leading-relaxed', tokens.text.muted)}>{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* State of Adventism summary */}
      <div className={cn(tokens.bg.cardAlt)}>
        <div className="max-w-6xl mx-auto px-4 pb-12 pt-4">
          <StateOfAdventism divisions={divisions} gcStats={gcStats} />
        </div>
      </div>

      {/* Stats footer */}
      <div className={cn('pb-12 text-center', tokens.bg.page)}>
        <p className={cn('text-xs', tokens.text.muted)}>{allEntities.length} entities tracked · Data from adventiststatistics.org</p>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Adventist Pulse — The Health of Every Adventist Entity, Measured',
  description: 'Data-driven mission intelligence for the Adventist Church. Growth analytics, health benchmarks, and member-only tools for every entity worldwide.',
};
