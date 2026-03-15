import Link from 'next/link';
import { getAllEntities, getEntity, getQuickStats, getEntitiesByLevel } from '@/lib/data';
import { LevelBadge } from '@/components/LevelBadge';
import { GlobalSearch } from '@/components/GlobalSearch';
import { HarvestMapLoader } from '@/components/HarvestMapLoader';
import { UnreachedTable } from '@/components/UnreachedTable';
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

export default function Home() {
  const allEntities = getAllEntities();
  const gc = getEntity('G10001');
  const gcStats = getQuickStats('G10001');
  const divisions = getEntitiesByLevel('division')
    .sort((a, b) => (b.latestYear?.membership?.ending ?? 0) - (a.latestYear?.membership?.ending ?? 0));

  return (
    <main id="main-content" className={cn("min-h-screen", tokens.bg.page, tokens.text.heading)}>
      {/* Hero */}
      <div className={cn("border-b", tokens.border.default)}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Adventist <span className={tokens.text.accent}>Pulse</span>
          </h1>
          <p className={cn("text-lg mt-4 max-w-2xl mx-auto", tokens.text.body)}>
            Data-driven mission intelligence for the Adventist Church.
            Unlock member-only tools, insights and strategies that will help you finish the work.
          </p>

          {/* Global headline stats */}
          {gcStats && (
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              <StatCard 
                label="Members Worldwide" 
                value={fmt(gcStats.membership)} 
                className="border-0 bg-transparent shadow-none"
              />
              <StatCard 
                label="Churches" 
                value={fmt(gcStats.churches)}
                className="border-0 bg-transparent shadow-none"
              />
              <StatCard 
                label={`Baptisms (${gcStats.year})`} 
                value={fmt(gcStats.baptisms)}
                className="border-0 bg-transparent shadow-none"
              />
            </div>
          )}

          {/* Search */}
          <div className="mt-10 max-w-lg mx-auto">
            <GlobalSearch entities={allEntities} placeholder="Search your church, conference, or division..." />
          </div>
        </div>
      </div>

      {/* Harvest Map */}
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <h2 className={cn("text-xl font-semibold mb-4", tokens.text.heading)}>The Harvest Map</h2>
        <HarvestMapLoader />
      </div>

      {/* Unreached Nations */}
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <h2 className={cn("text-xl font-semibold mb-1", tokens.text.heading)}>The Unfinished Work</h2>
        <p className={cn("text-sm mb-4", tokens.text.body)}>
          Countries where the Adventist Church has no presence, minimal reach, or limited operations.
        </p>
        <UnreachedTable />
      </div>

      {/* Browse by Division */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn("text-xl font-semibold", tokens.text.heading)}>World Divisions</h2>
          <Link href="/rankings" className={cn("text-sm hover:underline", tokens.text.accent)}>
            View Rankings →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((div) => {
            const membership = div.latestYear?.membership?.ending;
            const growth = div.latestYear?.membership?.growthRate;
            return (
              <Link key={div.code} href={`/entity/${div.code}`}>
                <Card hover className="group">
                  <div className="flex items-start justify-between">
                    <h3 className={cn("font-semibold text-sm group-hover:opacity-90", tokens.text.heading)}>
                      {div.name}
                    </h3>
                    <LevelBadge level="division" size="sm" />
                  </div>
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className={cn("text-lg font-bold tabular-nums", tokens.text.heading)}>{fmt(membership)}</span>
                    <span className={cn("text-xs", tokens.text.muted)}>members</span>
                    {growth !== null && growth !== undefined && (
                      <span className={cn(
                        "text-xs font-medium tabular-nums",
                        growth > 0 ? tokens.text.success : growth < 0 ? tokens.text.danger : tokens.text.muted
                      )}>
                        {growth > 0 ? '+' : ''}{growth.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 4 Pillars */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/browse">
            <Card hover className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6366F1]/10 mb-3">
                <BarChart3 className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h3 className={cn("font-semibold", tokens.text.heading)}>Statistics</h3>
              <p className={cn("text-xs mt-1", tokens.text.body)}>Browse entities, rankings, comparisons, at-risk alerts</p>
            </Card>
          </Link>
          <Link href="/reports">
            <Card hover className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6366F1]/10 mb-3">
                <FileText className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h3 className={cn("font-semibold", tokens.text.heading)}>Reports</h3>
              <p className={cn("text-xs mt-1", tokens.text.body)}>Editorial deep dives, briefs, and thematic analysis</p>
            </Card>
          </Link>
          <Link href="/maps">
            <Card hover className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6366F1]/10 mb-3">
                <Globe2 className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h3 className={cn("font-semibold", tokens.text.heading)}>Maps</h3>
              <p className={cn("text-xs mt-1", tokens.text.body)}>Interactive church map, territory layers, nearest church</p>
            </Card>
          </Link>
          <Link href="/research">
            <Card hover className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6366F1]/10 mb-3">
                <Microscope className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h3 className={cn("font-semibold", tokens.text.heading)}>Research</h3>
              <p className={cn("text-xs mt-1", tokens.text.body)}>200+ living research projects on Adventist growth and health</p>
            </Card>
          </Link>
        </div>

        {/* State of Adventism summary */}
        <div className="mt-12">
          <StateOfAdventism divisions={divisions} gcStats={gcStats} />
        </div>

        {/* Stats footer */}
        <div className={cn("mt-12 text-center text-xs", tokens.text.muted)}>
          <p>{allEntities.length} entities tracked · Data from adventiststatistics.org</p>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: 'Adventist Pulse — The Health of Every Adventist Entity, Measured',
  description: 'Data-driven mission intelligence for the Adventist Church. Growth analytics, health benchmarks, and member-only tools for every entity worldwide.',
};
