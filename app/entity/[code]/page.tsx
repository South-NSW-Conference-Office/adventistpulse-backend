import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  getEntity,
  getEntityStats,
  getEntityChildren,
  getQuickStats,
  getBreadcrumbs,
  getAllEntities,
  getEntitySiblings,
  getLocalChurches,
} from '@/lib/data';
import { tokens, cn } from '@/lib/theme';
import { Card, Section, PageLayout } from '@/components/ui';
import { QuickStatsBar } from '@/components/QuickStats';
import { TrendChart } from '@/components/TrendChart';
import { MultiCompareChart } from '@/components/MultiCompareChart';
import { ChildrenList } from '@/components/ChildrenList';
import { MetricsTable } from '@/components/MetricsTable';
import { PipelineChart } from '@/components/PipelineChart';
import { GrowthComposition } from '@/components/GrowthComposition';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LevelBadge } from '@/components/LevelBadge';
import { Scorecard } from '@/components/Scorecard';
import { RetentionChart } from '@/components/RetentionChart';
import { PulseScoreCard } from '@/components/PulseScoreCard';
import { calculateDerived } from '@/lib/derived';
import { calculatePulseScore } from '@/lib/pulse-score';
import { getEntityInsights } from '@/lib/insights';
import { InsightsPanel } from '@/components/InsightsPanel';
import { getTitheFlowForDivision } from '@/lib/tithe-flow';
import { TitheFlowChart } from '@/components/TitheFlowChart';
import { getYearbookEntity } from '@/lib/yearbook';
import { EntityHeader } from '@/components/EntityHeader';
import { SectionNav } from '@/components/SectionNav';
import { QuickActions } from '@/components/QuickActions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { generateProjections } from '@/lib/projections';
import { ProjectionsChart } from '@/components/ProjectionsChart';
import { ShareButtons } from '@/components/ShareButtons';
import { BenchmarkSuggestions } from '@/components/BenchmarkSuggestions';
import { GrowthVsPopulationWrapper } from '@/components/GrowthVsPopulationWrapper';
import { Building2 } from 'lucide-react'

interface Props {
  params: Promise<{ code: string }>;
}

export default async function EntityPage({ params }: Props) {
  const { code } = await params;
  const entity = getEntity(code);
  if (!entity) notFound();

  const stats = getEntityStats(code);
  const quick = getQuickStats(code);
  const children = getEntityChildren(code);
  const breadcrumbs = getBreadcrumbs(code);
  const siblings = getEntitySiblings(code);

  // Derived metrics (scorecard)
  const latestStats = stats[stats.length - 1];
  const prevStats = stats.length > 1 ? stats[stats.length - 2] : undefined;
  const derived = latestStats ? calculateDerived(latestStats, prevStats) : null;
  const pulseScore = derived ? calculatePulseScore(derived) : null;
  const insights = getEntityInsights(code);
  const titheFlow = entity.level === 'division' ? getTitheFlowForDivision(code) : null;
  const yearbook = getYearbookEntity(code);

  // Load local churches for conference-level entities
  const localChurches = getLocalChurches(code);

  // Projections
  const projectionStats: Record<string, { membership?: number; baptisms?: number; churches?: number }> = {};
  for (const s of stats) {
    projectionStats[String(s.year)] = {
      membership: s.membership?.ending ?? undefined,
      baptisms: s.membership?.baptisms ?? undefined,
      churches: s.churches ?? undefined,
    };
  }
  const projections = generateProjections(projectionStats);
  const latestMembership = latestStats?.membership?.ending ?? 0;
  const latestYear = latestStats?.year ?? 2024;

  // All years for the metrics table (scrollable)
  // All years for the trend chart
  const trendData = stats.map(s => ({
    year: s.year,
    membership: s.membership.ending,
    baptisms: s.membership.baptisms,
    churches: s.churches,
  }));

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://adventistpulse.org';
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: entity.name,
    url: `${baseUrl}/entity/${entity.code}`,
    identifier: entity.code,
    ...(entity.parentCode && {
      parentOrganization: {
        '@type': 'Organization',
        name: breadcrumbs[breadcrumbs.length - 2]?.name,
        url: `${baseUrl}/entity/${entity.parentCode}`,
      },
    }),
    ...(quick && {
      numberOfEmployees: quick.workers,
      aggregateRating: quick.membership && {
        '@type': 'AggregateRating',
        ratingValue: Math.min(5, Math.max(1, (quick.growthRate || 0) + 3)),
        bestRating: 5,
        worstRating: 1,
        description: 'Growth performance rating',
      },
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}/entity/${crumb.code}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      <main id="main-content" className={cn("min-h-screen", tokens.bg.page, tokens.text.heading)}>
        {/* Header */}
      <div className={cn("border-b", tokens.border.default)}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-2">
            <EntityHeader
              name={entity.name}
              code={code}
              level={entity.level}
              parentCode={entity.parentCode || undefined}
              parentName={entity.parentCode ? (getEntity(entity.parentCode)?.name || entity.parentCode) : undefined}
              yearbook={yearbook}
              quickStats={{ membership: quick?.membership, churches: quick?.churches, year: quick?.year }}
              allEntities={getAllEntities().map(e => ({ code: e.code, name: e.name, level: e.level }))}
              children={children.map(c => ({ code: c.code, name: c.name }))}
            />
          </div>
          {stats.length > 0 && (
            <p className="text-gray-400 dark:text-slate-400 text-sm mt-2">
              {stats[0].year}–{stats[stats.length - 1].year} · {stats.length} years of data
              {localChurches.length > 0 && (
                <>
                  {' · '}
                  <a href="#local-churches" className="text-[#6366F1] hover:underline">
                    <Building2 className="w-4 h-4 inline-block mr-1" />{localChurches.length} churches
                  </a>
                </>
              )}
            </p>
          )}
          <div className="mt-3">
            <QuickActions
              entityCode={code}
              entityName={entity.name}
              entityLevel={entity.level}
              siblingCodes={siblings.map(s => s.code)}
              parentCode={entity.parentCode || undefined}
            />
          </div>
        </div>
      </div>

      {/* QuickStats */}
      {quick && (
        <div className={cn("border-b", tokens.border.default)}>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <QuickStatsBar stats={quick} />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Section jump nav */}
        <SectionNav sections={[
          { id: 'pulse-score', label: 'Pulse Score', available: !!pulseScore },
          { id: 'insights', label: 'Insights', available: insights.length > 0 },
          { id: 'benchmarks', label: 'Benchmarks', available: true },
          { id: 'scorecard', label: 'Scorecard', available: !!derived },
          { id: 'membership', label: 'Membership', available: trendData.length > 1 },
          { id: 'growth-vs-population', label: 'Growth vs Pop.', available: ['gc', 'division', 'union', 'conference'].includes(entity.level) },
          { id: 'growth-composition', label: 'Growth', available: stats.length > 3 },
          { id: 'sub-entities', label: children.length > 0 ? (entity.level === 'gc' ? 'Divisions' : 'Sub-entities') : '', available: children.length > 0 },
          { id: 'baptisms', label: 'Baptisms', available: trendData.some(d => d.baptisms !== null) },
          { id: 'retention', label: 'Retention', available: stats.length > 2 },
          { id: 'projections', label: 'Projections', available: projections.points5.length > 0 },
          { id: 'tithe-flow', label: 'Tithe Flow', available: !!titheFlow },
          { id: 'metrics', label: 'Key Metrics', available: stats.length > 0 },
          { id: 'peers', label: 'Peers', available: siblings.length > 0 },
          { id: 'local-churches', label: '⛪ Churches', available: entity.level === 'conference' },
        ]} />

        {/* Pulse Score — Composite Health Index */}
        {pulseScore && (
          <section id="pulse-score">
            <ErrorBoundary>
              <PulseScoreCard score={pulseScore} entityName={entity.name} />
            </ErrorBoundary>
          </section>
        )}

        {/* Children (sub-entities) — HIGH on page for navigation */}
        {children.length > 0 && (
          <Section
            id="sub-entities"
            title={
              entity.level === 'gc' ? 'Divisions' :
              entity.level === 'division' ? 'Unions' :
              entity.level === 'union' ? 'Conferences' : 'Sub-entities'
            }
          >
            <ChildrenList entities={children} />
          </Section>
        )}

        {/* Intelligence Insights (from Finn's research) */}
        {insights.length > 0 && (
          <section id="insights">
            <ErrorBoundary>
              <InsightsPanel insights={insights} />
            </ErrorBoundary>
          </section>
        )}

        {/* Smart Benchmarks — AI-suggested comparisons */}
        <section id="benchmarks">
          <ErrorBoundary>
            <BenchmarkSuggestions entityCode={code} entityName={entity.name} />
          </ErrorBoundary>
        </section>

        {/* Health Scorecard — Detailed Metrics */}
        {derived && latestStats && (
          <section id="scorecard">
            <ErrorBoundary>
              <Scorecard metrics={derived} year={latestStats.year} />
            </ErrorBoundary>
          </section>
        )}

        {/* Membership Trend Chart (zoomable) */}
        {trendData.length > 1 && (
          <Section id="membership" title="Membership Trend">
            <ErrorBoundary>
              <MultiCompareChart
                entities={[{ code, name: entity.name, data: trendData }]}
                dataKey="membership"
              />
            </ErrorBoundary>
          </Section>
        )}

        {/* Growth vs Population — shows for all entities with 2+ years of membership data */}
        {stats.length >= 2 && (
          <section id="growth-vs-population">
            <GrowthVsPopulationWrapper entityName={entity.name} stats={stats} />
          </section>
        )}

        {/* Baptisms Trend (zoomable) */}
        {trendData.length > 1 && trendData.some(d => d.baptisms !== null) && (
          <Section id="baptisms" title="Baptisms Trend">
            <MultiCompareChart
              entities={[{ code, name: entity.name, data: trendData }]}
              dataKey="baptisms"
            />
          </Section>
        )}

        {/* Growth Composition — where does growth come from? */}
        {stats.length > 3 && (
          <Section 
            id="growth-composition" 
            title="Growth Composition"
            subtitle="Kingdom growth (baptisms + POF) vs transfer balance vs losses. Above the line = growth. Below = losses."
          >
            <ErrorBoundary>
              <GrowthComposition stats={stats} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Gains vs Losses Pipeline */}
        {stats.length > 2 && stats.some(s => s.membership.totalGains !== null) && (
          <Section
            title="Membership Pipeline"
            subtitle="Gains (baptisms, transfers in) vs Losses (deaths, dropped, transfers out)"
          >
            <PipelineChart stats={stats} />
          </Section>
        )}

        {/* Retention Curve */}
        {stats.length > 2 && (
          <Section
            id="retention"
            title="Retention Curve"
            subtitle="Percentage of members retained year-over-year. Green dashed line = 95% target."
          >
            <RetentionChart stats={stats} />
          </Section>
        )}

        {/* Projections */}
        {projections.points5.length > 0 && (
          <section id="projections">
            <ErrorBoundary>
              <ProjectionsChart
                projections={projections}
                entityName={entity.name}
                entityCode={code}
                currentMembership={latestMembership}
                latestYear={latestYear}
              />
            </ErrorBoundary>
          </section>
        )}

        {/* Tithe Flow (divisions only) */}
        {titheFlow && (
          <section id="tithe-flow">
            <TitheFlowChart flow={titheFlow} />
          </section>
        )}

        {/* Key Metrics Table */}
        {stats.length > 0 && (
          <Section id="metrics" title="Key Metrics">
            <MetricsTable stats={stats} />
          </Section>
        )}

        {/* Sibling entities */}
        {siblings.length > 0 && (
          <section id="peers">
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-lg font-semibold", tokens.text.heading)}>
                Peer {entity.level === 'conference' ? 'Conferences' : entity.level === 'union' ? 'Unions' : 'Entities'}
              </h2>
              {siblings.length > 0 && (
                <Link
                  href={`/compare?a=${code}&b=${siblings[0].code}`}
                  className={cn("text-sm hover:underline", tokens.text.accent)}
                >
                  Compare →
                </Link>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.slice(0, 6).map((sib) => {
                const mem = sib.latestYear?.membership?.ending;
                const growth = sib.latestYear?.membership?.growthRate;
                return (
                  <Link key={sib.code} href={`/entity/${sib.code}`}>
                    <Card hover className="flex items-center justify-between">
                      <div>
                        <span className={cn("text-sm font-medium", tokens.text.heading)}>{sib.name}</span>
                        <span className={cn("text-xs ml-2", tokens.text.muted)}>
                          {mem ? (mem >= 1000 ? (mem / 1000).toFixed(0) + 'K' : mem.toLocaleString()) : '—'}
                        </span>
                      </div>
                      {growth !== null && growth !== undefined && (
                        <span className={cn(
                          "text-xs tabular-nums",
                          growth > 0 ? tokens.text.success : growth < 0 ? tokens.text.danger : tokens.text.muted
                        )}>
                          {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Local Churches (conference level only) */}
        {localChurches.length > 0 && (
          <Section 
            id="local-churches"
            title={`Local Churches (${localChurches.length})`}
          >
            <Card className="overflow-hidden p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className={cn("sticky top-0", tokens.bg.cardAlt)}>
                    <tr className={cn("text-xs text-left", tokens.text.muted)}>
                      <th className="px-4 py-3 font-medium">Church</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localChurches.map((church, i) => (
                      <tr key={i} className={cn(
                        "border-t transition-colors",
                        tokens.border.default, 
                        tokens.bg.cardHover
                      )}>
                        <td className={cn("px-4 py-3 font-medium", tokens.text.heading)}>{church.name}</td>
                        <td className={cn("px-4 py-3", tokens.text.body)}>{church.suburb}{church.state ? `, ${church.state}` : ''}</td>
                        <td className={cn("px-4 py-3 hidden md:table-cell", tokens.text.muted)}>{church.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn(
                "text-center py-2 border-t text-xs",
                tokens.border.default,
                tokens.text.muted
              )}>
                {localChurches.length} churches in {entity.name}
              </div>
            </Card>
          </Section>
        )}
      </div>
    </main>
    </>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const entity = getEntity(code);
  if (!entity) return { title: 'Not Found' };
  const quick = getQuickStats(code);
  const memberStr = quick?.membership
    ? ` · ${quick.membership.toLocaleString()} members`
    : '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://adventistpulse.org';
  return {
    title: `${entity.name} | Adventist Pulse`,
    description: `Statistics and health data for ${entity.name}${memberStr}. Membership trends, baptism rates, and more.`,
    openGraph: {
      title: `${entity.name} | Adventist Pulse`,
      description: `Statistics and health data for ${entity.name}${memberStr}.`,
      images: [`${baseUrl}/api/og?code=${code}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${entity.name} | Adventist Pulse`,
      images: [`${baseUrl}/api/og?code=${code}`],
    },
  };
}

// Generate static params for all 116 entity pages at build time
export async function generateStaticParams() {
  const entities = getAllEntities();
  return entities.map(entity => ({
    code: entity.code,
  }));
}
