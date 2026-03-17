import type { PulseScore, ScoreComponent } from '@/lib/pulse-score';
import { tokens, cn } from '@/lib/theme';
import { Card } from '@/components/ui';

interface PulseScoreCardProps {
  score: PulseScore;
  entityName: string;
}

const GRADE_COLORS = {
  'A': 'text-emerald-400',
  'B': 'text-[#6366F1]',
  'C': 'text-amber-400',
  'D': 'text-orange-400',
  'F': 'text-red-400',
  '—': 'text-slate-600',
};

const GRADE_BG = {
  'A': 'bg-emerald-500/10 border-emerald-500/30',
  'B': 'bg-[#6366F1]/10 border-[#6366F1]/30',
  'C': 'bg-amber-500/10 border-amber-500/30',
  'D': 'bg-orange-500/10 border-orange-500/30',
  'F': 'bg-red-500/10 border-red-500/30',
  '—': 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
};

const STATUS_DOT = {
  good: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  neutral: 'bg-slate-600',
};

function ScoreRing({ score, grade, size = 120 }: { score: number; grade: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gradeColor = grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" className="dark:stroke-slate-700" strokeWidth="8" />
        {/* Score ring */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", tokens.text.heading)}>{Math.round(score)}</span>
        <span className={cn("text-xs", tokens.text.muted)}>/ 100</span>
      </div>
    </div>
  );
}

function ComponentBar({ component }: { component: ScoreComponent }) {
  return (
    <div className={`border rounded-lg p-3 ${component.available ? GRADE_BG[component.grade] : GRADE_BG['—']}`} title={component.description}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-sm font-medium flex items-center gap-1", tokens.text.heading)}>
          {component.category}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 text-[9px] font-bold text-gray-500 dark:text-slate-400 cursor-help" title={component.description}>?</span>
        </span>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", tokens.text.muted)}>{Math.round(component.weight * 100)}%</span>
          <span className={`text-sm font-bold ${GRADE_COLORS[component.grade]}`}>
            {component.available ? component.grade : '?'}
          </span>
        </div>
      </div>

      {/* Score bar */}
      {component.available && component.score !== null ? (
        <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${component.score}%`,
              backgroundColor: component.grade === 'A' ? '#10b981' : component.grade === 'B' ? '#3b82f6' : component.grade === 'C' ? '#f59e0b' : component.grade === 'D' ? '#f97316' : '#ef4444',
            }}
          />
        </div>
      ) : (
        <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full mb-2">
          <div className="h-full w-0 rounded-full bg-gray-300 dark:bg-slate-700" />
        </div>
      )}

      {/* Factors */}
      <div className="space-y-1">
        {component.factors.map((f, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status]}`} />
              <span className={cn("text-xs", tokens.text.muted)}>{f.label}</span>
            </div>
            <span className={cn("text-xs tabular-nums", tokens.text.body)}>{f.value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export function PulseScoreCard({ score, entityName }: PulseScoreCardProps) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={cn("text-sm font-semibold uppercase tracking-wider", tokens.text.heading)}>Pulse Score</h3>
          <p className={cn("text-xs mt-1", tokens.text.muted)}>
            Composite health index — {score.dataCompleteness}% data available
          </p>
        </div>
        <ScoreRing score={score.overall} grade={score.overallGrade} />
      </div>

      {/* Data completeness bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-xs", tokens.text.muted)}>Data Completeness</span>
          <span className={cn("text-xs", tokens.text.muted)}>{score.dataCompleteness}%</span>
        </div>
        <div className={cn("w-full h-2 rounded-full", tokens.bg.cardAlt)}>
          <div
            className={cn("h-full rounded-full transition-all duration-700", tokens.bg.accent)}
            style={{ width: `${score.dataCompleteness}%` }}
          />
        </div>
        {score.dataCompleteness < 100 && (
          <p className={cn("text-xs mt-1", tokens.text.muted)}>
            Missing: {score.missingData.slice(0, 3).join(', ')}
          </p>
        )}
      </div>

      {/* Components grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {score.components.map((comp) => (
          <ComponentBar key={comp.category} component={comp} />
        ))}
      </div>
    </Card>
  );
}
