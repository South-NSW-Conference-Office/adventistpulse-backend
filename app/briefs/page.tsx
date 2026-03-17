'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';

interface PulseBrief {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  lrpSource: string;
  readTime: string;
  publishDate: string;
  tags: string[];
  heroStat: string;
  heroStatLabel: string;
  body: string;
  pullQuote: string;
  sourceNote: string;
  discussionPrompt: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Stewardship & Finance': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Church Growth & Decline': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Youth & Generational': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Leadership & Governance': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Health & Lifestyle': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  'Education': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Media & Trust': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'Cross-Denominational': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<PulseBrief[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load briefs client-side
  if (!loaded) {
    fetch('/data/briefs.json')
      .then(r => r.json())
      .then(d => { setBriefs(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }

  const categories = useMemo(() => [...new Set(briefs.map(b => b.category))], [briefs]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return briefs;
    return briefs.filter(b => b.category === activeCategory);
  }, [briefs, activeCategory]);

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('flex items-center justify-center rounded-xl w-10 h-10', tokens.bg.accentSoft)}>
              <Zap className={cn('h-5 w-5', tokens.text.accent)} />
            </div>
            <h1 className={cn('text-3xl font-bold tracking-tight', tokens.text.heading)}>
              Pulse Briefs
            </h1>
          </div>
          <p className={cn('mt-2 max-w-2xl', tokens.text.body)}>
            The most striking findings from 180+ research projects — data-driven,
            both-sides-present, designed to start conversations.
          </p>
        </div>

        {/* Category pills — clickable */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
              activeCategory === 'all'
                ? cn(tokens.bg.accent, tokens.text.onAccent, 'border-transparent')
                : cn(tokens.bg.card, tokens.text.muted, tokens.border.default, 'hover:border-[#6366F1]/50')
            )}
          >
            All ({briefs.length})
          </button>
          {categories.map(cat => {
            const style = getCategoryStyle(cat);
            const count = briefs.filter(b => b.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                  isActive
                    ? cn(tokens.bg.accent, tokens.text.onAccent, 'border-transparent')
                    : cn(style.bg, style.text, style.border, 'hover:opacity-80')
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {!loaded && <p className={cn('text-sm', tokens.text.muted)}>Loading briefs...</p>}

        {/* Featured briefs */}
        {featured.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {featured.map(brief => {
              const style = getCategoryStyle(brief.category);
              const isOpen = expandedId === brief.id;
              return (
                <div
                  key={brief.id}
                  className={cn('rounded-xl border overflow-hidden cursor-pointer', tokens.bg.card, tokens.border.default, tokens.border.hover, 'transition-colors')}
                  onClick={() => toggle(brief.id)}
                >
                  <div className={cn('p-6 text-center', tokens.bg.accentSoft)}>
                    <div className={cn('text-3xl font-extrabold', tokens.text.accent)}>{brief.heroStat}</div>
                    <div className={cn('text-xs mt-1', tokens.text.muted)}>{brief.heroStatLabel}</div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', style.bg, style.text, style.border)}>
                        {brief.category}
                      </span>
                      <span className={cn('text-[10px]', tokens.text.muted)}>{brief.readTime}</span>
                    </div>
                    <h2 className={cn('font-bold text-lg mb-1', tokens.text.heading)}>{brief.title}</h2>
                    <p className={cn('text-sm mb-3', tokens.text.body)}>{brief.subtitle}</p>

                    {!isOpen && (
                      <blockquote className={cn('text-sm italic border-l-2 pl-3 mb-3 border-[#6366F1]/30', tokens.text.accent, 'opacity-70')}>
                        {brief.pullQuote}
                      </blockquote>
                    )}

                    {isOpen && (
                      <div className="mt-3 space-y-3">
                        <div className={cn('text-sm leading-relaxed whitespace-pre-line', tokens.text.body)}>
                          {brief.body}
                        </div>
                        {brief.discussionPrompt && (
                          <div className={cn('rounded-lg p-3 border', tokens.bg.accentSoft, 'border-[#6366F1]/20')}>
                            <p className={cn('text-xs font-medium mb-1', tokens.text.accent)}>Discussion</p>
                            <p className={cn('text-sm', tokens.text.body)}>{brief.discussionPrompt}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className={cn('text-[10px]', tokens.text.muted)}>Source: {brief.lrpSource}</span>
                      {isOpen
                        ? <ChevronUp className={cn('h-4 w-4', tokens.text.muted)} />
                        : <ChevronDown className={cn('h-4 w-4', tokens.text.muted)} />
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Remaining briefs */}
        <div className="space-y-4">
          {rest.map(brief => {
            const style = getCategoryStyle(brief.category);
            const isOpen = expandedId === brief.id;
            return (
              <div
                key={brief.id}
                className={cn('rounded-xl border p-5 cursor-pointer', tokens.bg.card, tokens.border.default, tokens.border.hover, 'transition-colors')}
                onClick={() => toggle(brief.id)}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-24 text-center">
                    <div className={cn('text-2xl font-extrabold', tokens.text.accent)}>{brief.heroStat}</div>
                    <div className={cn('text-[9px] leading-tight mt-1', tokens.text.muted)}>{brief.heroStatLabel}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', style.bg, style.text, style.border)}>
                        {brief.category}
                      </span>
                      <span className={cn('text-[10px] font-mono', tokens.text.accent)}>{brief.id}</span>
                      <span className={cn('text-[10px]', tokens.text.muted)}>{brief.readTime}</span>
                    </div>
                    <h3 className={cn('font-semibold mb-1', tokens.text.heading)}>{brief.title}</h3>
                    <p className={cn('text-sm mb-2', tokens.text.body)}>{brief.subtitle}</p>

                    {!isOpen && (
                      <blockquote className={cn('text-sm italic border-l-2 pl-3 mb-2 border-[#6366F1]/20', tokens.text.accent, 'opacity-70')}>
                        {brief.pullQuote}
                      </blockquote>
                    )}

                    {isOpen && (
                      <div className="mt-3 space-y-3">
                        <div className={cn('text-sm leading-relaxed whitespace-pre-line', tokens.text.body)}>
                          {brief.body}
                        </div>
                        {brief.discussionPrompt && (
                          <div className={cn('rounded-lg p-3 border', tokens.bg.accentSoft, 'border-[#6366F1]/20')}>
                            <p className={cn('text-xs font-medium mb-1', tokens.text.accent)}>Discussion</p>
                            <p className={cn('text-sm', tokens.text.body)}>{brief.discussionPrompt}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <span className={cn('text-[10px]', tokens.text.muted)}>Source: {brief.lrpSource}</span>
                        <span className={cn('text-[10px]', tokens.text.muted)}>&middot;</span>
                        <span className={cn('text-[10px]', tokens.text.muted)}>{formatDate(brief.publishDate)}</span>
                      </div>
                      {isOpen
                        ? <ChevronUp className={cn('h-4 w-4', tokens.text.muted)} />
                        : <ChevronDown className={cn('h-4 w-4', tokens.text.muted)} />
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={cn('mt-12 text-center py-8 border border-dashed rounded-lg', tokens.border.default)}>
          <p className={cn('text-sm', tokens.text.muted)}>
            New Pulse Briefs published regularly from our research library of 180+ Living Research Projects.
          </p>
          <Link href="/research" className={cn('text-sm mt-2 inline-block hover:underline', tokens.text.accent)}>
            Explore the full Research Library →
          </Link>
        </div>
      </div>
    </main>
  );
}
