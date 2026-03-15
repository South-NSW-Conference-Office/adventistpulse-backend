import { getAllEntities, getEntity } from '@/lib/data';
import { tokens, cn } from '@/lib/theme';
import { RankingsClient } from '@/components/RankingsClient';

interface Props {
  searchParams: Promise<{ level?: string; highlight?: string }>;
}

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const level = params.level || 'division';
  const highlightCode = params.highlight || '';
  
  const allEntities = getAllEntities();
  const highlightEntity = highlightCode ? getEntity(highlightCode) : null;

  // Get entities at this level
  let entities = allEntities;
  if (level === 'conference') {
    entities = allEntities.filter(e => e.level === 'conference' || e.level === 'mission');
  } else if (level === 'field') {
    entities = allEntities.filter(e => e.level === 'field' || e.level === 'section');
  } else {
    entities = allEntities.filter(e => e.level === level);
  }

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
  const parentEntity = parentCode ? getEntity(parentCode) : null;

  const levelLabels: Record<string, string> = {
    division: 'Divisions',
    union: 'Unions',
    conference: 'Conferences',
    field: 'Fields',
  };

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-6xl mx-auto px-4 py-6">
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
