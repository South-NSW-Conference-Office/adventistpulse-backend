"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMapData,
  getCountryRankings,
  getCountryTrend,
  MapDataRow,
  CountryRankingRow,
  CountryTrendRow,
  CountryRankingMetric,
} from "@/lib/api/stats";
import { COUNTRIES } from "@/lib/data/countries";
import { toDbName } from "@/lib/data/countryNameMap";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Types ───────────────────────────────────────────────────────────────────

type MapMode = "status" | "choropleth" | "growth";

interface Props {
  onSelectEntity: (name: string) => void;
  selected: string;
}

// ─── Colour constants ────────────────────────────────────────────────────────

const STATUS_FILL: Record<string, string> = {
  thriving: "#4ADE80",
  watch: "#FACC15",
  "at-risk": "#FB923C",
  critical: "#F87171",
  unknown: "#CBD5E1",
};

const STATUS_HOVER: Record<string, string> = {
  thriving: "#22C55E",
  watch: "#EAB308",
  "at-risk": "#F97316",
  critical: "#EF4444",
  unknown: "#94A3B8",
};

const EMPTY_FILL = "#CBD5E1";
const EMPTY_STROKE = "#94A3B8";
const HIGHLIGHT_STROKE = "#ffffff";
const HIGHLIGHT_STROKE_WIDTH = 1.5;

// ─── Pure utility: flag lookup ───────────────────────────────────────────────

function getFlagForCountry(countryName: string): string {
  if (!countryName) return "🌐";
  const needle = countryName.trim().toLowerCase();
  const match = COUNTRIES.find((c) => c.name.toLowerCase() === needle);
  return match?.flag ?? "🌐";
}

// ─── Pure utility: colour interpolation ──────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateHex(from: string, to: string, t: number): string {
  const f = parseInt(from.slice(1), 16);
  const t2 = parseInt(to.slice(1), 16);
  const r = Math.round(lerp((f >> 16) & 255, (t2 >> 16) & 255, t));
  const g = Math.round(lerp((f >> 8) & 255, (t2 >> 8) & 255, t));
  const b = Math.round(lerp(f & 255, t2 & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ─── Pure utility: country fill colour ───────────────────────────────────────

export function getCountryFill(
  status: string | undefined,
  membership: number | undefined,
  growthRate: number | null | undefined,
  mode: MapMode,
  minMembership: number,
  maxMembership: number
): string {
  if (status === undefined) return EMPTY_FILL;

  switch (mode) {
    case "status":
      return STATUS_FILL[status] ?? EMPTY_FILL;

    case "choropleth": {
      if (membership === undefined) return EMPTY_FILL;
      const range = maxMembership - minMembership;
      const t = range > 0 ? (membership - minMembership) / range : 0;
      return interpolateHex("#DBEAFE", "#1D4ED8", t);
    }

    case "growth": {
      if (growthRate === null || growthRate === undefined) return EMPTY_FILL;
      if (growthRate === 0) return "#F3F4F6";
      if (growthRate < 0) {
        const t = Math.min(Math.abs(growthRate) / 20, 1);
        return interpolateHex("#FEE2E2", "#EF4444", t);
      }
      const t = Math.min(growthRate / 20, 1);
      return interpolateHex("#DCFCE7", "#16A34A", t);
    }

    default:
      return EMPTY_FILL;
  }
}

// ─── Zoom constants ──────────────────────────────────────────────────────────

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.5;

// ─── Metric labels ──────────────────────────────────────────────────────────

const RANKING_METRICS: { key: CountryRankingMetric; label: string }[] = [
  { key: "membership", label: "Members" },
  { key: "baptisms", label: "Baptisms" },
];

const MODE_OPTIONS: { key: MapMode; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "choropleth", label: "Density" },
  { key: "growth", label: "Growth" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorldMap({ onSelectEntity, selected }: Props) {
  const { accessToken } = useAuth();

  // ── Core state ──
  const [year] = useState(() => new Date().getFullYear() - 1);
  const [mode, setMode] = useState<MapMode>("status");
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<
    (MapDataRow & { trend?: CountryTrendRow[] }) | null
  >(null);

  // ── Map data ──
  const [mapData, setMapData] = useState<MapDataRow[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // ── Rankings ──
  const [rankings, setRankings] = useState<CountryRankingRow[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [rankingMetric, setRankingMetric] =
    useState<CountryRankingMetric>("membership");

  // ── Responsive ──
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileRankings, setShowMobileRankings] = useState(false);

  // ── Trend cache ──
  const trendCache = useRef<Map<string, CountryTrendRow[]>>(new Map());
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Floating tooltip position ──
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // ── Responsive listener ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Fetch map data ──
  useEffect(() => {
    if (!accessToken) return;
    setMapLoading(true);
    setMapError(null);
    getMapData(year, accessToken)
      .then((data) => {
        setMapData(data);
        trendCache.current.clear();
      })
      .catch((err) => setMapError(err?.message ?? "Failed to load map data"))
      .finally(() => setMapLoading(false));
  }, [year, accessToken]);

  // ── Fetch rankings ──
  useEffect(() => {
    if (!accessToken) return;
    setRankingsLoading(true);
    getCountryRankings({
      year,
      metric: rankingMetric,
      limit: 5,
      accessToken,
    })
      .then(setRankings)
      .catch(() => setRankings([]))
      .finally(() => setRankingsLoading(false));
  }, [year, rankingMetric, accessToken]);

  // ── Build lookup map ──
  const dataMap = useMemo(() => {
    const m = new Map<string, MapDataRow>();
    for (const row of mapData) m.set(row.country, row);
    return m;
  }, [mapData]);

  // ── Min/max membership for choropleth ──
  const { minMembership, maxMembership } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of mapData) {
      if (row.membership < min) min = row.membership;
      if (row.membership > max) max = row.membership;
    }
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 0;
    return { minMembership: min, maxMembership: max };
  }, [mapData]);

  // ── Zoom controls ──
  const zoomIn = () =>
    setZoom((z) =>
      Math.min(parseFloat((z * ZOOM_STEP).toFixed(4)), MAX_ZOOM)
    );
  const zoomOut = () =>
    setZoom((z) =>
      Math.max(parseFloat((z / ZOOM_STEP).toFixed(4)), MIN_ZOOM)
    );
  const reset = () => setZoom(1);

  // ── Hover handler with debounced trend fetch ──
  const handleMouseEnter = useCallback(
    (countryName: string, row: MapDataRow | undefined) => {
      if (!row || !accessToken) {
        setTooltip(null);
        return;
      }
      setTooltip({ ...row, trend: trendCache.current.get(row.country) });

      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (trendCache.current.has(row.country)) return;

      hoverTimer.current = setTimeout(() => {
        getCountryTrend({
          country: row.country,
          lookback: 3,
          accessToken,
        })
          .then((trend) => {
            trendCache.current.set(row.country, trend);
            setTooltip((prev) =>
              prev?.country === row.country ? { ...prev, trend } : prev
            );
          })
          .catch(() => {});
      }, 300);
    },
    [accessToken]
  );

  // ── Mouse move for floating tooltip ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  // ── Memoized geographies ──
  const renderGeographies = useMemo(
    () =>
      function GeographiesRenderer({
        geographies,
      }: {
        geographies: any[];
      }) {
        return (
          <>
            {geographies
              .filter(
                (geo: any) => geo.properties?.name !== "Antarctica"
              )
              .map((geo: any) => {
                const topoName = geo.properties?.name as string;
                const dbName = toDbName(topoName);
                const row = dataMap.get(dbName);
                const isSelected = row?.entityName === selected;

                const fill = row
                  ? getCountryFill(
                      row.status,
                      row.membership,
                      row.growthRate,
                      mode,
                      minMembership,
                      maxMembership
                    )
                  : EMPTY_FILL;

                const hoverFill = row
                  ? mode === "status"
                    ? STATUS_HOVER[row.status] ?? "#94A3B8"
                    : interpolateHex(fill, "#000000", 0.15)
                  : "#94A3B8";

                const stroke = isSelected
                  ? HIGHLIGHT_STROKE
                  : EMPTY_STROKE;
                const strokeWidth = isSelected
                  ? HIGHLIGHT_STROKE_WIDTH
                  : 0.4;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    onClick={() => {
                      if (!row) return;
                      onSelectEntity(row.entityName);
                    }}
                    onMouseEnter={() => handleMouseEnter(topoName, row)}
                    onMouseLeave={() => {
                      setTooltip(null);
                      if (hoverTimer.current)
                        clearTimeout(hoverTimer.current);
                    }}
                    style={{
                      default: {
                        fill,
                        stroke,
                        strokeWidth,
                        outline: "none",
                        transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), fill 0.3s ease",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      },
                      hover: {
                        fill: hoverFill,
                        stroke: isSelected ? HIGHLIGHT_STROKE : EMPTY_STROKE,
                        strokeWidth,
                        outline: "none",
                        cursor: row ? "pointer" : "default",
                        transform: "scale(1.18)",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
                        zIndex: 10,
                      },
                      pressed: {
                        fill: hoverFill,
                        outline: "none",
                        transform: "scale(1.08)",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      },
                    }}
                  />
                );
              })}
          </>
        );
      },
    [
      dataMap,
      mode,
      selected,
      minMembership,
      maxMembership,
      handleMouseEnter,
      onSelectEntity,
    ]
  );

  // ── Legend for current mode ──
  const legend = useMemo(() => {
    if (mode === "status") {
      return [
        { label: "Thriving", color: STATUS_FILL.thriving },
        { label: "Watch", color: STATUS_FILL.watch },
        { label: "At Risk", color: STATUS_FILL["at-risk"] },
        { label: "Critical", color: STATUS_FILL.critical },
      ];
    }
    if (mode === "choropleth") {
      return [
        { label: "Low", color: "#DBEAFE" },
        { label: "High", color: "#1D4ED8" },
      ];
    }
    return [
      { label: "Decline", color: "#EF4444" },
      { label: "Stable", color: "#F3F4F6" },
      { label: "Growth", color: "#16A34A" },
    ];
  }, [mode]);

  // ── Rankings panel content (shared between desktop & mobile) ──
  const rankingsContent = (
    <div className="flex flex-col gap-4">
      {/* Metric toggle */}
      <div className="flex gap-1">
        {RANKING_METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setRankingMetric(m.key)}
            className={`flex-1 text-[10px] py-1 rounded transition-colors ${
              rankingMetric === m.key
                ? "bg-[#111827] text-white"
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      {rankingsLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <span className="w-[22px] h-[18px] bg-gray-200 rounded shrink-0" />
              <span className="flex-1 h-3 bg-gray-200 rounded" />
              <span className="w-6 h-3 bg-gray-200 rounded" />
            </div>
          ))
        : rankings.length > 0
          ? rankings.map((row) => (
              <button
                key={row.country}
                onClick={() => onSelectEntity(row.country)}
                className="flex items-center gap-3 w-full text-left hover:bg-[#F9FAFB] rounded px-1 -mx-1 transition-colors"
              >
                <span className="text-[18px] leading-none select-none">
                  {getFlagForCountry(row.country)}
                </span>
                <span className="flex-1 text-[13px] text-[#374151] truncate">
                  {row.country}
                </span>
                <span className="text-[13px] font-semibold text-[#111827] tabular-nums">
                  {row.value.toLocaleString()}
                </span>
              </button>
            ))
          : (
              <p className="text-[11px] text-[#9CA3AF] italic text-center">
                No data for {year}
              </p>
            )}
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: map ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 px-5 shrink-0">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
            Global Entity Map
          </p>
          <div className="flex items-center gap-4">
            {/* Mode toggle */}
            <div className="flex gap-1 mr-4">
              {MODE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setMode(o.key)}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    mode === o.key
                      ? "bg-[#111827] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {/* Legend */}
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: l.color }}
                />
                <span className="text-[10px] text-[#9CA3AF]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip strip */}
        <div className="pb-1 h-6 px-5 shrink-0">
          {tooltip ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{
                  background: STATUS_FILL[tooltip.status] ?? EMPTY_FILL,
                }}
              />
              <span className="font-semibold text-[#111]">
                {tooltip.entityName}
              </span>
              <span className="text-[#D1D5DB]">·</span>
              <span className="text-[#9CA3AF]">{tooltip.level}</span>
              <span className="text-[#D1D5DB]">·</span>
              <span className="text-[#9CA3AF]">{tooltip.country}</span>
              <span className="text-[#D1D5DB]">·</span>
              <span className="text-[#9CA3AF]">
                {tooltip.membership.toLocaleString()} members
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#C4C4C4] italic">
              Hover a country to explore
            </span>
          )}
        </div>

        {/* Map */}
        <div
          className="flex-1 min-h-0 relative"
          ref={mapContainerRef}
          onMouseMove={handleMouseMove}
        >
          {/* Loading overlay */}
          {mapLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#CBD5E1] border-t-[#3B82F6] rounded-full animate-spin" />
            </div>
          )}

          {/* Error overlay */}
          {mapError && !mapLoading && (
            <div className="absolute inset-0 z-20 bg-white/80 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-[#EF4444]">{mapError}</p>
              <button
                onClick={() => {
                  if (!accessToken) return;
                  setMapLoading(true);
                  setMapError(null);
                  getMapData(year, accessToken)
                    .then(setMapData)
                    .catch((err) =>
                      setMapError(err?.message ?? "Failed to load map data")
                    )
                    .finally(() => setMapLoading(false));
                }}
                className="text-xs px-3 py-1.5 rounded bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <ComposableMap
            width={1920}
            height={1000}
            projectionConfig={{ scale: 370, center: [10, 5] }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onMoveEnd={({ zoom: z }) => setZoom(z)}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  renderGeographies({ geographies })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Floating tooltip card */}
          {tooltip && (
            <div
              className="absolute z-30 pointer-events-none bg-white rounded-xl shadow-lg min-w-[200px] p-3 border border-[#E5E7EB]"
              style={{
                left: Math.min(
                  cursorPos.x + 16,
                  (mapContainerRef.current?.clientWidth ?? 800) - 220
                ),
                top: cursorPos.y - 10,
                transform: "translateY(-100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">
                  {getFlagForCountry(tooltip.country)}
                </span>
                <span className="text-sm font-semibold text-[#111]">
                  {tooltip.country}
                </span>
              </div>
              <span
                className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-1.5"
                style={{
                  background:
                    (STATUS_FILL[tooltip.status] ?? EMPTY_FILL) + "33",
                  color: STATUS_HOVER[tooltip.status] ?? "#6B7280",
                }}
              >
                {tooltip.status}
              </span>
              <p className="text-xs text-[#374151]">
                Membership:{" "}
                <span className="font-semibold">
                  {tooltip.membership.toLocaleString()}
                </span>
              </p>
              {tooltip.trend ? (
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  {tooltip.trend
                    .map(
                      (t) => `${t.year}: ${t.value.toLocaleString()}`
                    )
                    .join(" · ")}
                </p>
              ) : (
                <div className="mt-1 space-y-1">
                  <div className="h-2.5 w-3/4 bg-gray-100 rounded animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* ── Zoom controls — bottom left ──────────────────────── */}
          <div
            className="absolute bottom-4 left-5 flex flex-row gap-1 z-10"
            style={{ transition: "all 0.3s ease" }}
          >
            <button
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="w-7 h-7 rounded-md bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Zoom in"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              onClick={reset}
              className="w-7 h-7 rounded-md bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] transition-colors text-[10px] font-bold"
              title="Reset zoom"
            >
              ⌂
            </button>
            <button
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="w-7 h-7 rounded-md bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Zoom out"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 6h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Mobile rankings toggle */}
          {isMobile && (
            <button
              onClick={() => setShowMobileRankings(true)}
              className="absolute bottom-4 right-5 z-10 w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-lg"
              title="Show rankings"
            >
              📊
            </button>
          )}
        </div>
      </div>

      {/* ── Right: country rankings (desktop) ────────────────────────── */}
      {!isMobile && (
        <div className="w-[210px] border-l border-[#E5E7EB] flex flex-col justify-center py-6 px-5 shrink-0">
          {rankingsContent}
        </div>
      )}

      {/* ── Mobile rankings bottom sheet ─────────────────────────────── */}
      {isMobile && showMobileRankings && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowMobileRankings(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 pb-8 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-widest uppercase text-[#9CA3AF]">
                Country Rankings
              </p>
              <button
                onClick={() => setShowMobileRankings(false)}
                className="text-[#9CA3AF] hover:text-[#374151] text-lg"
              >
                ✕
              </button>
            </div>
            {rankingsContent}
          </div>
        </div>
      )}
    </div>
  );
}
