export const dynamic = 'force-dynamic';
import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Globe, Newspaper, Calendar, Clock, ExternalLink } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';
import { Card, Badge } from '@/components/ui';
import { PageLayout } from '@/components/ui';
import { LevelBadge } from '@/components/LevelBadge';
import { formatDate } from '@/lib/format-date';
import { getEntity, getEntityStats } from '@/lib/data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'data/reports-index.json'),
    'utf-8'
  );
  const data = JSON.parse(raw);
  const slugs: { slug: string }[] = [];

  if (data.stateOfAdventism?.slug) slugs.push({ slug: data.stateOfAdventism.slug });
  data.vitalSigns?.forEach((v: any) => slugs.push({ slug: v.slug }));
  data.briefs?.forEach((b: any) => slugs.push({ slug: b.slug }));

  return slugs;
}

export default async function ReportPage({ params }: Props) {
  const { slug } = await params;

  const raw = await fs.readFile(
    path.join(process.cwd(), 'data/reports-index.json'),
    'utf-8'
  );
  const data = JSON.parse(raw);

  // Check State of Adventism
  if (data.stateOfAdventism?.slug === slug) {
    return <StateOfAdventismPage report={data.stateOfAdventism} />;
  }

  // Check Vital Signs
  const vs = data.vitalSigns?.find((v: any) => v.slug === slug);
  if (vs) {
    return <VitalSignsPage report={vs} />;
  }

  // Check Briefs
  const brief = data.briefs?.find((b: any) => b.slug === slug);
  if (brief) {
    return <BriefPage report={brief} />;
  }

  notFound();
}

function BackLink() {
  return (
    <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#6366F1] hover:underline mb-6">
      <ArrowLeft className="w-4 h-4" /> Back to Reports
    </Link>
  );
}

async function VitalSignsPage({ report }: { report: any }) {
  const stats = await getEntityStats(report.entityCode);
  const latest = stats.length > 0 ? stats[stats.length - 1] : null;

  const mem = latest?.membership?.ending ?? 0;
  const beginMem = latest?.membership?.beginning ?? 0;
  const ch = latest?.churches ?? 0;
  const bap = latest?.membership?.baptisms ?? 0;
  const pof = latest?.membership?.professionOfFaith ?? 0;
  const deaths = latest?.membership?.deaths ?? 0;
  const dropped = latest?.membership?.dropped ?? 0;
  const transIn = latest?.membership?.transfersIn ?? 0;
  const transOut = latest?.membership?.transfersOut ?? 0;
  const gr = latest?.membership?.growthRate ?? 0;
  const netGrowth = mem - beginMem;
  const totalGains = bap + pof + transIn;
  const totalLosses = deaths + dropped + transOut;
  const retentionRate = beginMem > 0 ? ((1 - (dropped / beginMem)) * 100) : 0;

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackLink />

        <div className="flex items-start gap-4 mb-2">
          <FileText className={cn('h-8 w-8 shrink-0 mt-1', tokens.text.accent)} />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className={cn('text-3xl font-bold', tokens.text.heading)}>
                Vital Signs: {report.entityName}
              </h1>
              <LevelBadge level={report.level} size="sm" />
            </div>
            {report.parentCodes?.length > 0 && (
              <p className={cn('text-sm mb-2', tokens.text.muted)}>
                {[...report.parentCodes].reverse().join(' → ')}
              </p>
            )}
            <div className={cn('flex items-center gap-3 text-sm', tokens.text.muted)}>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {report.year}</span>
              <span>&middot;</span>
              <Link href={`/entity/${report.entityCode}`} className="text-[#6366F1] hover:underline flex items-center gap-1">
                View Entity Page <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <hr className={cn('my-8', tokens.border.default)} />

        {/* Key Stats Grid */}
        <h2 className={cn('text-xl font-semibold mb-4', tokens.text.heading)}>Key Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Membership', value: mem > 0 ? mem.toLocaleString() : '—' },
            { label: 'Churches', value: ch > 0 ? ch.toLocaleString() : '—' },
            { label: 'Baptisms', value: bap > 0 ? bap.toLocaleString() : '—' },
            { label: 'Growth Rate', value: gr ? `${gr > 0 ? '+' : ''}${gr.toFixed(2)}%` : '—' },
            { label: 'Net Growth', value: netGrowth !== 0 ? `${netGrowth > 0 ? '+' : ''}${netGrowth.toLocaleString()}` : '—' },
            { label: 'Professions of Faith', value: pof > 0 ? pof.toLocaleString() : '—' },
            { label: 'Retention Rate', value: retentionRate > 0 ? `${retentionRate.toFixed(1)}%` : '—' },
            { label: 'Members per Church', value: ch > 0 && mem > 0 ? Math.round(mem / ch).toLocaleString() : '—' },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center">
              <p className={cn('text-2xl font-bold', tokens.text.heading)}>{s.value}</p>
              <p className={cn('text-xs mt-1', tokens.text.muted)}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Gains & Losses */}
        {(totalGains > 0 || totalLosses > 0) && (
          <>
            <h2 className={cn('text-xl font-semibold mb-4', tokens.text.heading)}>Membership Movement</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Card className="p-6">
                <h3 className="text-emerald-500 font-semibold mb-3">Gains</h3>
                <div className="space-y-2">
                  {bap > 0 && <Row label="Baptisms" value={bap} />}
                  {pof > 0 && <Row label="Professions of Faith" value={pof} />}
                  {transIn > 0 && <Row label="Transfers In" value={transIn} />}
                  <div className={cn('border-t pt-2 flex justify-between font-semibold', tokens.border.default, tokens.text.heading)}>
                    <span>Total Gains</span><span>{totalGains.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-red-400 font-semibold mb-3">Losses</h3>
                <div className="space-y-2">
                  {deaths > 0 && <Row label="Deaths" value={deaths} />}
                  {dropped > 0 && <Row label="Dropped" value={dropped} />}
                  {transOut > 0 && <Row label="Transfers Out" value={transOut} />}
                  <div className={cn('border-t pt-2 flex justify-between font-semibold', tokens.border.default, tokens.text.heading)}>
                    <span>Total Losses</span><span>{totalLosses.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Data Source */}
        <Card className={cn('p-6 border-dashed', tokens.border.default)}>
          <p className={cn('text-sm', tokens.text.muted)}>
            Data sourced from the Office of Archives, Statistics, and Research (ASTR) of the General Conference of Seventh-day Adventists.
            Figures reflect the most recent available reporting year ({report.year}).
          </p>
        </Card>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn('flex justify-between text-sm', tokens.text.body)}>
      <span>{label}</span><span>{value.toLocaleString()}</span>
    </div>
  );
}

function StateOfAdventismPage({ report }: { report: any }) {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackLink />
        <div className="flex items-start gap-4 mb-6">
          <Globe className={cn('h-8 w-8 shrink-0 mt-1', tokens.text.accent)} />
          <div>
            <h1 className={cn('text-3xl font-bold mb-2', tokens.text.heading)}>{report.title}</h1>
            <p className={cn('text-lg mb-3', tokens.text.body)}>{report.subtitle}</p>
            <div className={cn('flex items-center gap-3 text-sm', tokens.text.muted)}>
              <span>{formatDate(report.date)}</span>
              <span>&middot;</span>
              <span>{report.readTime}</span>
            </div>
          </div>
        </div>

        <hr className={cn('my-8', tokens.border.default)} />

        <Card className={cn('p-8 text-center border-dashed', tokens.border.default)}>
          <Globe className={cn('h-12 w-12 mx-auto mb-4', tokens.text.muted)} />
          <h2 className={cn('text-xl font-semibold mb-2', tokens.text.heading)}>Coming Soon</h2>
          <p className={cn('text-sm max-w-lg mx-auto', tokens.text.muted)}>
            The inaugural State of Adventism report is being compiled from data across all 13 world divisions.
            This flagship annual report will provide a comprehensive health assessment of the global Seventh-day Adventist Church.
          </p>
        </Card>
      </div>
    </main>
  );
}

function BriefPage({ report }: { report: any }) {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackLink />
        <div className="flex items-start gap-4 mb-6">
          <Newspaper className={cn('h-8 w-8 shrink-0 mt-1', tokens.text.accent)} />
          <div>
            <h1 className={cn('text-3xl font-bold mb-2', tokens.text.heading)}>{report.title}</h1>
            <p className={cn('text-lg mb-3', tokens.text.body)}>{report.subtitle}</p>
            <div className={cn('flex items-center gap-3 text-sm mb-3', tokens.text.muted)}>
              <span>{formatDate(report.date)}</span>
              <span>&middot;</span>
              <span>{report.readTime}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {report.tags?.map((t: string) => (
                <Badge key={t} variant="neutral" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        </div>

        <hr className={cn('my-8', tokens.border.default)} />

        <Card className={cn('p-8 text-center border-dashed', tokens.border.default)}>
          <Newspaper className={cn('h-12 w-12 mx-auto mb-4', tokens.text.muted)} />
          <h2 className={cn('text-xl font-semibold mb-2', tokens.text.heading)}>Article In Progress</h2>
          <p className={cn('text-sm max-w-lg mx-auto', tokens.text.muted)}>
            This Pulse Brief is being researched and written. All briefs follow our editorial standards:
            data over framing, neutral language, and balanced sourcing across the Adventist spectrum.
          </p>
        </Card>
      </div>
    </main>
  );
}
