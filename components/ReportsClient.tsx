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

interface ReportsClientProps {
  vitalSigns: VitalSign[];
  briefs: Brief[];
}

/* ---------- Helpers ---------- */

const LEVEL_ORDER: Record<string, number> = { division: 0, union: 1, conference: 2 };

function sortByLevel(a: VitalSign, b: VitalSign) {
  return (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
}

/* ---------- Component ---------- */

export default function ReportsClient({ vitalSigns, briefs }: ReportsClientProps) {
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
      {/* ── Vital Signs ── */}
      <Section
        title="Vital Signs"
        subtitle="Annual health reports for every entity. Search to find any entity's data page."
      >
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
              'focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40'
            )}
          />
        </div>

        {vsSearch.length > 0 && (
          <div className={cn('rounded-lg border divide-y max-h-80 overflow-y-auto', tokens.bg.card, tokens.border.default)}>
            {filteredVS.slice(0, 20).map(v => (
              <Link
                key={v.slug}
                href={`/entity/${v.entityCode}`}
                className={cn('flex items-center justify-between px-4 py-3 hover:bg-[#6366f1]/5 transition-colors')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className={cn('h-4 w-4 shrink-0', tokens.text.accent)} />
                  <div className="min-w-0">
                    <p className={cn('font-medium truncate', tokens.text.heading)}>{v.entityName}</p>
                    {v.parentCodes.length > 0 && (
                      <p className={cn('text-xs truncate', tokens.text.muted)}>
                        {[...v.parentCodes].reverse().join(' → ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <LevelBadge level={v.level} size="sm" />
                  <span className={cn('text-xs', tokens.text.muted)}>{v.year}</span>
                </div>
              </Link>
            ))}
            {filteredVS.length === 0 && (
              <p className={cn('text-sm px-4 py-3', tokens.text.muted)}>No entities match your search.</p>
            )}
            {filteredVS.length > 20 && (
              <p className={cn('text-xs px-4 py-2 text-center', tokens.text.muted)}>
                Showing 20 of {filteredVS.length} results — refine your search
              </p>
            )}
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

      {/* ── Pulse Briefs ── */}
      <Section
        title="Pulse Briefs"
        subtitle="Data stories, anomalies, and insights from across the world church."
      >
        {/* Tag pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              activeTag === 'all'
                ? cn(tokens.bg.accent, tokens.text.onAccent, 'border-transparent')
                : cn(tokens.bg.cardAlt, tokens.text.muted, tokens.border.default, 'hover:border-[#6366f1]/50')
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
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize',
                  activeTag === tag
                    ? cn(tokens.bg.accent, tokens.text.onAccent, 'border-transparent')
                    : isRegion
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50'
                      : cn(tokens.bg.cardAlt, tokens.text.muted, tokens.border.default, 'hover:border-[#6366f1]/50')
                )}
              >
                {isRegion ? <><Globe2 className="w-3 h-3 inline mr-1" />{tag}</> : tag}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tokens.text.muted)} />
          <input
            type="text"
            placeholder="Search briefs..."
            value={briefSearch}
            onChange={e => setBriefSearch(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
              tokens.bg.card, tokens.border.default, tokens.text.body,
              'focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40'
            )}
          />
        </div>

        {/* Brief cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBriefs.map(b => (
            <Link key={b.slug} href={`/reports/${b.slug}`}>
              <Card
                hover
                className={cn(
                  'h-full flex flex-col gap-3 cursor-pointer',
                  b.featured && 'ring-2 ring-[#6366f1]/60'
                )}
              >
                <div className="flex items-start gap-2">
                  <Newspaper className={cn('h-4 w-4 shrink-0 mt-0.5', tokens.text.accent)} />
                  <h3 className={cn('font-semibold leading-tight', tokens.text.heading)}>{b.title}</h3>
                </div>

                <p className={cn('text-sm line-clamp-2 flex-1', tokens.text.body)}>{b.subtitle}</p>

                <div className="flex flex-wrap gap-1.5">
                  {b.tags.map(t => (
                    <Badge key={t} variant="neutral" className="text-[10px]">{t.toLowerCase()}</Badge>
                  ))}
                </div>

                <div className={cn('flex items-center justify-between text-xs', tokens.text.muted)}>
                  <span>{formatDate(b.date)} &middot; {b.readTime}</span>
                  <span className={tokens.text.accent}>Read &rarr;</span>
                </div>
              </Card>
            </Link>
          ))}
          {filteredBriefs.length === 0 && (
            <p className={cn('text-sm col-span-full', tokens.text.muted)}>No briefs match your filters.</p>
          )}
        </div>
      </Section>
    </div>
  );
}
