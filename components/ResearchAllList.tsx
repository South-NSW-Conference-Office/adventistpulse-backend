'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { Search, Lock, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ResearchPaper {
  id: string;
  title: string;
  coreQuestion?: string;
  status?: string;
  grade?: string;
  score?: number;
  tags?: string[];
  regions?: string[];
  rootQuestions?: string[];
  sourceCount?: number;
  wordCount?: number;
  lastUpdated?: string;
  confidence?: string;
  execSummary?: string;
  keyFindings?: string[];
}

interface Props {
  papers: ResearchPaper[];
}

const GRADES = ['B+', 'B', 'B-'];

function gradeColor(grade: string) {
  if (grade === 'B+') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (grade === 'B')  return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
}

// Free users get exec summary + first 3 findings. Everything else is gated.
const FREE_LIMIT = 3;

export default function ResearchAllList({ papers }: Props) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'updated' | 'title'>('score');
  const [showAllTags, setShowAllTags] = useState(false);

  // Build tag list from all papers
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of papers) {
      for (const t of p.tags ?? []) counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [papers]);

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 12);

  const filtered = useMemo(() => {
    let list = [...papers];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.coreQuestion?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.id?.toLowerCase().includes(q)
      );
    }

    if (selectedTags.length > 0) {
      list = list.filter(p =>
        selectedTags.every(tag => p.tags?.includes(tag))
      );
    }

    if (selectedGrade) {
      list = list.filter(p => p.grade === selectedGrade);
    }

    list.sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'updated') return (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? '');
      return (a.title ?? '').localeCompare(b.title ?? '');
    });

    return list;
  }, [papers, query, selectedTags, selectedGrade, sortBy]);

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  const hasFilters = query || selectedTags.length > 0 || selectedGrade;

  return (
    <div>
      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search research by title, question, or tag…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none focus:border-[#6366F1] transition-colors',
              tokens.bg.card, tokens.border.default, tokens.text.heading
            )}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className={cn(
            'px-3 py-2.5 rounded-xl text-sm border outline-none cursor-pointer',
            tokens.bg.card, tokens.border.default, tokens.text.body
          )}
        >
          <option value="score">Sort: Quality score</option>
          <option value="updated">Sort: Recently updated</option>
          <option value="title">Sort: A–Z</option>
        </select>
      </div>

      {/* Tag filters */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {/* Grade filter */}
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGrade(prev => prev === g ? '' : g)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                selectedGrade === g
                  ? gradeColor(g)
                  : cn(tokens.bg.card, tokens.border.default, tokens.text.muted)
              )}
            >
              Grade {g}
            </button>
          ))}

          <div className="w-px bg-gray-200 dark:bg-slate-700 mx-1 self-stretch" />

          {/* Tag filters */}
          {visibleTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs border transition-all',
                selectedTags.includes(tag)
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : cn(tokens.bg.card, tokens.border.default, tokens.text.muted, 'hover:border-[#6366F1]/50')
              )}
            >
              {tag} <span className="opacity-60">{count}</span>
            </button>
          ))}

          {allTags.length > 12 && (
            <button
              onClick={() => setShowAllTags(p => !p)}
              className={cn('px-2.5 py-1 rounded-lg text-xs border flex items-center gap-1', tokens.bg.card, tokens.border.default, tokens.text.muted)}
            >
              {showAllTags ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> +{allTags.length - 12} more</>}
            </button>
          )}
        </div>
      </div>

      {/* Active filter summary + clear */}
      {hasFilters && (
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className={tokens.text.muted}>
            {filtered.length} of {papers.length} results
          </span>
          <button
            onClick={() => { setQuery(''); setSelectedTags([]); setSelectedGrade(''); }}
            className="flex items-center gap-1 text-[#6366F1] hover:underline text-xs"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className={cn('rounded-xl p-12 text-center border', tokens.bg.card, tokens.border.default)}>
          <p className={cn('text-sm', tokens.text.muted)}>No research matches your filters.</p>
          <button onClick={() => { setQuery(''); setSelectedTags([]); setSelectedGrade(''); }} className="mt-3 text-sm text-[#6366F1] hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-gray-100 dark:divide-[#1e2d3d]">
          {filtered.map(paper => {
            const findingCount = paper.keyFindings?.length ?? 0;
            const gated = findingCount > FREE_LIMIT;

            return (
              <Link
                key={paper.id}
                href={`/research/${paper.id}`}
                className="flex items-start gap-4 py-5 group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] -mx-4 px-4 transition-colors rounded-xl"
              >
                {/* Grade badge */}
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg border flex flex-col items-center justify-center mt-0.5',
                  gradeColor(paper.grade ?? '')
                )}>
                  <span className="text-xs font-extrabold leading-none">{paper.grade || '?'}</span>
                  {paper.score ? <span className="text-[9px] opacity-60 mt-0.5">{paper.score}</span> : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-[#6366F1]">{paper.id}</span>
                        {paper.sourceCount ? (
                          <span className={cn('text-[10px]', tokens.text.muted)}>{paper.sourceCount} sources</span>
                        ) : null}
                      </div>
                      <h3 className={cn('text-sm font-semibold leading-snug group-hover:text-[#6366F1] transition-colors', tokens.text.heading)}>
                        {paper.title}
                      </h3>
                      {paper.coreQuestion && (
                        <p className="text-xs text-indigo-400 dark:text-indigo-400/80 italic mt-0.5 line-clamp-1">
                          &ldquo;{paper.coreQuestion}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Gate indicator */}
                    {gated && (
                      <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        <Lock className="w-3 h-3" />
                        <span>{findingCount - FREE_LIMIT} more</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {paper.tags && paper.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {paper.tags.slice(0, 4).map(t => (
                        <span
                          key={t}
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full border',
                            selectedTags.includes(t)
                              ? 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/30'
                              : 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700/30'
                          )}
                        >
                          {t}
                        </span>
                      ))}
                      {paper.tags.length > 4 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">+{paper.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className={cn('mt-8 rounded-xl p-6 text-center border', tokens.bg.card, tokens.border.default)}>
        <Lock className="w-6 h-6 text-[#6366F1] mx-auto mb-2" />
        <p className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>
          Full access unlocks with Researcher tier
        </p>
        <p className={cn('text-xs mb-4', tokens.text.muted)}>
          {papers.length} research projects · unlimited findings · full references · coming soon
        </p>
        <Link
          href="/beta"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#6366F1] text-white hover:bg-[#4f46e5] transition-colors"
        >
          Join the waitlist
        </Link>
      </div>
    </div>
  );
}
