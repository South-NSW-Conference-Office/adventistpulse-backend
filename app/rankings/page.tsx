export const dynamic = 'force-dynamic';
import { getEntitiesByLevel, getEntity } from '@/lib/data';
import { tokens, cn } from '@/lib/theme';
import { RankingsClient } from '@/components/RankingsClient';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ level?: string; highlight?: string }>;
}

const LEVEL_TABS = [
  { key: 'division',    label: 'Divisions' },
  { key: 'union',       label: 'Unions' },
  { key: 'conference',  label: 'Conferences' },
];

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const level = params.level || 'conference';
  const highlightCode = params.highlight || '';
  
  const [entities, highlightEntity] = await Promise.all([
    getEntitiesByLevel(level).catch(() => []),
    highlightCode ? getEntity(highlightCode).catch(() => null) : Promise.resolve(null),
  ]);

  // Calculate metrics for each entity
  const ranked = entities.map(e => {
    const mem = e.latestYear?.membership?.ending ?? 0;
    const churches = e.latestYear?.churches ?? 0;
    const baptisms = e.latestYear?.membership?.baptisms ?? 0;
    const growth = e.latestYear?.membership?.growthRate ?? null;
    const membersPerChurch = churches > 0 ? Math.round(mem / churches) : 0;
    const baptismsPerChurch = churches > 0 ? Math.round((baptisms / churches) * 10) / 10 : 0;

    return {
      code: e.code,
      name: e.name,
      level: e.level,
      parentCode: e.parentCode || '',
      membership: mem,
      churches,
      baptisms,
      growthRate: growth,
      membersPerChurch,
      baptismsPerChurch,
      year: e.latestYear?.year ?? 0,
    };
  }).filter(e => e.membership > 0 || e.churches > 0);

  const data = JSON.parse(JSON.stringify(ranked));

  // Get parent info for scope toggle
  const parentCode = highlightEntity?.parentCode || '';
  const parentEntity = parentCode ? await getEntity(parentCode).catch(() => null) : null;

  const levelLabels: Record<string, string> = {
    division: 'Divisions',
    union: 'Unions',
    conference: 'Conferences',
    field: 'Fields',
  };

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Level tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {LEVEL_TABS.map(tab => (
            <Link
              key={tab.key}
              href={`/rankings?level=${tab.key}${highlightCode ? `&highlight=${highlightCode}` : ''}`}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                level === tab.key
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : cn(tokens.bg.card, tokens.border.default, tokens.text.body, 'hover:border-[#6366F1]/50')
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <RankingsClient
          data={data}
          level={level}
          levelLabel={levelLabels[level] || 'Entities'}
          highlightCode={highlightCode}
          highlightName={highlightEntity?.name || ''}
          parentCode={parentCode}
          parentName={parentEntity?.name || ''}
        />
      </div>
    </main>
  );
}

export const metadata = {
  title: 'Rankings | Adventist Pulse',
  description: 'Rank and compare Adventist entities by membership, growth, baptisms, and more.',
};
