import type { TitheFlow } from '@/lib/tithe-flow';

interface TitheFlowChartProps {
  flow: TitheFlow;
}

interface FlowSegment {
  label: string;
  pct: number;
  color: string;
  description: string;
}

export function TitheFlowChart({ flow }: TitheFlowChartProps) {
  const segments: FlowSegment[] = [
    { label: 'Conference', pct: flow.conference_retention_pct, color: '#10b981', description: 'Retained by local conference' },
    { label: 'Union', pct: flow.union_pct, color: '#3b82f6', description: 'Passed to union conference' },
    { label: 'Division', pct: flow.division_pct, color: '#8b5cf6', description: 'Passed to division' },
    { label: 'GC', pct: flow.gc_pct, color: '#f59e0b', description: 'Passed to General Conference' },
    { label: 'Retirement', pct: flow.retirement_pct, color: '#6b7280', description: 'Retirement fund' },
  ];

  if (flow.special_assistance_fund_pct > 0) {
    segments.push({ label: 'Special Fund', pct: flow.special_assistance_fund_pct, color: '#475569', description: 'Special assistance fund' });
  }

  // Normalize in case they don't sum to 100
  const total = segments.reduce((a, s) => a + s.pct, 0);

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 uppercase tracking-wider">Tithe Flow</h3>
          <p className="text-xs text-slate-500 mt-0.5">Where every tithe dollar goes in {flow.name}</p>
        </div>
      </div>

      {/* Stacked horizontal bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="relative group transition-all hover:opacity-90"
            style={{ width: `${(seg.pct / total) * 100}%`, backgroundColor: seg.color }}
          >
            {seg.pct >= 8 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/90">
                {seg.pct}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div>
              <span className="text-xs text-gray-900 dark:text-white font-medium">{seg.label}</span>
              <span className="text-xs text-slate-500 ml-1">{seg.pct}%</span>
              <p className="text-[10px] text-slate-600">{seg.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Special notes */}
      {flow.special_funds && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2a3a50]">
          <p className="text-xs text-slate-500">{flow.special_funds}</p>
        </div>
      )}
    </div>
  );
}
