'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react'

interface DataPoint {
  year: number;
  membership: number;
  population: number;
  membershipPct: number;
}

interface GrowthVsPopulationProps {
  entityName: string;
  data: DataPoint[];
  membershipLabel?: string;
  populationLabel?: string;
}

export const MOCK_SPD_GROWTH: DataPoint[] = [
  { year: 1900, membership: 1800, population: 3800000, membershipPct: 0.047 },
  { year: 1910, membership: 3100, population: 4400000, membershipPct: 0.070 },
  { year: 1920, membership: 4200, population: 5400000, membershipPct: 0.078 },
  { year: 1925, membership: 5200, population: 5900000, membershipPct: 0.088 },
  { year: 1930, membership: 6100, population: 6500000, membershipPct: 0.094 },
  { year: 1940, membership: 7800, population: 7000000, membershipPct: 0.111 },
  { year: 1950, membership: 12500, population: 8300000, membershipPct: 0.151 },
  { year: 1960, membership: 20000, population: 10300000, membershipPct: 0.194 },
  { year: 1965, membership: 25000, population: 11400000, membershipPct: 0.219 },
  { year: 1970, membership: 30000, population: 12500000, membershipPct: 0.240 },
  { year: 1975, membership: 35000, population: 13600000, membershipPct: 0.257 },
  { year: 1980, membership: 40000, population: 14700000, membershipPct: 0.272 },
  { year: 1985, membership: 44000, population: 15800000, membershipPct: 0.278 },
  { year: 1990, membership: 48000, population: 17000000, membershipPct: 0.282 },
  { year: 1995, membership: 51000, population: 18100000, membershipPct: 0.282 },
  { year: 2000, membership: 53000, population: 19200000, membershipPct: 0.276 },
  { year: 2005, membership: 55500, population: 20400000, membershipPct: 0.272 },
  { year: 2010, membership: 58000, population: 22000000, membershipPct: 0.264 },
  { year: 2015, membership: 60500, population: 23800000, membershipPct: 0.254 },
  { year: 2020, membership: 62000, population: 25400000, membershipPct: 0.244 },
  { year: 2021, membership: 63000, population: 25700000, membershipPct: 0.245 },
  { year: 2023, membership: 63500, population: 26500000, membershipPct: 0.240 },
];

const TIME_RANGES = [
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: '20Y', years: 20 },
  { label: '50Y', years: 50 },
  { label: '100Y', years: 100 },
  { label: 'ALL', years: 0 },
];

export function GrowthVsPopulation({
  entityName,
  data,
  membershipLabel = 'Adventist Membership',
  populationLabel = 'Population',
}: GrowthVsPopulationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeRange, setActiveRange] = useState('ALL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [customRange, setCustomRange] = useState<[number, number] | null>(null);

  // Detect if population data exists
  const hasPopulation = data.some(d => d.population > 0);

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (customRange) {
      return data.filter(d => d.year >= customRange[0] && d.year <= customRange[1]);
    }
    const range = TIME_RANGES.find(r => r.label === activeRange);
    if (!range || range.years === 0) return data;
    const maxYear = data[data.length - 1].year;
    const minYear = maxYear - range.years;
    return data.filter(d => d.year >= minYear);
  }, [data, activeRange, customRange]);

  if (filteredData.length < 2) return null;

  const first = filteredData[0];
  const last = filteredData[filteredData.length - 1];

  // Population-dependent stats (only compute when population data exists)
  const peak = hasPopulation
    ? filteredData.reduce((max, d) => d.membershipPct > max.membershipPct ? d : max, filteredData[0])
    : null;
  const fromPeak = peak ? ((last.membershipPct - peak.membershipPct) / peak.membershipPct * 100).toFixed(1) : null;
  const isDecline = peak ? last.membershipPct < peak.membershipPct : false;
  const netPctChange = hasPopulation ? (last.membershipPct - first.membershipPct).toFixed(3) : null;

  // Membership-only stats
  const memGrowthTotal = ((last.membership - first.membership) / first.membership * 100).toFixed(1);

  // Chart constants
  const W = 800;
  const H = 300;
  const PAD = { top: 20, right: hasPopulation ? 60 : 20, bottom: 30, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const years = filteredData.map(d => d.year);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const yearRange = maxYear - minYear || 1;

  const maxMem = Math.max(...filteredData.map(d => d.membership)) * 1.1;
  const minMem = Math.min(...filteredData.map(d => d.membership)) * 0.9;

  const maxPop = hasPopulation ? Math.max(...filteredData.map(d => d.population)) * 1.1 : 0;
  const minPop = hasPopulation ? Math.min(...filteredData.map(d => d.population)) * 0.9 : 0;
  const maxPct = hasPopulation ? Math.max(...filteredData.map(d => d.membershipPct)) * 1.15 : 0;
  const minPct = hasPopulation ? Math.min(...filteredData.map(d => d.membershipPct)) * 0.85 : 0;

  const xScale = (year: number) => PAD.left + ((year - minYear) / yearRange) * plotW;
  const memRange = maxMem - minMem || 1;
  const popRange = maxPop - minPop || 1;
  const pctRange = maxPct - minPct || 0.001;
  const yMem = (v: number) => PAD.top + plotH - ((v - minMem) / memRange) * plotH;
  const yPop = (v: number) => PAD.top + plotH - ((v - minPop) / popRange) * plotH;
  const yPct = (v: number) => PAD.top + plotH - ((v - minPct) / pctRange) * plotH;

  const makePath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const memPoints = filteredData.map(d => ({ x: xScale(d.year), y: yMem(d.membership) }));
  const popPoints = hasPopulation ? filteredData.map(d => ({ x: xScale(d.year), y: yPop(d.population) })) : [];
  const pctPoints = hasPopulation ? filteredData.map(d => ({ x: xScale(d.year), y: yPct(d.membershipPct) })) : [];

  const pctArea = hasPopulation
    ? makePath(pctPoints) +
      ` L${pctPoints[pctPoints.length - 1].x},${PAD.top + plotH}` +
      ` L${pctPoints[0].x},${PAD.top + plotH} Z`
    : '';

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  // Find nearest data point to mouse X
  const getNearestIdx = useCallback((clientX: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let minDist = Infinity;
    filteredData.forEach((d, i) => {
      const dist = Math.abs(xScale(d.year) - mouseX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    return nearest;
  }, [filteredData, W]);

  const getYearFromX = useCallback((clientX: number) => {
    if (!svgRef.current) return minYear;
    const rect = svgRef.current.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    return Math.round(minYear + pct * yearRange);
  }, [minYear, yearRange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const idx = getNearestIdx(e.clientX);
    setHoveredIdx(idx);
    if (dragStart !== null) {
      setDragEnd(getYearFromX(e.clientX));
    }
  }, [getNearestIdx, dragStart, getYearFromX]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragStart(getYearFromX(e.clientX));
    setDragEnd(null);
  }, [getYearFromX]);

  const handleMouseUp = useCallback(() => {
    if (dragStart !== null && dragEnd !== null && Math.abs(dragEnd - dragStart) > 2) {
      const lo = Math.min(dragStart, dragEnd);
      const hi = Math.max(dragStart, dragEnd);
      const pointsInRange = data.filter(d => d.year >= lo && d.year <= hi);
      if (pointsInRange.length >= 2) {
        setCustomRange([lo, hi]);
        setActiveRange('');
      }
    }
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, data]);

  const handleRangeClick = (label: string) => {
    setActiveRange(label);
    setCustomRange(null);
  };

  const resetZoom = () => {
    setActiveRange('ALL');
    setCustomRange(null);
  };

  // Y-axis ticks
  const memTicks = Array.from({ length: 4 }, (_, i) => minMem + (i / 3) * (maxMem - minMem));
  const pctTicks = hasPopulation ? Array.from({ length: 4 }, (_, i) => minPct + (i / 3) * (maxPct - minPct)) : [];

  // X-axis ticks (smart spacing)
  const xTicks = useMemo(() => {
    const span = maxYear - minYear;
    let step = 5;
    if (span > 80) step = 20;
    else if (span > 40) step = 10;
    else if (span > 15) step = 5;
    else if (span > 5) step = 2;
    else step = 1;
    const ticks: number[] = [];
    const start = Math.ceil(minYear / step) * step;
    for (let y = start; y <= maxYear; y += step) ticks.push(y);
    return ticks;
  }, [minYear, maxYear]);

  // Drag selection bounds
  const dragX1 = dragStart !== null ? xScale(Math.max(dragStart, minYear)) : 0;
  const dragX2 = dragEnd !== null ? xScale(Math.min(Math.max(dragEnd, minYear), maxYear)) : 0;

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {hasPopulation ? 'Growth vs Population' : 'Membership Growth'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {entityName} — {hasPopulation
              ? 'Is Adventism keeping pace with population growth?'
              : 'Membership growth over time'}
          </p>
        </div>
        {hasPopulation && peak && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            isDecline
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          }`}>
            <span className="flex items-center">{isDecline ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}</span>
            <div>
              <div>{isDecline ? `${fromPeak}% from peak (${peak.year})` : `+${netPctChange}% since ${first.year}`}</div>
              <div className="text-xs font-normal opacity-75">{last.membershipPct.toFixed(3)}% of population ({last.year})</div>
            </div>
          </div>
        )}
        {!hasPopulation && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            Number(memGrowthTotal) >= 0
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            <span className="flex items-center">{Number(memGrowthTotal) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}</span>
            <div>
              <div>{Number(memGrowthTotal) >= 0 ? '+' : ''}{memGrowthTotal}% since {first.year}</div>
              <div className="text-xs font-normal opacity-75">{formatNum(last.membership)} members ({last.year})</div>
            </div>
          </div>
        )}
      </div>

      {/* Time range buttons */}
      <div className="flex items-center gap-1 mb-4">
        {TIME_RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => handleRangeClick(r.label)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeRange === r.label && !customRange
                ? 'bg-[#6366F1] text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {r.label}
          </button>
        ))}
        {customRange && (
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#6366F1] text-white ml-2"
          >
            {customRange[0]}–{customRange[1]} ✕
          </button>
        )}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">Click & drag to zoom</span>
      </div>

      {/* Chart */}
      <div className="relative select-none" style={{ cursor: 'crosshair' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 'auto', maxHeight: '350px' }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredIdx(null); setDragStart(null); setDragEnd(null); }}
        >
          {/* Grid lines */}
          {memTicks.map((v, i) => (
            <line key={`g${i}`} x1={PAD.left} y1={yMem(v)} x2={W - PAD.right} y2={yMem(v)}
              stroke="currentColor" className="text-gray-100 dark:text-gray-700/50" strokeWidth="0.5" />
          ))}

          {/* Pct area fill (only with population) */}
          {hasPopulation && (
            <>
              <defs>
                <linearGradient id="pctGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={pctArea} fill="url(#pctGrad)" />
            </>
          )}

          {/* Membership area fill (only without population) */}
          {!hasPopulation && (
            <>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d={makePath(memPoints) +
                  ` L${memPoints[memPoints.length - 1].x},${PAD.top + plotH}` +
                  ` L${memPoints[0].x},${PAD.top + plotH} Z`}
                fill="url(#memGrad)"
              />
            </>
          )}

          {/* Lines */}
          {hasPopulation && <path d={makePath(popPoints)} fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />}
          <path d={makePath(memPoints)} fill="none" stroke="#6366F1" strokeWidth="2.5" />
          {hasPopulation && <path d={makePath(pctPoints)} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" />}

          {/* Data points */}
          {filteredData.map((d, i) => (
            <g key={d.year}>
              <circle cx={xScale(d.year)} cy={yMem(d.membership)} r="3" fill="#6366F1"
                opacity={hoveredIdx === i ? 1 : 0.7} />
              {hasPopulation && (
                <>
                  <circle cx={xScale(d.year)} cy={yPop(d.population)} r="2.5" fill="#ef4444"
                    opacity={hoveredIdx === i ? 1 : 0.5} />
                  <circle cx={xScale(d.year)} cy={yPct(d.membershipPct)} r="3" fill="#22c55e"
                    opacity={hoveredIdx === i ? 1 : 0.7} />
                </>
              )}
            </g>
          ))}

          {/* Hover crosshair */}
          {hoveredIdx !== null && (
            <line
              x1={xScale(filteredData[hoveredIdx].year)} y1={PAD.top}
              x2={xScale(filteredData[hoveredIdx].year)} y2={PAD.top + plotH}
              stroke="currentColor" className="text-gray-300 dark:text-gray-600"
              strokeWidth="1" strokeDasharray="4 3"
            />
          )}

          {/* Drag selection overlay */}
          {dragStart !== null && dragEnd !== null && (
            <rect
              x={Math.min(dragX1, dragX2)} y={PAD.top}
              width={Math.abs(dragX2 - dragX1)} height={plotH}
              fill="#6366F1" opacity="0.1"
              stroke="#6366F1" strokeWidth="1" strokeDasharray="4 2"
            />
          )}

          {/* Left Y-axis: Membership */}
          {memTicks.map((v, i) => (
            <text key={`yl${i}`} x={PAD.left - 6} y={yMem(v) + 3}
              textAnchor="end" className="fill-[#6366F1]" fontSize="10">{formatNum(v)}</text>
          ))}

          {/* Right Y-axis: % of Population (only with population) */}
          {hasPopulation && pctTicks.map((v, i) => (
            <text key={`yr${i}`} x={W - PAD.right + 6} y={yPct(v) + 3}
              textAnchor="start" className="fill-green-500" fontSize="10">{v.toFixed(3)}%</text>
          ))}

          {/* X-axis */}
          {xTicks.map(y => (
            <text key={y} x={xScale(y)} y={H - 5}
              textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize="10">{y}</text>
          ))}

          {/* Axis labels */}
          <text x={12} y={PAD.top + plotH / 2} textAnchor="middle"
            className="fill-[#6366F1]" fontSize="9" transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}>
            Membership
          </text>
          {hasPopulation && (
            <text x={W - 8} y={PAD.top + plotH / 2} textAnchor="middle"
              className="fill-green-500" fontSize="9" transform={`rotate(90, ${W - 8}, ${PAD.top + plotH / 2})`}>
              % of Pop.
            </text>
          )}
        </svg>

        {/* Hover tooltip */}
        {hoveredIdx !== null && (() => {
          const d = filteredData[hoveredIdx];
          const xPct = ((xScale(d.year) - PAD.left) / plotW) * 100;
          const flipLeft = xPct > 70;
          return (
            <div
              className="absolute bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-[#2a3a50] rounded-lg shadow-xl p-3 text-xs z-20 pointer-events-none"
              style={{
                left: flipLeft ? undefined : `${xPct + 2}%`,
                right: flipLeft ? `${100 - xPct + 2}%` : undefined,
                top: '20px',
                minWidth: '180px',
              }}
            >
              <div className="font-bold text-sm text-gray-900 dark:text-white mb-2">{d.year}</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                    <span className="text-gray-500 dark:text-gray-400">{membershipLabel}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{formatNum(d.membership)}</span>
                </div>
                {hasPopulation && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-gray-500 dark:text-gray-400">{populationLabel}</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{formatNum(d.population)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-gray-500 dark:text-gray-400">% of Population</span>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">{d.membershipPct.toFixed(3)}%</span>
                    </div>
                  </>
                )}
              </div>
              {hoveredIdx > 0 && (() => {
                const prev = filteredData[hoveredIdx - 1];
                const memDelta = ((d.membership - prev.membership) / prev.membership * 100).toFixed(1);
                if (hasPopulation) {
                  const popDelta = ((d.population - prev.population) / prev.population * 100).toFixed(1);
                  return (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">
                      Since {prev.year}: Mem {Number(memDelta) >= 0 ? '+' : ''}{memDelta}% • Pop +{popDelta}%
                    </div>
                  );
                }
                return (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">
                    Since {prev.year}: {Number(memDelta) >= 0 ? '+' : ''}{memDelta}%
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#6366F1] rounded" />
          {membershipLabel}
        </div>
        {hasPopulation && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500 rounded" />
              {populationLabel}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-b-2 border-dashed border-green-500" />
              % of Population
            </div>
          </>
        )}
      </div>

      {/* Period breakdown */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#2a3a50]">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Period Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filteredData.filter((_, i) => i > 0 && (filteredData.length <= 8 || i % Math.ceil(filteredData.length / 6) === 0 || i === filteredData.length - 1)).map((d, idx) => {
            const origIdx = filteredData.indexOf(d);
            const prev = filteredData[origIdx - 1] || filteredData[0];
            const memGrowth = ((d.membership - prev.membership) / prev.membership * 100).toFixed(1);
            const memGaining = Number(memGrowth) >= 0;

            if (hasPopulation) {
              const pctDelta = (d.membershipPct - prev.membershipPct).toFixed(3);
              const gaining = d.membershipPct >= prev.membershipPct;
              const popGrowth = ((d.population - prev.population) / prev.population * 100).toFixed(1);
              return (
                <div key={`${d.year}-${idx}`} className="bg-gray-50 dark:bg-[#162030] rounded-lg p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">{prev.year}–{d.year}</div>
                  <div className={`text-sm font-bold ${gaining ? 'text-green-600' : 'text-red-500'}`}>
                    {gaining ? '↑' : '↓'} {pctDelta}%
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Mem {Number(memGrowth) >= 0 ? '+' : ''}{memGrowth}% • Pop +{popGrowth}%
                  </div>
                </div>
              );
            }

            return (
              <div key={`${d.year}-${idx}`} className="bg-gray-50 dark:bg-[#162030] rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 mb-0.5">{prev.year}–{d.year}</div>
                <div className={`text-sm font-bold ${memGaining ? 'text-green-600' : 'text-red-500'}`}>
                  {memGaining ? '↑' : '↓'} {memGaining ? '+' : ''}{memGrowth}%
                </div>
                <div className="text-[10px] text-gray-400">
                  {formatNum(prev.membership)} → {formatNum(d.membership)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
