import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllLRPs, getLRP, getGradeColor, getGradeBg, getEvidenceDepth, getConfidenceBadge, QUALITY_CATEGORIES } from '@/lib/lrps';
import { tokens, cn } from '@/lib/theme';
import { formatDate } from '@/lib/format-date';
import { Globe2 } from 'lucide-react'

export async function generateStaticParams() {
  return getAllLRPs().map(lrp => ({ id: lrp.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lrp = getLRP(id);
  if (!lrp) return { title: 'Research Not Found' };
  return {
    title: `${lrp.id}: ${lrp.title} | Adventist Pulse Research`,
    description: lrp.coreQuestion || lrp.execSummary?.slice(0, 160),
  };
}

export default async function LRPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lrp = getLRP(id);
  if (!lrp) notFound();

  const depth = getEvidenceDepth(lrp.score);
  const confidence = getConfidenceBadge(lrp.confidence);
  const relatedLRPs = getAllLRPs()
    .filter(l => l.id !== lrp.id && l.tags.some(t => lrp.tags.includes(t)))
    .slice(0, 5);

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 dark:text-slate-500 mb-8">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-slate-300">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/research" className="text-[#6366F1] hover:underline">Research</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-600 dark:text-slate-400">{lrp.id}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-mono font-bold text-[#6366F1]">{lrp.id}</span>
            <div className={cn('px-2 py-0.5 rounded border text-xs font-bold', getGradeBg(lrp.grade))}>
              <span className={getGradeColor(lrp.grade)}>{lrp.grade}</span>
              {lrp.score > 0 && <span className="text-gray-400 dark:text-slate-500 ml-1">({lrp.score}/100)</span>}
            </div>
            {depth.label && <span className={cn('text-xs font-medium', depth.color)}>{depth.label}</span>}
          </div>
          <h1 className={cn('text-2xl md:text-3xl font-extrabold tracking-tight mb-3', tokens.text.heading)}>
            {lrp.title}
          </h1>
          {lrp.coreQuestion && (
            <p className="text-lg text-indigo-400 dark:text-indigo-300 italic">
              &ldquo;{lrp.coreQuestion}&rdquo;
            </p>
          )}
        </div>

        {/* Meta bar */}
        <div className={cn('flex flex-wrap gap-4 text-sm rounded-xl p-4 border mb-8', tokens.bg.card, tokens.border.default)}>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Sources</span>
            <span className={cn('ml-2 font-semibold', tokens.text.heading)}>{lrp.sourceCount}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Words</span>
            <span className={cn('ml-2 font-semibold', tokens.text.heading)}>{lrp.wordCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Confidence</span>
            <span className={cn('ml-2 font-semibold', confidence.color)}>{confidence.label}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Updated</span>
            <span className={cn('ml-2 font-semibold', tokens.text.heading)}>{formatDate(lrp.lastUpdated)}</span>
          </div>
        </div>

        {/* Tags & Regions */}
        <div className="flex flex-wrap gap-2 mb-8">
          {lrp.tags.map(tag => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
              {tag}
            </span>
          ))}
          {lrp.regions.map(region => (
            <span key={region} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/30">
              <Globe2 className="w-3.5 h-3.5 inline-block mr-1" />{region}
            </span>
          ))}
        </div>

        {/* Executive Summary */}
        {lrp.execSummary && (
          <section className="mb-8">
            <h2 className={cn('text-xl font-bold mb-3', tokens.text.heading)}>Executive Summary</h2>
            <div className={cn('rounded-xl p-6 border', tokens.bg.card, tokens.border.default)}>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {lrp.execSummary}
              </p>
            </div>
          </section>
        )}

        {/* Key Findings */}
        {lrp.keyFindings && lrp.keyFindings.length > 0 && (
          <section className="mb-8">
            <h2 className={cn('text-xl font-bold mb-3', tokens.text.heading)}>Key Findings</h2>
            <div className="space-y-3">
              {lrp.keyFindings.map((finding, i) => (
                <div key={i} className={cn('flex gap-3 rounded-xl p-4 border', tokens.bg.card, tokens.border.default)}>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#6366F1]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{finding}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quality Breakdown */}
        {lrp.qualityBreakdown && Object.keys(lrp.qualityBreakdown).length > 0 && (
          <section className="mb-8">
            <h2 className={cn('text-xl font-bold mb-3', tokens.text.heading)}>Quality Breakdown</h2>
            <div className={cn('rounded-xl p-6 border', tokens.bg.card, tokens.border.default)}>
              <div className="space-y-3">
                {QUALITY_CATEGORIES.map(cat => {
                  const val = lrp.qualityBreakdown[cat.key] || 0;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-slate-500 w-32 shrink-0">{cat.label}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#6366F1]"
                          style={{ width: `${(val / cat.max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 w-10 text-right">{val}/{cat.max}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* References */}
        {lrp.references && lrp.references.length > 0 && (
          <section className="mb-8">
            <h2 className={cn('text-xl font-bold mb-3', tokens.text.heading)}>References</h2>
            <div className={cn('rounded-xl p-6 border', tokens.bg.card, tokens.border.default)}>
              <ol className="list-decimal list-inside space-y-2">
                {lrp.references.map((ref, i) => (
                  <li key={i} className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed break-words">
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Related Research */}
        {relatedLRPs.length > 0 && (
          <section className="mb-8">
            <h2 className={cn('text-xl font-bold mb-3', tokens.text.heading)}>Related Research</h2>
            <div className="space-y-3">
              {relatedLRPs.map(related => (
                <Link
                  key={related.id}
                  href={`/research/${related.id}`}
                  className={cn('flex items-center gap-4 rounded-xl p-4 border hover:border-[#6366F1]/50 transition-colors', tokens.bg.card, tokens.border.default)}
                >
                  <div className={cn('flex-shrink-0 w-10 h-10 rounded border flex flex-col items-center justify-center', getGradeBg(related.grade))}>
                    <span className={cn('text-xs font-bold', getGradeColor(related.grade))}>{related.grade}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#6366F1]">{related.id}</span>
                    </div>
                    <h3 className={cn('text-sm font-semibold truncate', tokens.text.heading)}>{related.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="pt-4 border-t border-gray-200 dark:border-[#334155]">
          <Link href="/research" className="text-sm text-[#6366F1] hover:underline">
            ← Back to Research Library
          </Link>
        </div>
      </div>
    </main>
  );
}
