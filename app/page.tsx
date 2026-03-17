import Link from 'next/link';
import { getAllEntities, getEntity, getQuickStats, getEntitiesByLevel } from '@/lib/data';
import { WorldMissionMapLoader } from '@/components/WorldMissionMapLoader';
import { UnreachedTable, UnreachedStat } from '@/components/UnreachedTable';
import { StateOfAdventism } from '@/components/StateOfAdventism';
import { tokens, cn } from '@/lib/theme';
import { Card, Section, StatCard } from '@/components/ui';
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
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-16">

          {/* Divider */}
          <div className="mb-16 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">The Unfinished Work</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-[1fr_480px] gap-12 items-start">

            {/* Left — headline + stat features */}
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                The work is<br />
                <span className="text-[#6366F1]">not finished.</span>
              </h2>

              <div className="mt-10 space-y-8">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                      </svg>
                    ),
                    stat: null,
                    title: 'Unreached Countries',
                    desc: 'Nations where the Adventist Church has no established, minimal, or limited presence.',
                    statKey: 'unreached',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    ),
                    title: 'People Without Access',
                    desc: 'The estimated population living in countries with no Adventist reach.',
                    statKey: 'population',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    ),
                    title: 'Zero Presence',
                    desc: 'Countries with absolutely no recorded Adventist members or churches.',
                    statKey: 'zero',
                  },
                ].map(({ icon, title, desc, statKey }) => (
                  <div key={title} className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.08),-2px_-2px_8px_rgba(255,255,255,0.9)]">
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
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-20">

          {/* Divider */}
          <div className="mb-16 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">World Divisions</span>
            <div className="flex-1 h-px bg-gray-100" />
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
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100 group">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.08),-2px_-2px_8px_rgba(255,255,255,0.9)]">
                        <span className={`text-lg font-black tabular-nums ${rank === 1 ? 'text-[#6366F1]' : rank <= 3 ? 'text-gray-500' : 'text-gray-300'}`}>
                          {rank}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#6366F1] transition-colors">{shortName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-gray-900 tabular-nums">{fmt(membership)}</span>
                          {growth !== null && growth !== undefined && (
                            <span className={`text-[11px] font-semibold tabular-nums ${growth > 0 ? 'text-green-500' : growth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
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
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Where the<br />
                <span className="text-[#6366F1]">church stands.</span>
              </h2>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
                World divisions ranked by total membership. Each division represents millions of Adventists across multiple countries and territories.
              </p>
              <div className="mt-8 space-y-6">
                {[
                  { label: 'Total Divisions', value: divisions.length.toString() },
                  { label: 'Largest Division', value: divisions[0]?.name.replace(' Division', '') ?? '—' },
                  { label: 'Total Members', value: fmt(divisions.reduce((s, d) => s + (d.latestYear?.membership?.ending ?? 0), 0)) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.08),-2px_-2px_8px_rgba(255,255,255,0.9)]">
                      <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-gray-900 tabular-nums">{value}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/rankings" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[#6366F1] hover:underline">
                Full rankings table →
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-20">

          {/* Centered headline */}
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 text-center tracking-tight mb-16">
            Explore. Analyse. <span className="text-[#6366F1]">Act.</span>
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: '/browse',
                icon: <BarChart3 className="w-10 h-10 text-[#6366F1]" />,
                title: 'Statistics',
                desc: 'Browse entities, rankings, comparisons, and at-risk alerts.',
              },
              {
                href: '/reports',
                icon: <FileText className="w-10 h-10 text-[#6366F1]" />,
                title: 'Reports',
                desc: 'Editorial deep dives, briefs, and thematic analysis.',
              },
              {
                href: '/maps',
                icon: <Globe2 className="w-10 h-10 text-[#6366F1]" />,
                title: 'Maps',
                desc: 'Interactive church map, territory layers, nearest church.',
              },
              {
                href: '/research',
                icon: <Microscope className="w-10 h-10 text-[#6366F1]" />,
                title: 'Research',
                desc: '200+ living research projects on Adventist growth and health.',
              },
            ].map(({ href, icon, title, desc }) => (
              <Link key={title} href={href} className="group">
                <div className="flex flex-col items-center text-center">
                  {/* Illustration container */}
                  <div className="w-full rounded-2xl bg-[#f5f5f7] flex flex-col justify-end transition-colors group-hover:bg-[#ededf0] overflow-hidden" style={{ height: '280px' }}>
                    {/* White inner card — flush bottom, inset left/right, fixed height */}
                    <div className="w-full px-4">
                      <div className="bg-white rounded-t-xl flex flex-col items-center text-center px-4 pt-5 pb-5" style={{ height: '220px' }}>
                        {icon}
                        <h3 className="text-base font-bold text-gray-900 mt-3">{title}</h3>
                        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* State of Adventism summary */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <StateOfAdventism divisions={divisions} gcStats={gcStats} />
        </div>
      </div>

      {/* Stats footer */}
      <div className="bg-white pb-12 text-center">
        <p className={cn("text-xs", tokens.text.muted)}>{allEntities.length} entities tracked · Data from adventiststatistics.org</p>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Adventist Pulse — The Health of Every Adventist Entity, Measured',
  description: 'Data-driven mission intelligence for the Adventist Church. Growth analytics, health benchmarks, and member-only tools for every entity worldwide.',
};
