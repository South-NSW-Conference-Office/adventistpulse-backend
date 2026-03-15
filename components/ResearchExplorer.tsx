'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Leaf, TrendingUp, GraduationCap, DollarSign, Landmark, Palette, BarChart3, Globe2, Trophy, Search, type LucideIcon } from 'lucide-react';

interface LRP {
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
  references: string[];
  wordCount: number;
  bodyLength: number;
}

interface Tag { tag: string; count: number; }

type SortKey = 'score' | 'sources' | 'words' | 'recent' | 'id';
type ViewMode = 'list' | 'grid' | 'compact';

// Topic categories for tree view
const TOPIC_MAP: Record<string, { label: string; icon: LucideIcon; keywords: string[] }> = {
  health: { label: 'Church Health', icon: Heart, keywords: ['health', 'vitality', 'ncd', 'measurement', 'diagnostic', 'pulse-score'] },
  youth: { label: 'Youth & Retention', icon: Leaf, keywords: ['youth', 'gen-z', 'retention', 'young-adult', 'teenager', 'millennial'] },
  growth: { label: 'Growth & Mission', icon: TrendingUp, keywords: ['growth', 'baptism', 'evangelism', 'mission', 'church-planting', 'church-attendance'] },
  education: { label: 'Education', icon: GraduationCap, keywords: ['education', 'school', 'university', 'teacher', 'student', 'homeschool'] },
  finance: { label: 'Finance & Stewardship', icon: DollarSign, keywords: ['tithe', 'finance', 'stewardship', 'budget', 'giving', 'ppp'] },
  structure: { label: 'Organization', icon: Landmark, keywords: ['governance', 'structure', 'church-manual', 'conference', 'policy'] },
  culture: { label: 'Culture & Identity', icon: Palette, keywords: ['culture', 'identity', 'conservative', 'progressive', 'worship', 'traditional'] },
  data: { label: 'Data & Methods', icon: BarChart3, keywords: ['data', 'metric', 'methodology', 'platform', 'competitor', 'api', 'pipeline'] },
  global: { label: 'Global Context', icon: Globe2, keywords: ['global', 'cross-denominational', 'international', 'division', 'historical'] },
  australia: { label: 'Australia', icon: Globe2, keywords: ['australia', 'snsw', 'nnsw', 'auc', 'spd'] },
};

function getTopicForLRP(lrp: LRP): string {
  const allText = [...lrp.tags, lrp.title.toLowerCase()].join(' ');
  let bestTopic = 'data';
  let bestScore = 0;
  for (const [key, { keywords }] of Object.entries(TOPIC_MAP)) {
    const score = keywords.filter(k => allText.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestTopic = key; }
  }
  return bestTopic;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-[#14b8a6]';
  if (grade.startsWith('C')) return 'text-yellow-400';
  return 'text-slate-400';
}

function getGradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/10 border-emerald-500/30';
  if (grade.startsWith('B')) return 'bg-[#14b8a6]/10 border-[#14b8a6]/30';
  if (grade.startsWith('C')) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-slate-500/10 border-slate-500/30';
}

export function ResearchExplorer({ lrps, tags }: { lrps: LRP[]; tags: Tag[] }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('score');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');

  const totalSources = lrps.reduce((s, l) => s + l.sourceCount, 0);
  const totalWords = lrps.reduce((s, l) => s + l.wordCount, 0);
  const avgScore = Math.round(lrps.reduce((s, l) => s + l.score, 0) / lrps.length);

  // Curated highlights
  const topRated = useMemo(() => [...lrps].sort((a, b) => b.score - a.score).slice(0, 5), [lrps]);
  const deepestResearch = useMemo(() => [...lrps].sort((a, b) => b.wordCount - a.wordCount).slice(0, 5), [lrps]);
  const mostSources = useMemo(() => [...lrps].sort((a, b) => b.sourceCount - a.sourceCount).slice(0, 5), [lrps]);
  const recentlyUpdated = useMemo(() =>
    [...lrps].filter(l => l.lastUpdated).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 5), [lrps]);

  // Topic tree
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lrp of lrps) {
      const topic = getTopicForLRP(lrp);
      counts[topic] = (counts[topic] || 0) + 1;
    }
    return counts;
  }, [lrps]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...lrps];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.coreQuestion.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        l.execSummary.toLowerCase().includes(q)
      );
    }

    if (selectedTopic) {
      result = result.filter(l => getTopicForLRP(l) === selectedTopic);
    }

    if (selectedTag) {
      result = result.filter(l => l.tags.includes(selectedTag));
    }

    switch (sort) {
      case 'score': result.sort((a, b) => b.score - a.score); break;
      case 'sources': result.sort((a, b) => b.sourceCount - a.sourceCount); break;
      case 'words': result.sort((a, b) => b.wordCount - a.wordCount); break;
      case 'recent': result.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || '')); break;
      case 'id': result.sort((a, b) => a.id.localeCompare(b.id)); break;
    }

    return result;
  }, [lrps, search, sort, selectedTopic, selectedTag]);

  return (
    <main className="min-h-screen bg-[#1a2332] text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#2a3a50]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold">Living Research Projects</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl">
            {lrps.length} LRPs powering Adventist Pulse. Continuously updated research that lives, not gathers dust.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 mt-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#14b8a6]">{lrps.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalSources.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-300">{Math.round(totalWords / 1000)}K</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{avgScore}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Highlights — viral curated sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <HighlightCard title="Highest Rated" lrps={topRated} metric={l => `${l.score}/100`} />
          <HighlightCard title="📚 Deepest Research" lrps={deepestResearch} metric={l => `${(l.wordCount / 1000).toFixed(1)}K words`} />
          <HighlightCard title="🔬 Most Sources" lrps={mostSources} metric={l => `${l.sourceCount} sources`} />
          <HighlightCard title="🆕 Recently Updated" lrps={recentlyUpdated} metric={l => l.lastUpdated} />
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search LRPs — title, question, tag, or keyword..."
              className="w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#14b8a6]/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-sm">✕</button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-slate-300 focus:outline-none"
            >
              <option value="score">Sort: Highest Score</option>
              <option value="sources">Sort: Most Sources</option>
              <option value="words">Sort: Deepest</option>
              <option value="recent">Sort: Recently Updated</option>
              <option value="id">Sort: LRP Number</option>
            </select>
            <div className="flex bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg overflow-hidden">
              {(['list', 'grid', 'compact'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 text-xs ${view === v ? 'bg-[#14b8a6]/20 text-[#14b8a6]' : 'text-slate-500 hover:text-slate-300'} transition-colors`}
                >
                  {v === 'list' ? '☰' : v === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — Topics + Tags */}
          <div className="hidden lg:block w-56 flex-shrink-0 space-y-4">
            {/* Topic tree */}
            <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-3">
              <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Topics</h3>
              <button
                onClick={() => setSelectedTopic(null)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${!selectedTopic ? 'bg-[#14b8a6]/15 text-[#14b8a6]' : 'text-slate-400 hover:text-white'}`}
              >
                All Topics <span className="text-slate-600">({lrps.length})</span>
              </button>
              {Object.entries(TOPIC_MAP).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTopic(selectedTopic === key ? null : key)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${selectedTopic === key ? 'bg-[#14b8a6]/15 text-[#14b8a6]' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icon className="w-3.5 h-3.5 inline-block mr-1.5 align-text-bottom" />{label} <span className="text-slate-600">({topicCounts[key] || 0})</span>
                </button>
              ))}
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-3">
              <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Popular Tags</h3>
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 20).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                      selectedTag === tag
                        ? 'bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30'
                        : 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Active filters */}
            {(selectedTopic || selectedTag || search) && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-slate-500">Showing {filtered.length} of {lrps.length}:</span>
                {selectedTopic && (
                  <button onClick={() => setSelectedTopic(null)} className="px-2 py-0.5 bg-[#14b8a6]/15 text-[#14b8a6] rounded flex items-center gap-1">
                    {selectedTopic && (() => { const I = TOPIC_MAP[selectedTopic]?.icon; return I ? <I className="w-3 h-3" /> : null })()} {TOPIC_MAP[selectedTopic]?.label} ✕
                  </button>
                )}
                {selectedTag && (
                  <button onClick={() => setSelectedTag(null)} className="px-2 py-0.5 bg-[#14b8a6]/15 text-[#14b8a6] rounded flex items-center gap-1">
                    #{selectedTag} ✕
                  </button>
                )}
                {search && (
                  <button onClick={() => setSearch('')} className="px-2 py-0.5 bg-[#14b8a6]/15 text-[#14b8a6] rounded flex items-center gap-1">
                    &ldquo;{search}&rdquo; ✕
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-6 h-6 mb-2 mx-auto text-slate-400" />
                <p>No LRPs match your search. Try different keywords or clear filters.</p>
              </div>
            ) : view === 'compact' ? (
              <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg divide-y divide-gray-200 dark:divide-slate-800/50">
                {filtered.map(lrp => (
                  <Link key={lrp.id} href={`/research/${lrp.id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <span className={`text-xs font-bold w-8 ${getGradeColor(lrp.grade)}`}>{lrp.grade || '—'}</span>
                    <span className="text-xs font-mono text-[#14b8a6] w-16">{lrp.id}</span>
                    <span className="text-sm text-slate-300 truncate flex-1">{lrp.title}</span>
                    <span className="text-[10px] text-slate-600 hidden md:inline">{lrp.sourceCount} src</span>
                    <span className="text-[10px] text-slate-600 hidden md:inline">{lrp.score}/100</span>
                  </Link>
                ))}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(lrp => (
                  <Link key={lrp.id} href={`/research/${lrp.id}`}
                    className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 hover:border-[#14b8a6]/40 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-bold ${getGradeColor(lrp.grade)}`}>{lrp.grade}</span>
                      <span className="text-xs font-mono text-[#14b8a6]">{lrp.id}</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{lrp.score}/100</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white line-clamp-2">{lrp.title}</h3>
                    {lrp.coreQuestion && <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">&ldquo;{lrp.coreQuestion}&rdquo;</p>}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
                      <span>{lrp.sourceCount} sources</span>
                      <span>·</span>
                      <span>{(lrp.wordCount / 1000).toFixed(1)}K words</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* List view (default) */
              <div className="space-y-2">
                {filtered.map(lrp => (
                  <Link key={lrp.id} href={`/research/${lrp.id}`}
                    className="block bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 hover:border-[#14b8a6]/40 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-lg border flex flex-col items-center justify-center ${getGradeBg(lrp.grade)}`}>
                        <span className={`text-lg font-bold ${getGradeColor(lrp.grade)}`}>{lrp.grade || '—'}</span>
                        <span className="text-[9px] text-slate-500">{lrp.score}/100</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#14b8a6]">{lrp.id}</span>
                          {lrp.lastUpdated && <span className="text-[10px] text-slate-600">{lrp.lastUpdated}</span>}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{lrp.title}</h3>
                        {lrp.coreQuestion && <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">&ldquo;{lrp.coreQuestion}&rdquo;</p>}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span>📄 {lrp.sourceCount} sources</span>
                          <span>📝 {(lrp.wordCount / 1000).toFixed(1)}K words</span>
                          <span className="flex items-center gap-1"><Globe2 className="w-3 h-3" />{lrp.regions.length} regions</span>
                        </div>
                        {lrp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lrp.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-slate-800/50 rounded text-gray-500 dark:text-slate-500">{tag}</span>
                            ))}
                            {lrp.tags.length > 4 && <span className="text-[9px] text-slate-600">+{lrp.tags.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 py-8 space-y-1">
          <p>Research conducted by Finn (Research Agent) · Curated by Neo · Directed by Kyle Morrison</p>
          <p>Living Research Projects are continuously updated as new data and sources emerge</p>
        </div>
      </div>
    </main>
  );
}

/* Highlight card for viral curated sections */
function HighlightCard({ title, lrps, metric }: { title: string; lrps: LRP[]; metric: (l: LRP) => string }) {
  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-3">
      <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">{title}</h3>
      <div className="space-y-1.5">
        {lrps.map((lrp, i) => (
          <Link key={lrp.id} href={`/research/${lrp.id}`} className="flex items-center gap-2 hover:bg-gray-100/50 dark:hover:bg-slate-800/30 rounded px-1 py-0.5 transition-colors">
            <span className="text-[10px] text-slate-600 w-3">{i + 1}.</span>
            <span className="text-xs text-slate-300 truncate flex-1">{lrp.title.slice(0, 35)}{lrp.title.length > 35 ? '...' : ''}</span>
            <span className="text-[10px] text-[#14b8a6] flex-shrink-0">{metric(lrp)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
