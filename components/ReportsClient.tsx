'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Globe2, Newspaper, Search } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';
import { Card, Badge, Section } from '@/components/ui';
import { LevelBadge } from '@/components/LevelBadge';
import { formatDate } from '@/lib/format-date';
import type { EntityLevel } from '@/types/pulse';

/* ---------- Types ---------- */

interface VitalSign {
  slug: string;
  entityCode: string;
  entityName: string;
  parentCodes: string[];
  level: EntityLevel;
  year: number;
  date: string;
  summary: string;
}

interface Brief {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

interface FeaturedReport {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
}

interface ReportsClientProps {
  vitalSigns: VitalSign[];
  briefs: Brief[];
  stateOfAdventism: FeaturedReport;
}

/* ---------- Helpers ---------- */

const LEVEL_ORDER: Record<string, number> = { division: 0, union: 1, conference: 2 };

function sortByLevel(a: VitalSign, b: VitalSign) {
  return (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
}

/* ---------- Component ---------- */

export default function ReportsClient({ vitalSigns, briefs, stateOfAdventism }: ReportsClientProps) {
  const [vsSearch, setVsSearch] = useState('');
  const [briefSearch, setBriefSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  // Vital Signs — filtered + sorted
  const filteredVS = useMemo(() => {
    const q = vsSearch.toLowerCase();
    return vitalSigns
      .filter(v => !q || v.entityName.toLowerCase().includes(q) || v.entityCode.toLowerCase().includes(q))
      .sort(sortByLevel);
  }, [vitalSigns, vsSearch]);

  // Briefs — all unique tags
  const REGION_TAGS = ['australia', 'usa', 'africa', 'europe', 'asia', 'south america', 'pacific', 'global'];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    briefs.forEach(b => b.tags.forEach(t => set.add(t.toLowerCase())));
    const tags = Array.from(set);
    // Regions first, then alphabetical
    const regions = tags.filter(t => REGION_TAGS.includes(t)).sort();
    const rest = tags.filter(t => !REGION_TAGS.includes(t)).sort();
    return [...regions, ...rest];
  }, [briefs]);

  // Briefs — filtered
  const filteredBriefs = useMemo(() => {
    const q = briefSearch.toLowerCase();
    return briefs.filter(b => {
      const matchTag = activeTag === 'all' || b.tags.some(t => t.toLowerCase() === activeTag);
      const matchSearch = !q || b.title.toLowerCase().includes(q) || b.subtitle.toLowerCase().includes(q);
      return matchTag && matchSearch;
    });
  }, [briefs, activeTag, briefSearch]);

  return (
    <div className="space-y-16 mt-12">

      {/* ── Pulse Briefs ── */}
      <Section
        title="Pulse Briefs"
        subtitle="Data stories, anomalies, and insights from across the world church."
      >
        <div className="flex gap-8 items-start">

          {/* Main — cards only */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Brief list */}
            <div className="divide-y divide-gray-100 dark:divide-[#2a3a50]">
              {filteredBriefs.map(b => (
                <Link key={b.slug} href={`/reports/${b.slug}`} className="block py-8 group">
                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span>{formatDate(b.date)}</span>
                    <span className="w-px h-3 bg-gray-200 dark:bg-[#2a3a50]" />
                    <span className="text-[#6366F1] font-semibold uppercase tracking-wide">{b.readTime}</span>
                  </div>
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-[#6366F1] transition-colors">
                    {b.title}
                  </h3>
                  {/* Subtitle */}
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {b.subtitle}
                  </p>
                  {/* Learn more */}
                  <span className="text-sm font-semibold text-[#6366F1] inline-flex items-center gap-1">
                    Learn more &rsaquo;
                  </span>
                </Link>
              ))}
              {filteredBriefs.length === 0 && (
                <p className={cn('text-sm py-8', tokens.text.muted)}>No briefs match your filters.</p>
              )}
              {/* Subtitle below articles */}
              <p className={cn('text-sm mt-6 pt-6 border-t', tokens.text.muted, tokens.border.default)}>
                Data-driven analysis of the global Seventh-day Adventist Church.
              </p>
            </div>
          </div>

          {/* Right sidebar — search + tag filters */}
          <div className="w-48 shrink-0 sticky top-20">

            {/* Search */}
            <div className="relative mb-3">
              <Search className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5', tokens.text.muted)} />
              <input
                type="text"
                placeholder="Search briefs..."
                value={briefSearch}
                onChange={e => setBriefSearch(e.target.value)}
                className={cn(
                  'w-full pl-8 pr-3 py-2 rounded-lg border text-xs',
                  tokens.bg.card, tokens.border.default, tokens.text.body,
                  'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40'
                )}
              />
            </div>

            <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', tokens.text.muted)}>Filter by Tag</p>
            <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <button
                onClick={() => setActiveTag('all')}
                className={cn(
                  'text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTag === 'all'
                    ? 'bg-[#6366F1] text-white'
                    : cn(tokens.text.muted, 'hover:bg-gray-100 dark:hover:bg-[#253344]')
                )}
              >
                All
              </button>
              {allTags.map(tag => {
                const isRegion = REGION_TAGS.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={cn(
                      'text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                      activeTag === tag
                        ? 'bg-[#6366F1] text-white'
                        : isRegion
                          ? cn('text-emerald-500 hover:bg-emerald-500/10')
                          : cn(tokens.text.muted, 'hover:bg-gray-100 dark:hover:bg-[#253344]')
                    )}
                  >
                    {isRegion && <Globe2 className="w-3 h-3 inline mr-1.5 opacity-70" />}{tag}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </Section>

      {/* ── State of Adventism ── */}
      {stateOfAdventism && (
      <Section title="State of Adventism" subtitle="The flagship annual report on the health of the global Adventist Church.">
        <Link href={`/reports/${stateOfAdventism.slug}`} className="block group">
          <div className="border-b border-gray-100 dark:border-[#2a3a50] py-8 group">
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              <span>{formatDate(stateOfAdventism.date)}</span>
              <span className="w-px h-3 bg-gray-200 dark:bg-[#2a3a50]" />
              <span className="text-[#6366F1] font-semibold uppercase tracking-wide">{stateOfAdventism.readTime}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-[#6366F1] transition-colors">
              {stateOfAdventism.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
              {stateOfAdventism.subtitle}
            </p>
            <span className="text-sm font-semibold text-[#6366F1]">Learn more &rsaquo;</span>
          </div>
        </Link>
      </Section>
      )}

      {/* ── Vital Signs ── */}
      <Section title="Vital Signs" subtitle="Annual health reports for every entity. Search to find any entity's data page.">
        <div className="relative max-w-lg">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tokens.text.muted)} />
          <input
            type="text"
            placeholder="Search 639 entities — e.g. South Pacific, SNSW, Kenya..."
            value={vsSearch}
            onChange={e => setVsSearch(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-lg border text-sm',
              tokens.bg.card, tokens.border.default, tokens.text.body,
              'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40'
            )}
          />
        </div>
        {vsSearch.length > 0 && (
          <div className={cn('rounded-lg border divide-y max-h-80 overflow-y-auto', tokens.bg.card, tokens.border.default)}>
            {filteredVS.slice(0, 20).map(v => (
              <Link key={v.slug} href={`/entity/${v.entityCode}`} className={cn('flex items-center justify-between px-4 py-3 hover:bg-[#6366F1]/5 transition-colors')}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className={cn('h-4 w-4 shrink-0', tokens.text.accent)} />
                  <div className="min-w-0">
                    <p className={cn('font-medium truncate', tokens.text.heading)}>{v.entityName}</p>
                    {v.parentCodes.length > 0 && (
                      <p className={cn('text-xs truncate', tokens.text.muted)}>{[...v.parentCodes].reverse().join(' → ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <LevelBadge level={v.level} size="sm" />
                  <span className={cn('text-xs', tokens.text.muted)}>{v.year}</span>
                </div>
              </Link>
            ))}
            {filteredVS.length === 0 && <p className={cn('text-sm px-4 py-3', tokens.text.muted)}>No entities match your search.</p>}
            {filteredVS.length > 20 && <p className={cn('text-xs px-4 py-2 text-center', tokens.text.muted)}>Showing 20 of {filteredVS.length} results — refine your search</p>}
          </div>
        )}
        {vsSearch.length === 0 && (
          <div className={cn('flex items-center gap-6 text-sm', tokens.text.muted)}>
            <span>{vitalSigns.length} entities available</span>
            <span>·</span>
            <span>Start typing to search</span>
          </div>
        )}
      </Section>

    </div>
  );
}
