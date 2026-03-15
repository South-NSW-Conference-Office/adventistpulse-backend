import Link from 'next/link';
import { getEntitiesByLevel, getAllEntities } from '@/lib/data';
import { LevelBadge } from '@/components/LevelBadge';
import { BrowseSearchFilter } from '@/components/BrowseSearchFilter';

interface Props {
  searchParams: Promise<{ level?: string }>;
}

const LEVELS = [
  { key: 'division', label: 'Divisions', description: 'The 13 world divisions' },
  { key: 'union', label: 'Unions', description: 'Union conferences and union missions' },
  { key: 'conference', label: 'Conferences', description: 'Local conferences and missions' },
  { key: 'field', label: 'Fields & Sections', description: 'Attached fields, sections, and field stations' },
];

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const activeLevel = params.level || 'division';
  const entities = getEntitiesByLevel(activeLevel as any)
    .sort((a, b) => (b.latestYear?.membership?.ending ?? 0) - (a.latestYear?.membership?.ending ?? 0));

  const allEntities = getAllEntities();
  const counts = {
    division: allEntities.filter(e => e.level === 'division').length,
    union: allEntities.filter(e => e.level === 'union').length,
    conference: allEntities.filter(e => e.level === 'conference' || e.level === 'mission').length,
    field: allEntities.filter(e => e.level === 'field' || e.level === 'section' || e.level === 'field_station').length,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white">
      <div className="border-b border-gray-200 dark:border-[#2a3a50]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">Browse Entities</h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
            {allEntities.length} entities across the global Adventist church
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Level tabs */}
        <div className="flex gap-2 mb-6">
          {LEVELS.map(level => (
            <Link
              key={level.key}
              href={`/browse?level=${level.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeLevel === level.key
                  ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30'
                  : 'bg-gray-50 dark:bg-[#1f2b3d] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-[#2a3a50] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {level.label}
              <span className="ml-1.5 text-xs text-slate-500">{counts[level.key as keyof typeof counts]}</span>
            </Link>
          ))}
        </div>

        {/* Entity grid with search */}
        <BrowseSearchFilter entities={entities} level={activeLevel} />
      </div>
    </main>
  );
}

export const metadata = {
  title: 'Browse Entities | Adventist Pulse',
  description: 'Browse all Adventist entities by organizational level — divisions, unions, and conferences.',
};
