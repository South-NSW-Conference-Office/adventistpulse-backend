'use client';

import type { YearlyStats } from '@/types/pulse';

interface RetentionChartProps {
  stats: YearlyStats[];
  height?: number;
}

/**
 * Retention curve — shows what % of members are retained each year.
 * A healthy entity hovers near 100%. A declining one shows a drooping curve.
 */
export function RetentionChart({ stats, height = 200 }: RetentionChartProps) {
  const data = stats
    .filter(s => s.membership.beginning !== null && (s.membership.dropped !== null || s.membership.deaths !== null))
    .map(s => {
      const beginning = s.membership.beginning ?? 0;
      const losses = Math.abs(s.membership.totalLosses ?? 0);
      const retention = beginning > 0 ? ((beginning - losses) / beginning) * 100 : null;
      return { year: s.year, retention };
    })
    .filter(d => d.retention !== null) as { year: number; retention: number }[];

  if (data.length < 2) {
    return (
      <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-8 text-center text-gray-400 dark:text-slate-500">
        Not enough retention data
      </div>
    );
  }

  // Take last 20 years
  const recent = data.slice(-20);

  const minVal = Math.min(...recent.map(d => d.retention));
  const maxVal = 100;
  // Floor at 80% to show detail
  const chartMin = Math.min(minVal - 2, 80);
  const range = maxVal - chartMin;

  const padding = { top: 20, right: 16, bottom: 40, left: 50 };
  const chartW = 800;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const pathPoints = recent.map((p, i) => {
    const x = padding.left + (i / (recent.length - 1)) * innerW;
    const y = padding.top + innerH - ((p.retention - chartMin) / range) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = pathPoints.join(' ');

  // 95% reference line
  const ref95Y = padding.top + innerH - ((95 - chartMin) / range) * innerH;

  // Y-axis ticks
  const yTicks = [chartMin, 85, 90, 95, 100]
    .filter(v => v >= chartMin && v <= 100)
    .map(val => ({
      val,
      y: padding.top + innerH - ((val - chartMin) / range) * innerH,
    }));

  const step = Math.max(1, Math.floor(recent.length / 6));

  return (
    <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padding.left} y1={t.y} x2={padding.left + innerW} y2={t.y} stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* 95% reference line */}
        <line x1={padding.left} y1={ref95Y} x2={padding.left + innerW} y2={ref95Y} stroke="#22c55e" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />
        <text x={padding.left + innerW + 4} y={ref95Y + 4} className="fill-emerald-500/50 text-[9px]">95%</text>

        {/* Area fill */}
        <path
          d={`${linePath} L${(padding.left + innerW).toFixed(1)},${(padding.top + innerH).toFixed(1)} L${padding.left},${(padding.top + innerH).toFixed(1)} Z`}
          fill="#f59e0b"
          opacity="0.08"
        />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={padding.left - 8} y={t.y + 4} textAnchor="end" className="fill-gray-400 dark:fill-slate-500 text-[11px]">
            {t.val}%
          </text>
        ))}

        {/* X-axis labels */}
        {recent.map((d, i) => {
          if (i % step !== 0 && i !== recent.length - 1) return null;
          const x = padding.left + (i / (recent.length - 1)) * innerW;
          return (
            <text key={d.year} x={x} y={chartH - 8} textAnchor="middle" className="fill-gray-400 dark:fill-slate-500 text-[11px]">
              {d.year}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
