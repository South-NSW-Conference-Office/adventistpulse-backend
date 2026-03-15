'use client';

import { useState, useRef, useCallback } from 'react';

interface DataPoint {
  year: number;
  [key: string]: number | null | undefined;
}

interface EntityData {
  code: string;
  name: string;
  data: DataPoint[];
}

interface MultiCompareChartProps {
  entities: EntityData[];
  dataKey: string;
  height?: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

function fmtVal(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toFixed(0);
}

export function MultiCompareChart({
  entities,
  dataKey,
  height = 300,
}: MultiCompareChartProps) {
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Collect all valid data points
  const allPoints = entities.flatMap(e =>
    e.data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined)
  );
  if (allPoints.length === 0) {
    return <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-8 text-center text-gray-400 dark:text-slate-500">No data</div>;
  }

  const allYears = [...new Set(allPoints.map(p => p.year))].sort((a, b) => a - b);
  let minYear = allYears[0];
  let maxYear = allYears[allYears.length - 1];

  // Apply zoom
  if (zoomRange) {
    minYear = zoomRange.start;
    maxYear = zoomRange.end;
  }

  const yearRange = maxYear - minYear || 1;

  const allValues = allPoints
    .filter(p => p.year >= minYear && p.year <= maxYear)
    .map(p => p[dataKey] as number);
  if (allValues.length === 0) {
    return <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-8 text-center text-gray-400 dark:text-slate-500">No data in range</div>;
  }
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const padding = { top: 20, right: 16, bottom: 60, left: 60 };
  const chartW = 800;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  function yearToX(year: number): number {
    return padding.left + ((year - minYear) / yearRange) * innerW;
  }

  function valToY(val: number): number {
    return padding.top + innerH - ((val - minVal) / range) * innerH;
  }

  function xToYear(x: number): number {
    const frac = (x - padding.left) / innerW;
    return Math.round(minYear + frac * yearRange);
  }

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (range * i) / 4;
    return { val, y: valToY(val) };
  });

  // X-axis ticks
  const yearStep = Math.max(1, Math.floor(yearRange / 8));
  const xTicks: number[] = [];
  for (let y = minYear; y <= maxYear; y += yearStep) xTicks.push(y);
  if (xTicks[xTicks.length - 1] !== maxYear) xTicks.push(maxYear);

  // Mouse handlers for drag-to-zoom
  const getSvgX = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * chartW;
    return svgX;
  }, [chartW]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const x = getSvgX(e);
    if (x >= padding.left && x <= padding.left + innerW) {
      setIsDragging(true);
      setDragStart(x);
      setDragCurrent(x);
    }
  }, [getSvgX, innerW]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setDragCurrent(getSvgX(e));
    }
  }, [isDragging, getSvgX]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragCurrent !== null) {
      const startYear = xToYear(Math.min(dragStart, dragCurrent));
      const endYear = xToYear(Math.max(dragStart, dragCurrent));
      if (endYear - startYear >= 2) {
        setZoomRange({ start: startYear, end: endYear });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  }, [isDragging, dragStart, dragCurrent]);

  // Selection rectangle
  const selectionRect = isDragging && dragStart !== null && dragCurrent !== null ? {
    x: Math.min(dragStart, dragCurrent),
    width: Math.abs(dragCurrent - dragStart),
  } : null;

  return (
    <div className="bg-white dark:bg-[#1f2b3d] rounded-lg border border-gray-200 dark:border-[#2a3a50] p-4 overflow-x-auto">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-3">
          {entities.map((e, i) => (
            <div key={e.code} className="flex items-center gap-1.5">
              <div className="w-3 h-1 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-gray-400 dark:text-slate-400">{e.name}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {zoomRange && (
            <button
              onClick={() => setZoomRange(null)}
              className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors"
            >
              Reset Zoom
            </button>
          )}
          {!zoomRange && (
            <>
              <button
                onClick={() => setZoomRange({ start: maxYear - 10, end: maxYear })}
                className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors"
              >
                10Y
              </button>
              <button
                onClick={() => setZoomRange({ start: maxYear - 20, end: maxYear })}
                className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors"
              >
                20Y
              </button>
              <button
                onClick={() => setZoomRange({ start: maxYear - 50, end: maxYear })}
                className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-300 px-2 py-1 rounded transition-colors"
              >
                50Y
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-600 mb-2">Drag to zoom into a range</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full h-auto cursor-crosshair"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padding.left} y1={t.y} x2={padding.left + innerW} y2={t.y} stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* Selection rectangle */}
        {selectionRect && (
          <rect
            x={selectionRect.x}
            y={padding.top}
            width={selectionRect.width}
            height={innerH}
            fill="#3b82f6"
            opacity="0.15"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Lines for each entity */}
        {entities.map((entity, ei) => {
          const points = entity.data
            .filter(d => d[dataKey] !== null && d[dataKey] !== undefined && d.year >= minYear && d.year <= maxYear)
            .sort((a, b) => a.year - b.year);

          if (points.length < 2) return null;

          const path = points
            .map((p, i) => {
              const x = yearToX(p.year);
              const y = valToY(p[dataKey] as number);
              return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          const color = COLORS[ei % COLORS.length];

          return (
            <g key={entity.code}>
              <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* End point label */}
              {points.length > 0 && (() => {
                const last = points[points.length - 1];
                const x = yearToX(last.year);
                const y = valToY(last[dataKey] as number);
                return (
                  <text x={x + 6} y={y + 4} className="text-[10px]" fill={color}>
                    {fmtVal(last[dataKey] as number)}
                  </text>
                );
              })()}
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
        {xTicks.map(year => (
          <text key={year} x={yearToX(year)} y={chartH - 20} textAnchor="middle" className="fill-gray-400 dark:fill-slate-500 text-[11px]">
            {year}
          </text>
        ))}

        {/* Zoom range indicator */}
        {zoomRange && (
          <text x={chartW / 2} y={chartH - 4} textAnchor="middle" className="fill-slate-600 text-[10px]">
            {zoomRange.start}–{zoomRange.end}
          </text>
        )}
      </svg>
    </div>
  );
}
