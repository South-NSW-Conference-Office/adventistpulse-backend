import Link from 'next/link';
import { Users, Target, TrendingUp, Map, Scale, type LucideIcon } from 'lucide-react';
import { getBenchmarkSuggestions } from '@/lib/benchmarking';
import { LevelBadge } from './LevelBadge';

interface BenchmarkSuggestionsProps {
  entityCode: string;
  entityName: string;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

const categoryIcons: Record<string, LucideIcon> = {
  peer: Users,
  aspiration: Target,
  trajectory: TrendingUp,
  geographic: Map,
  'similar-size': Scale,
};

const categoryLabels = {
  peer: 'Similar Peers',
  aspiration: 'Aspirational',
  trajectory: 'Similar Trend',
  geographic: 'Geographic',
  'similar-size': 'Similar Scale',
};

export function BenchmarkSuggestions({ entityCode, entityName }: BenchmarkSuggestionsProps) {
  const suggestions = getBenchmarkSuggestions(entityCode);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
          Smart Benchmarks
        </h2>
        <Link
          href={`/compare?entities=${entityCode},${suggestions.slice(0, 3).map(s => s.entity.code).join(',')}`}
          className="text-sm text-[#6366F1] hover:text-[#8b5cf6]"
        >
          Compare All →
        </Link>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        AI-suggested entities to benchmark {entityName} against based on size, growth patterns, and context.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.slice(0, 6).map((suggestion) => {
          const entity = suggestion.entity;
          const stats = suggestion.stats;
          
          return (
            <Link
              key={entity.code}
              href={`/compare?entities=${entityCode},${entity.code}`}
              className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 hover:border-[#6366F1]/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = categoryIcons[suggestion.category] || Users; return <Icon className="w-4 h-4 text-slate-400" /> })()}
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {categoryLabels[suggestion.category]}
                  </span>
                </div>
                <LevelBadge level={entity.level as any} size="sm" />
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white text-sm mb-1">
                {entity.name}
              </h3>
              
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {suggestion.reason}
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-baseline gap-3">
                  <span className="text-gray-900 dark:text-white font-medium tabular-nums">
                    {fmt(stats?.membership)}
                  </span>
                  <span className="text-slate-500">members</span>
                </div>
                {stats?.growthRate !== null && stats?.growthRate !== undefined && (
                  <span className={`font-medium tabular-nums ${
                    stats.growthRate > 0 ? 'text-emerald-400' : 
                    stats.growthRate < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Similarity indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-full h-1">
                  <div 
                    className="bg-[#6366F1] h-1 rounded-full transition-all"
                    style={{ width: `${suggestion.similarity * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {Math.round(suggestion.similarity * 100)}% match
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick comparison actions */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Quick compares:</span>
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <Link
            key={suggestion.entity.code}
            href={`/compare?entities=${entityCode},${suggestion.entity.code}`}
            className="text-[#6366F1] hover:text-[#8b5cf6]"
          >
            vs {suggestion.entity.name.split(' ').slice(-1)[0]}
            {index < 2 && index < suggestions.slice(0, 3).length - 1 && <span className="text-slate-600 ml-1">•</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}