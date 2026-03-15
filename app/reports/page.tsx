import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';
import { Card } from '@/components/ui';
import { PageLayout } from '@/components/ui';
import { formatDate } from '@/lib/format-date';
import ReportsClient from '@/components/ReportsClient';

export const metadata = {
  title: 'Reports — Adventist Pulse',
  description: 'Vital Signs, State of Adventism, and Pulse Briefs — data-driven reports on the global Seventh-day Adventist Church.',
};

export default async function ReportsPage() {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'public/data/reports-index.json'),
    'utf-8'
  );
  const data = JSON.parse(raw);
  const { vitalSigns, stateOfAdventism, briefs } = data;

  return (
    <PageLayout
      title="Reports"
      subtitle="Data-driven analysis of the global Seventh-day Adventist Church."
    >
      {/* ── State of Adventism Hero ── */}
      <Link href={`/reports/${stateOfAdventism.slug}`}>
        <Card
          hover
          className={cn(
            'relative overflow-hidden cursor-pointer',
            'border-2', tokens.border.accent,
            'p-8 sm:p-10'
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex items-center justify-center rounded-xl w-12 h-12 shrink-0',
              tokens.bg.accentSoft
            )}>
              <Globe className={cn('h-6 w-6', tokens.text.accent)} />
            </div>
            <div className="space-y-2">
              <h2 className={cn('text-2xl sm:text-3xl font-bold', tokens.text.heading)}>
                {stateOfAdventism.title}
              </h2>
              <p className={cn('text-base sm:text-lg max-w-2xl', tokens.text.body)}>
                {stateOfAdventism.subtitle}
              </p>
              <div className={cn('flex items-center gap-3 text-sm', tokens.text.muted)}>
                <span>{formatDate(stateOfAdventism.date)}</span>
                <span>&middot;</span>
                <span>{stateOfAdventism.readTime}</span>
              </div>
              <span className={cn('inline-block mt-2 text-sm font-medium', tokens.text.accent)}>
                Read the Report &rarr;
              </span>
            </div>
          </div>
        </Card>
      </Link>

      <ReportsClient vitalSigns={vitalSigns} briefs={briefs} />
    </PageLayout>
  );
}
