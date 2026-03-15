'use client';

import type { YearlyStats } from '@/types/pulse';

interface PipelineChartProps {
  stats: YearlyStats[];
  height?: number;
}

/**
 * Gains vs Losses stacked bar chart.
 * Green bars = gains (baptisms + POF + transfers in)
 * Red bars = losses (deaths + dropped + missing + transfers out)
 * Shows the membership pipeline — are we gaining or bleeding?
 */
export function PipelineChart({ stats, height = 220 }: PipelineChartProps) {
  // Filter to stats that have gain/loss data
  const data = stats
    .filter(s => s.membership.totalGains !== null || s.membership.totalLosses !== null)
    .map(s => ({
      year: s.year,
      gains: s.membership.totalGains ?? 0,
      losses: Math.abs(s.membership.totalLosses ?? 0), // losses stored as positive
      baptisms: s.membership.baptisms ?? 0,
      dropped: s.membership.dropped ?? 0,
      deaths: s.membership.deaths ?? 0,
      net: (s.membership.totalGains ?? 0) - Math.abs(s.membership.totalLosses ?? 0),
    }));

  if (data.length < 2) {
    return (
      <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-8 text-center text-gray-400 dark:text-slate-500">
        Not enough gain/loss data for pipeline chart
      </div>
    );
  }

  // Take last 20 years max for readability
  const recent = data.slice(-20);

  const maxVal = Math.max(
    ...recent.map(d => Math.max(d.gains, d.losses))
  );

  const padding = { top: 20, right: 16, bottom: 40, left: 60 };
  const chartW = 800;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;
  const barWidth = Math.min(24, (innerW / recent.length) * 0.35);
  const gapBetweenBars = 2;

  function fmtVal(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = (maxVal * i) / 4;
    const y = padding.top + innerH - (i / 4) * innerH;
    return { val, y };
  });

  // X-axis: show every Nth year
  const step = Math.max(1, Math.floor(recent.length / 8));

  return (
    <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padding.left} y1={t.y} x2={padding.left + innerW} y2={t.y} stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* Bars */}
        {recent.map((d, i) => {
          const cx = padding.left + ((i + 0.5) / recent.length) * innerW;
          const gainH = maxVal > 0 ? (d.gains / maxVal) * innerH : 0;
          const lossH = maxVal > 0 ? (d.losses / maxVal) * innerH : 0;

          return (
            <g key={d.year}>
              {/* Gain bar (green, left) */}
              <rect
                x={cx - barWidth - gapBetweenBars / 2}
                y={padding.top + innerH - gainH}
                width={barWidth}
                height={gainH}
                fill="#10b981"
                opacity="0.7"
                rx="2"
              />
              {/* Loss bar (red, right) */}
              <rect
                x={cx + gapBetweenBars / 2}
                y={padding.top + innerH - lossH}
                width={barWidth}
                height={lossH}
                fill="#ef4444"
                opacity="0.7"
                rx="2"
              />
            </g>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={padding.left - 8} y={t.y + 4} textAnchor="end" className="fill-gray-400 dark:fill-slate-500 text-[11px]">
            {fmtVal(t.val)}
          </text>
        ))}

        {/* X-axis labels */}
        {recent.map((d, i) => {
          if (i % step !== 0 && i !== recent.length - 1) return null;
          const x = padding.left + ((i + 0.5) / recent.length) * innerW;
          return (
            <text key={d.year} x={x} y={chartH - 8} textAnchor="middle" className="fill-gray-400 dark:fill-slate-500 text-[11px]">
              {d.year}
            </text>
          );
        })}

        {/* Legend */}
        <rect x={padding.left} y={chartH - 10} width={10} height={3} fill="#10b981" rx="1.5" />
        <text x={padding.left + 14} y={chartH - 6} className="fill-gray-400 dark:fill-slate-400 text-[10px]">Gains</text>
        <rect x={padding.left + 70} y={chartH - 10} width={10} height={3} fill="#ef4444" rx="1.5" />
        <text x={padding.left + 84} y={chartH - 6} className="fill-gray-400 dark:fill-slate-400 text-[10px]">Losses</text>
      </svg>
    </div>
  );
}
