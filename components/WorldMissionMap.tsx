'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import type { EntityWithStats, QuickStats } from '@/types/pulse';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type ViewMode = 'where-we-are' | 'where-we-are-not';

interface CountryData {
  country: string;
  population: number;
  adventist_members: number;
  churches: number;
  division: string;
  ratio: number;
  presence: 'established' | 'limited' | 'minimal' | 'none';
}

interface MissionData {
  lastUpdated: string;
  countries: CountryData[];
}

function getColor(d: CountryData | undefined, mode: ViewMode): string {
  if (!d) return '#e5e7eb';
  if (mode === 'where-we-are') {
    if (d.presence === 'none' || d.ratio === 0) return '#d1d5db';
    if (d.presence === 'minimal' || d.presence === 'limited') return '#5eead4';
    if (d.ratio < 0.01) return '#2dd4bf';
    return '#4f46e5';
  } else {
    if (d.presence === 'none' || d.ratio === 0) return '#ef4444';
    if (d.presence === 'minimal') return '#fb923c';
    if (d.presence === 'limited') return '#fbbf24';
    return '#e5e7eb';
  }
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

interface Props {
  gcStats: QuickStats | null;
}

export default function WorldMissionMap({ gcStats }: Props) {
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('where-we-are');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; key: string } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Block scroll wheel zoom without blocking page scroll
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  useEffect(() => {
    fetch('/data/country-mission-data.json').then(r => r.json()).then(setMissionData);
  }, []);

  const dataMap = useMemo(() => {
    const m = new Map<string, CountryData>();
    missionData?.countries.forEach(c => m.set(c.country, c));
    return m;
  }, [missionData]);

  return (
    <div ref={mapContainerRef} className="relative w-full bg-gray-100 dark:bg-[#0f172a] overflow-hidden" style={{ height: 'calc(100vh - 56px)', userSelect: 'none' }}>
      <style>{`
        @keyframes tooltip-grow {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        .map-tooltip {
          animation: tooltip-grow 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: top left;
        }
      `}</style>

      {/* Toggle — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex bg-white/90 dark:bg-[#1a2332]/90 backdrop-blur border border-gray-200 dark:border-[#2a3a50] rounded-full p-1 shadow-md">
        {(['where-we-are', 'where-we-are-not'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === mode
                ? 'bg-[#6366F1] text-white shadow'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            {mode === 'where-we-are' ? '🌿 Where We Are' : '🔥 Where We Are Not'}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          key={tooltip.key}
          className="map-tooltip absolute z-20 text-xs rounded-xl px-4 py-3 shadow-xl pointer-events-none"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 14,
            background: 'rgba(26,35,50,0.97)',
            color: '#e2e8f0',
            border: '1px solid rgba(99,102,241,0.3)',
            backdropFilter: 'blur(8px)',
            lineHeight: '1.6',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Hero overlay — center left */}
      <div className="absolute top-[75%] -translate-y-1/2 left-0 z-10 px-6 md:px-10 flex flex-col items-start text-left" style={{ maxWidth: '520px', pointerEvents: 'none' }}>
        {/* Legend — inline, no container */}
        <div className="flex items-center gap-3 mb-3">
          {(viewMode === 'where-we-are'
            ? [['#4f46e5', 'Strong'], ['#2dd4bf', 'Medium'], ['#5eead4', 'Weak'], ['#d1d5db', 'None']]
            : [['#ef4444', 'None'], ['#fb923c', 'Minimal'], ['#fbbf24', 'Limited'], ['#e5e7eb', 'Reached']]
          ).map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-[11px] text-slate-300">{label}</span>
            </div>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
          Mission <span className="text-[#6366F1]">Map</span>
        </h1>
        <p className="text-sm md:text-base mt-3 text-slate-300 leading-relaxed">
          Data-driven mission intelligence for the Adventist Church.
          Unlock tools, insights and strategies to help finish the work.
        </p>

        {gcStats && (
          <div className="flex flex-wrap gap-6 mt-5">
            {[
              { label: 'Members Worldwide', value: fmtNum(gcStats.membership) },
              { label: 'Churches', value: fmtNum(gcStats.churches) },
              { label: `Baptisms (${gcStats.year})`, value: fmtNum(gcStats.baptisms) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xl md:text-2xl font-bold tabular-nums text-white">{value}</div>
                <div className="text-[10px] mt-0.5 uppercase tracking-wider text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        )}


      </div>

      {/* Map */}
      <ComposableMap
        projection="geoNaturalEarth1"
        style={{ width: '120%', height: '120%', position: 'absolute', top: '6%', left: '-10%' }}
        projectionConfig={{ scale: 175 }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies
              .filter((geo: any) => geo.properties.name !== 'Antarctica')
              .map((geo: any) => {
                const name = geo.properties.name as string;
                const d = dataMap.get(name);
                const fill = getColor(d, viewMode);

                const tooltipHtml = d
                  ? viewMode === 'where-we-are'
                    ? `<strong>${name}</strong><br/>Members: ${fmt(d.adventist_members)}<br/>Churches: ${fmt(d.churches)}<br/>Presence: ${d.presence}`
                    : `<strong>${name}</strong><br/>Population: ${fmt(d.population)}<br/>Presence: ${d.presence}`
                  : `<strong>${name}</strong><br/>No data`;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#818cf8', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      setTooltip({ x: e.clientX, y: e.clientY, content: tooltipHtml, key: name });
                    }}
                    onMouseMove={(e: React.MouseEvent) => {
                      setTooltip(prev => prev?.key === name ? { ...prev, x: e.clientX, y: e.clientY } : { x: e.clientX, y: e.clientY, content: tooltipHtml, key: name });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
