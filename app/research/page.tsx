import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { formatDate } from '@/lib/format-date';
import ResearchAllList from '@/components/ResearchAllList';

export const metadata = {
  title: 'Research | Adventist Pulse',
  description: 'Evidence-based research powering every insight on Adventist Pulse — 200+ living research projects on church health, growth, and mission.',
};

interface ResearchPaper {
  id: string;
  title: string;
  coreQuestion: string;
  status: string;
  grade: string;
  score: number;
  tags: string[];
  regions: string[];
  sourceCount: number;
  primarySources: number;
  lastUpdated: string;
  confidence: string;
  execSummary: string;
  keyFindings: string[];
  file: string;
  wordCount: number;
}

function getAllResearch(): { research: ResearchPaper[]; totalCount: number } {
  try {
    const researchPath = path.join(process.cwd(), 'data', 'research-index.json');
    const researchData = JSON.parse(fs.readFileSync(researchPath, 'utf-8'));
    return {
      research: researchData.research || [],
      totalCount: researchData.totalCount || 0,
    };
  } catch {
    return { research: [], totalCount: 0 };
  }
}

function getAllTags(research: ResearchPaper[]): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const paper of research) {
    for (const tag of (Array.isArray(paper.tags) ? paper.tags : [])) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-teal-400';
  if (grade.startsWith('C')) return 'text-amber-400';
  if (grade.startsWith('D')) return 'text-red-400';
  return 'text-slate-400';
}

const UNSPLASH_POOL = [
  'photo-1451187580459-43490279c0fa',
  'photo-1551288049-bebda4e38f71',
  'photo-1460925895917-afdab827c52f',
  'photo-1529156069898-49953e39b3ac',
  'photo-1519389950473-47ba0277781c',
  'photo-1454165804606-c3d57bc86b40',
  'photo-1488521787496-c6e09b87b73d',
  'photo-1434030216411-0b793f4b6f1d',
  'photo-1532619675605-1ede6c2ed2b0',
  'photo-1504711434969-e33886168f5c',
  'photo-1562564055-71e051d33c19',
  'photo-1516321318423-f06f85e504b3',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1577896851905-42c6b46e2a84',
  'photo-1473116763249-2faaef81ccda',
];

function unsplashUrl(id: string, w = 800, h = 500): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  const photo = UNSPLASH_POOL[hash % UNSPLASH_POOL.length];
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

function getTopTag(paper: ResearchPaper): string {
  const tags = Array.isArray(paper.tags) ? paper.tags : [];
  return tags[0] ?? (paper.id.startsWith('LRP-') ? 'Living Research' : 'Research Note');
}

export default function ResearchPage() {
  const { research, totalCount } = getAllResearch();
  const tags = getAllTags(research);

  const sortedResearch = [...research].sort((a, b) => {
    const aIsLRP = a.id.startsWith('LRP-');
    const bIsLRP = b.id.startsWith('LRP-');
    if (aIsLRP && !bIsLRP) return -1;
    if (!aIsLRP && bIsLRP) return 1;
    return new Date(b.lastUpdated || '1900-01-01').getTime() - new Date(a.lastUpdated || '1900-01-01').getTime();
  });

  const FEATURED_IDS = ['LRP-167', 'LRP-044', 'LRP-065'];
  const featured = FEATURED_IDS
    .map(id => sortedResearch.find(r => r.id === id))
    .filter(Boolean) as ResearchPaper[];

  // hero = first featured, sidebar = rest
  const heroItem = featured[0];
  const sidebarItems = featured.slice(1);
  // fill sidebar to 5 items with recent non-featured LRPs
  const extraItems = sortedResearch
    .filter(r => r.id.startsWith('LRP-') && !FEATURED_IDS.includes(r.id))
    .slice(0, 5 - sidebarItems.length);
  const allSidebar = [...sidebarItems, ...extraItems].slice(0, 5);

  // Recent posts — first 6 non-featured
  const recentPosts = sortedResearch
    .filter(r => !FEATURED_IDS.includes(r.id))
    .slice(0, 6);

  const topTags = tags.slice(0, 14);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Hero + Sidebar ── */}
        {heroItem && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-14">

            {/* Hero card */}
            <Link href={`/research/${heroItem.id}`} className="lg:col-span-3 group block">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={unsplashUrl(heroItem.id, 900, 560)}
                  alt={heroItem.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Grade badge top-right */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className={`text-sm font-bold ${getGradeColor(heroItem.grade)} drop-shadow`}>{heroItem.grade}</span>
                </div>
                {/* Bottom overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                    {getTopTag(heroItem)}
                  </span>
                  <h2 className="text-white text-2xl font-bold leading-snug group-hover:text-white/90 transition-colors line-clamp-3">
                    {heroItem.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-white/60 text-xs">
                    <span className="font-mono">{heroItem.id}</span>
                    <span>·</span>
                    <span>{heroItem.sourceCount ?? 0} sources</span>
                    <span>·</span>
                    <span>{formatDate(heroItem.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Sidebar — Other featured */}
            <div className="lg:col-span-2">
              <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Other featured research</h3>
              <div className="divide-y divide-gray-100 dark:divide-[#2a3a50]">
                {allSidebar.map(paper => (
                  <Link key={paper.id} href={`/research/${paper.id}`} className="flex items-start gap-3 py-3 group">
                    <div className="w-16 h-12 rounded-lg shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={unsplashUrl(paper.id, 120, 90)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-teal-500 transition-colors leading-snug line-clamp-2">
                      {paper.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Recent Research ── */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Research</h2>
            <span className="text-xs border border-gray-200 dark:border-[#2a3a50] rounded-full px-4 py-1.5 text-gray-500 dark:text-slate-400">
              {totalCount} papers total
            </span>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map(paper => (
              <Link key={paper.id} href={`/research/${paper.id}`} className="group block">
                {/* Card image */}
                <div className="w-full rounded-xl overflow-hidden aspect-[16/9] mb-4 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={unsplashUrl(paper.id, 600, 340)} alt={paper.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className={`text-[11px] font-bold text-white drop-shadow`}>{paper.grade}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-teal-500 transition-colors line-clamp-2">
                  {paper.title}
                </h3>
                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
                  {paper.coreQuestion || paper.execSummary || ''}
                </p>
                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                  <span className="font-mono text-teal-400">{paper.id}</span>
                  <span>·</span>
                  <span>{paper.sourceCount ?? 0} sources</span>
                  <span>·</span>
                  <span>{formatDate(paper.lastUpdated)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Tag Filters + Full List ── */}
        <div className="border-t border-gray-100 dark:border-[#2a3a50] pt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Research</h2>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-teal-400/40 text-teal-500 bg-teal-50 dark:bg-teal-500/10">
              All ({totalCount})
            </button>
            {topTags.map(({ tag, count }) => (
              <button
                key={tag}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2a3a50] text-gray-500 dark:text-slate-400 hover:border-teal-400/50 hover:text-teal-500 transition-colors"
              >
                {tag} ({count})
              </button>
            ))}
          </div>

          <ResearchAllList papers={sortedResearch} />
        </div>

      </div>
    </main>
  );
}
