import Link from 'next/link';
import {
  getEntity,
  getEntityStats,
  getQuickStats,
  getAllEntities,
  getEntityChildren,
} from '@/lib/data';
import { LevelBadge } from '@/components/LevelBadge';
import { MultiCompareChart } from '@/components/MultiCompareChart';
import { CompareSearch } from '@/components/CompareSearch';
import { CompareTable } from '@/components/CompareTable';
interface Props {
  searchParams: Promise<{ entities?: string; preset?: string }>;
}

// Preset comparisons
const PRESETS: { id: string; label: string; codes: string[]; description: string }[] = [
  // Regional
  { id: 'au-conferences', label: 'Australian Conferences', codes: ['GSC', 'SNSW', 'NNSW', 'NAC', 'SAC', 'SQC', 'VIC', 'WAC', 'TAS'], description: 'All 9 AUC conferences head-to-head' },
  { id: 'snsw-vs-nnsw', label: 'SNSW vs NNSW', codes: ['SNSW', 'NNSW'], description: 'South vs North NSW — the local rivalry' },
  { id: 'spd-unions', label: 'SPD Unions', codes: ['AUC', 'NZP', 'PNGUM', 'TPUM'], description: 'All unions in South Pacific Division' },
  // Global
  { id: 'all-divisions', label: 'All World Divisions', codes: ['SPD', 'NAD', 'ECD', 'IAD', 'SAD', 'EUD', 'ESD', 'NSD', 'SSD', 'SUD', 'SID', 'TED', 'WAD'], description: 'Every division compared' },
  { id: 'big-3', label: 'The Big 3 Divisions', codes: ['ECD', 'SAD', 'IAD'], description: 'The membership giants — where 60%+ of Adventists live' },
  { id: 'western-decline', label: 'Western Decline', codes: ['NAD', 'TED', 'EUD', 'SPD'], description: 'Developed-world divisions — who\'s declining fastest?' },
  { id: 'growth-engines', label: 'Growth Engines', codes: ['ECD', 'SAD', 'SSD', 'WAD'], description: 'The fastest-growing regions of the world church' },
];

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const allEntities = getAllEntities();

  // Get entity codes from params
  let codes: string[] = [];
  if (params.entities) {
    codes = params.entities.split(',').filter(c => c.trim());
  } else if (params.preset) {
    const preset = PRESETS.find(p => p.id === params.preset);
    if (preset) codes = preset.codes;
  }

  // Filter to entities that exist
  const validEntities = codes
    .map(code => {
      const entity = getEntity(code);
      if (!entity) return null;
      const stats = getQuickStats(code);
      const yearlyStats = getEntityStats(code);
      return { entity, stats, yearlyStats };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  // No entities selected — show picker
  if (validEntities.length === 0) {
    return (
      <main id="main-content" className="min-h-screen bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white">
        <div className="border-b border-gray-200 dark:border-[#2a3a50]">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold">Compare Entities</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Compare any combination of entities side by side
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Search to build comparison */}
          <CompareSearch entities={allEntities} />

          {/* Preset comparisons */}
          <div className="mt-10">
            <h2 className="text-sm text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Quick Comparisons</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRESETS.map(preset => (
                <Link
                  key={preset.id}
                  href={`/compare?preset=${preset.id}`}
                  className="bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-4 py-3 hover:border-[#6366F1]/50 transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{preset.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{preset.description}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">{preset.codes.join(', ')}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Build chart data
  const membershipData = validEntities.map(e => ({
    code: e.entity.code,
    name: e.entity.name,
    data: e.yearlyStats.map(s => ({ year: s.year, membership: s.membership.ending })),
  }));

  const baptismData = validEntities.map(e => ({
    code: e.entity.code,
    name: e.entity.name,
    data: e.yearlyStats.map(s => ({ year: s.year, baptisms: s.membership.baptisms })),
  }));

  const growthData = validEntities.map(e => ({
    code: e.entity.code,
    name: e.entity.name,
    data: e.yearlyStats.map(s => ({ year: s.year, growthRate: s.membership.growthRate })),
  }));

  // Transfer balance = transfers in - transfers out (migration story)
  const transferData = validEntities.map(e => ({
    code: e.entity.code,
    name: e.entity.name,
    data: e.yearlyStats.map(s => {
      const tIn = s.membership.transfersIn ?? 0;
      const tOut = s.membership.transfersOut ?? 0;
      return { year: s.year, transferBalance: tIn - tOut };
    }),
  }));
  const hasTransferData = transferData.some(e => e.data.some(d => d.transferBalance !== 0));

  // Kingdom growth = baptisms + POF
  const kingdomData = validEntities.map(e => ({
    code: e.entity.code,
    name: e.entity.name,
    data: e.yearlyStats.map(s => ({
      year: s.year,
      kingdomGrowth: (s.membership.baptisms ?? 0) + (s.membership.professionOfFaith ?? 0),
    })),
  }));

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#2a3a50]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Comparing {validEntities.length} Entities
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {validEntities.map(e => (
              <Link
                key={e.entity.code}
                href={`/entity/${e.entity.code}`}
                className="text-xs bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 rounded hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {e.entity.name}
              </Link>
            ))}
            <Link href="/compare" className="text-xs text-[#6366F1] hover:text-[#8b5cf6] px-2 py-1">
              + Change
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Sortable comparison table */}
        <section>
          <CompareTable
            entities={validEntities.map(e => ({
              code: e.entity.code,
              name: e.entity.name,
              membership: e.stats?.membership ?? null,
              churches: e.stats?.churches ?? null,
              baptisms: e.stats?.baptisms ?? null,
              growthRate: e.stats?.growthRate ?? null,
              workers: e.stats?.workers ?? null,
              tithe: e.stats?.tithe ?? null,
            }))}
          />
        </section>

        {/* Membership trends overlay */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">Membership Trend</h2>
          <MultiCompareChart entities={membershipData} dataKey="membership" />
        </section>

        {/* Baptisms overlay */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">Baptisms Trend</h2>
          <MultiCompareChart entities={baptismData} dataKey="baptisms" />
        </section>

        {/* Kingdom Growth (baptisms + POF) */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">Kingdom Growth (Baptisms + POF)</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Actual new believers — excludes transfers (zero-sum shuffling)</p>
          <MultiCompareChart entities={kingdomData} dataKey="kingdomGrowth" />
        </section>

        {/* Growth rate overlay */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">Growth Rate</h2>
          <MultiCompareChart entities={growthData} dataKey="growthRate" height={250} />
        </section>

        {/* Transfer balance — migration story */}
        {hasTransferData && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">Transfer Balance (Migration Flow)</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Positive = net receiver (people moving in). Negative = net sender (people leaving).
              Tells the migration story — retirement destinations vs training grounds.
            </p>
            <MultiCompareChart entities={transferData} dataKey="transferBalance" height={250} />
          </section>
        )}
      </div>
    </main>
  );
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.entities && !params.preset) {
    return {
      title: 'Compare Entities | Adventist Pulse',
      description: 'Compare multiple Adventist entities side by side.',
    };
  }
  return {
    title: 'Entity Comparison | Adventist Pulse',
    description: 'Side-by-side comparison of Adventist entities — membership, baptisms, growth, and more.',
  };
}
