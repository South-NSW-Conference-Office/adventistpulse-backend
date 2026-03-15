import { BarChart3, TrendingUp, Scale, AlertTriangle, Lightbulb, Pin, type LucideIcon } from 'lucide-react';
import { tokens, cn } from '@/lib/theme';
import { Card } from '@/components/ui';

interface Insight {
  type: string;
  title: string;
  body: string;
  confidence: string;
  source?: string;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  context: BarChart3,
  trend: TrendingUp,
  comparison: Scale,
  challenge: AlertTriangle,
  opportunity: Lightbulb,
};

const CONFIDENCE_BADGE: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verified', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  estimated: { label: 'Estimated', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  projected: { label: 'Projected', color: 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/30' },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card className="overflow-hidden p-0">
      <div className={cn("px-5 py-3 border-b", tokens.border.default)}>
        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", tokens.text.heading)}>Intelligence Insights</h3>
        <p className={cn("text-xs mt-0.5", tokens.text.muted)}>Research-backed context for this entity</p>
      </div>
      <div className={cn("max-h-[400px] overflow-y-auto divide-y", tokens.border.default + '/50')}>
        {insights.map((insight, i) => {
          const badge = CONFIDENCE_BADGE[insight.confidence] || CONFIDENCE_BADGE.estimated;
          return (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start gap-3">
                {(() => { const Icon = TYPE_ICONS[insight.type] || Pin; return <Icon className="w-4 h-4 mt-0.5 shrink-0" /> })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn("text-sm font-medium", tokens.text.heading)}>{insight.title}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className={cn("text-xs leading-relaxed", tokens.text.muted)}>{insight.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {insights.length > 3 && (
        <div className={cn("text-center py-2 border-t text-xs", tokens.border.default, tokens.text.muted)}>
          ↕ {insights.length} insights
        </div>
      )}
    </Card>
  );
}
