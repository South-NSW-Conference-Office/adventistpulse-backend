'use client';

import { useState } from 'react';

interface DataPoint {
  year: number;
  [key: string]: number | null | undefined;
}

interface TrendChartProps {
  data: DataPoint[];
  dataKey: string;
  color?: string;
  height?: number;
}

interface TooltipData {
  year: number;
  value: number;
  x: number;
  y: number;
}

export function TrendChart({
  data,
  dataKey,
  color = '#3b82f6',
  height = 200,
}: TrendChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Filter to points that have a value
  const points = data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
  if (points.length < 2) {
    return (
      <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-8 text-center text-gray-400 dark:text-slate-500">
        Not enough data for chart
      </div>
    );
  }

  const values = points.map(p => p[dataKey] as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = { top: 20, right: 16, bottom: 40, left: 60 };
  const chartW = 800;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  // Build SVG path
  const pathPoints = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * innerW;
    const y = padding.top + innerH - ((values[i] - minVal) / range) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = pathPoints.join(' ');

  // Area fill path
  const areaPath =
    linePath +
    ` L${(padding.left + innerW).toFixed(1)},${(padding.top + innerH).toFixed(1)}` +
    ` L${padding.left},${(padding.top + innerH).toFixed(1)} Z`;

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (range * i) / 4;
    const y = padding.top + innerH - (i / 4) * innerH;
    return { val, y };
  });

  // X-axis labels (show ~6 years)
  const step = Math.max(1, Math.floor(points.length / 6));
  const xTicks = points.filter((_, i) => i % step === 0 || i === points.length - 1);

  function fmtVal(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  function fmtTooltipVal(n: number): string {
    return n.toLocaleString();
  }

  return (
    <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-4 overflow-x-auto relative">
      <svg 
        viewBox={`0 0 ${chartW} ${chartH}`} 
        className="w-full h-auto" 
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={t.y}
            x2={padding.left + innerW}
            y2={t.y}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity="0.1" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points (last point highlighted) */}
        {points.length <= 30 && points.map((p, i) => {
          const x = padding.left + (i / (points.length - 1)) * innerW;
          const y = padding.top + innerH - ((values[i] - minVal) / range) * innerH;
          const isLast = i === points.length - 1;
          const isHovered = tooltip?.year === p.year;
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isHovered ? 5 : isLast ? 4 : 2.5}
              fill={isHovered || isLast ? color : '#0f172a'}
              stroke={color}
              strokeWidth={isHovered ? 3 : isLast ? 2 : 1.5}
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({
                year: p.year,
                value: values[i],
                x,
                y: y - 10
              })}
            />
          );
        })}

        {/* Hover areas for better interaction */}
        {points.map((p, i) => {
          const x = padding.left + (i / (points.length - 1)) * innerW;
          const y = padding.top + innerH - ((values[i] - minVal) / range) * innerH;
          
          return (
            <circle
              key={`hover-${i}`}
              cx={x}
              cy={y}
              r={8}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({
                year: p.year,
                value: values[i],
                x,
                y: y - 10
              })}
            />
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={t.y + 4}
            textAnchor="end"
            className="fill-gray-400 dark:fill-slate-500 text-[11px]"
          >
            {fmtVal(t.val)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((p, i) => {
          const idx = points.indexOf(p);
          const x = padding.left + (idx / (points.length - 1)) * innerW;
          return (
            <text
              key={i}
              x={x}
              y={chartH - 8}
              textAnchor="middle"
              className="fill-gray-400 dark:fill-slate-500 text-[11px]"
            >
              {p.year}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute pointer-events-none z-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-white"
          style={{
            left: `${(tooltip.x / chartW) * 100}%`,
            top: `${(tooltip.y / chartH) * 100}%`,
            transform: tooltip.x > chartW / 2 ? 'translate(-100%, -100%)' : 'translate(0, -100%)'
          }}
        >
          <div className="font-medium">{tooltip.year}</div>
          <div className="text-gray-600 dark:text-slate-300 tabular-nums">{fmtTooltipVal(tooltip.value)}</div>
        </div>
      )}
    </div>
  );
}
