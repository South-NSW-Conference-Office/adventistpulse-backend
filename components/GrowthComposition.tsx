'use client';

import { useState } from 'react';
import type { YearlyStats } from '@/types/pulse';

interface GrowthCompositionProps {
  stats: YearlyStats[];
  height?: number;
}

/**
 * Growth Composition — stacked bar showing WHERE growth comes from:
 * - Kingdom Growth (baptisms + POF) = green
 * - Transfer Balance (in - out) = blue (positive) or orange (negative)  
 * - Losses (deaths + dropped + missing) = red
 * 
 * This tells the migration story: is this entity growing from conversions
 * or just receiving transfers from other territories?
 */
export function GrowthComposition({ stats, height = 280 }: GrowthCompositionProps) {
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

  const data = stats
    .filter(s => s.membership.baptisms !== null || s.membership.totalGains !== null)
    .map(s => {
      const m = s.membership;
      const kingdom = (m.baptisms ?? 0) + (m.professionOfFaith ?? 0);
      const transferIn = m.transfersIn ?? 0;
      const transferOut = Math.abs(m.transfersOut ?? 0);
      const transferBalance = transferIn - transferOut;
      const deaths = Math.abs(m.deaths ?? 0);
      const dropped = Math.abs(m.dropped ?? 0);
      const missing = Math.abs(m.missing ?? 0);
      const losses = deaths + dropped + missing;
      return { year: s.year, kingdom, transferBalance, losses };
    });

  if (data.length < 3) return null;

  // Apply zoom
  let filtered = data;
  if (zoomRange) {
    filtered = data.filter(d => d.year >= zoomRange.start && d.year <= zoomRange.end);
  }
  if (filtered.length < 2) filtered = data;

  const minYear = filtered[0].year;
  const maxYear = filtered[filtered.length - 1].year;

  // Find max absolute value for scaling
  const maxVal = Math.max(
    ...filtered.map(d => Math.max(
      d.kingdom + Math.max(0, d.transferBalance),
      d.losses + Math.abs(Math.min(0, d.transferBalance))
    ))
  );

  const padding = { top: 20, right: 16, bottom: 50, left: 50 };
  const chartW = 800;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;
  const midY = padding.top + innerH / 2;
  const halfH = innerH / 2;

  const barWidth = Math.max(2, Math.min(20, (innerW / filtered.length) * 0.7));
  const barGap = (innerW - barWidth * filtered.length) / (filtered.length + 1);

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 overflow-x-auto">
      {/* Legend + controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-emerald-500" />
            <span className="text-xs text-gray-400 dark:text-slate-400">Kingdom Growth (Baptisms + POF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-[#14b8a6]" />
            <span className="text-xs text-gray-400 dark:text-slate-400">Transfer Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-red-500/70" />
            <span className="text-xs text-gray-400 dark:text-slate-400">Losses</span>
          </div>
        </div>
        <div className="flex gap-2">
          {zoomRange ? (
            <button onClick={() => setZoomRange(null)} className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors">
              All Years
            </button>
          ) : (
            <>
              <button onClick={() => setZoomRange({ start: maxYear - 10, end: maxYear })} className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors">10Y</button>
              <button onClick={() => setZoomRange({ start: maxYear - 20, end: maxYear })} className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors">20Y</button>
            </>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Zero line */}
        <line x1={padding.left} y1={midY} x2={padding.left + innerW} y2={midY} stroke="#475569" strokeWidth="1" />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => (
          <g key={frac}>
            <line x1={padding.left} y1={midY - halfH * frac} x2={padding.left + innerW} y2={midY - halfH * frac} stroke="#1e293b" strokeWidth="1" />
            <line x1={padding.left} y1={midY + halfH * frac} x2={padding.left + innerW} y2={midY + halfH * frac} stroke="#1e293b" strokeWidth="1" />
          </g>
        ))}

        {/* Labels */}
        <text x={padding.left - 8} y={midY - halfH * 0.5 + 4} textAnchor="end" className="fill-gray-400 dark:fill-slate-500 text-[10px]">
          +{Math.round(maxVal * 0.5)}
        </text>
        <text x={padding.left - 8} y={midY + 4} textAnchor="end" className="fill-gray-400 dark:fill-slate-500 text-[10px]">0</text>
        <text x={padding.left - 8} y={midY + halfH * 0.5 + 4} textAnchor="end" className="fill-gray-400 dark:fill-slate-500 text-[10px]">
          -{Math.round(maxVal * 0.5)}
        </text>

        {/* Bars */}
        {filtered.map((d, i) => {
          const x = padding.left + barGap + i * (barWidth + barGap);

          // Positive side: kingdom + positive transfers
          const kingdomH = maxVal > 0 ? (d.kingdom / maxVal) * halfH : 0;
          const posTransferH = d.transferBalance > 0 && maxVal > 0 ? (d.transferBalance / maxVal) * halfH : 0;

          // Negative side: losses + negative transfers
          const lossH = maxVal > 0 ? (d.losses / maxVal) * halfH : 0;
          const negTransferH = d.transferBalance < 0 && maxVal > 0 ? (Math.abs(d.transferBalance) / maxVal) * halfH : 0;

          // X-axis labels
          const showLabel = filtered.length <= 20 || i % Math.max(1, Math.floor(filtered.length / 10)) === 0 || i === filtered.length - 1;

          return (
            <g key={d.year}>
              {/* Kingdom growth (green, going up) */}
              <rect x={x} y={midY - kingdomH - posTransferH} width={barWidth} height={kingdomH} fill="#10b981" rx="1" />
              
              {/* Positive transfers (blue, stacked above kingdom) */}
              {posTransferH > 0 && (
                <rect x={x} y={midY - posTransferH} width={barWidth} height={posTransferH} fill="#3b82f6" rx="1" />
              )}

              {/* Wait — transfers go on top of kingdom. Let me re-stack: kingdom is from zero up, transfers stack on top */}
              {/* Actually: kingdom from midY going up, then transfers on top of that */}
              
              {/* Losses (red, going down) */}
              <rect x={x} y={midY} width={barWidth} height={lossH} fill="#ef4444" opacity="0.7" rx="1" />
              
              {/* Negative transfers (orange, stacked below losses) */}
              {negTransferH > 0 && (
                <rect x={x} y={midY + lossH} width={barWidth} height={negTransferH} fill="#f97316" opacity="0.7" rx="1" />
              )}

              {/* Year label */}
              {showLabel && (
                <text x={x + barWidth / 2} y={chartH - 10} textAnchor="middle" className="fill-gray-400 dark:fill-slate-500 text-[10px]">
                  {d.year}
                </text>
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={padding.left + 4} y={padding.top + 12} className="fill-emerald-400/50 text-[10px]">↑ Growth</text>
        <text x={padding.left + 4} y={chartH - padding.bottom + 30} className="fill-red-400/50 text-[10px]">↓ Losses</text>
      </svg>
    </div>
  );
}
