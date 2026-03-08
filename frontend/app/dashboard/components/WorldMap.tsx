"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Status palette ────────────────────────────────────────────────────────────
const STATUS_FILL: Record<string, string> = {
  thriving: "#BBF7D0",  // pastel green
  watch:    "#FEF08A",  // pastel yellow
  "at-risk":"#FED7AA",  // pastel orange
  critical: "#FECACA",  // pastel red
};

const STATUS_HOVER: Record<string, string> = {
  thriving: "#86EFAC",
  watch:    "#FDE047",
  "at-risk":"#FDBA74",
  critical: "#FCA5A5",
};

const HIGHLIGHT_STROKE       = "#fff";
const HIGHLIGHT_STROKE_WIDTH = 1.2;
const EMPTY_FILL             = "#F1F5F9";
const EMPTY_STROKE           = "#E2E8F0";

// ─── Entity → country mapping ─────────────────────────────────────────────────
// Multiple entities can share a country — we store the "worst" status per country.
// Status severity: critical > at-risk > watch > thriving
const SEVERITY: Record<string, number> = {
  thriving: 0,
  watch:    1,
  "at-risk":2,
  critical: 3,
};

interface EntityInfo {
  name:   string;
  level:  string;
  status: string;
}

// Country name → entity info (worst status wins for coloring)
const RAW_COUNTRY_ENTITIES: Array<{ country: string } & EntityInfo> = [
  { country: "United States of America", name: "North American Div.",  level: "Division",   status: "thriving" },
  { country: "Australia",                name: "South Pacific Div.",   level: "Division",   status: "watch"    },
  { country: "Australia",                name: "SNSW Conference",      level: "Conference", status: "at-risk"  },
  { country: "Australia",                name: "NNSW Conference",      level: "Conference", status: "thriving" },
  { country: "Australia",                name: "Victoria Conf.",       level: "Conference", status: "thriving" },
  { country: "Australia",                name: "WA Conference",        level: "Conference", status: "watch"    },
  { country: "Australia",                name: "SA Conference",        level: "Conference", status: "at-risk"  },
  { country: "New Zealand",              name: "NZ Pacific Conf.",     level: "Conference", status: "thriving" },
  { country: "Papua New Guinea",         name: "PNG Union",            level: "Union",      status: "thriving" },
  { country: "South Africa",             name: "Southern Africa-IO",   level: "Division",   status: "thriving" },
  { country: "France",                   name: "Inter-European Div.",  level: "Division",   status: "watch"    },
  { country: "Brazil",                   name: "South American Div.",  level: "Division",   status: "watch"    },
  { country: "Colombia",                 name: "Inter-American Div.",  level: "Division",   status: "thriving" },
  { country: "Kenya",                    name: "East-Central Africa",  level: "Division",   status: "thriving" },
  { country: "India",                    name: "Southern Asia Div.",   level: "Division",   status: "thriving" },
  { country: "China",                    name: "Northern Asia-Pac.",   level: "Division",   status: "watch"    },
];

// Build lookup: country → worst EntityInfo for display
const COUNTRY_ENTITIES: Record<string, EntityInfo> = {};
for (const row of RAW_COUNTRY_ENTITIES) {
  const existing = COUNTRY_ENTITIES[row.country];
  if (!existing || SEVERITY[row.status] > SEVERITY[existing.status]) {
    COUNTRY_ENTITIES[row.country] = { name: row.name, level: row.level, status: row.status };
  }
}

// Reverse map: entity name → country name (first match, for highlighting selected entity)
const ENTITY_TO_COUNTRY: Record<string, string> = {};
for (const row of RAW_COUNTRY_ENTITIES) {
  if (!ENTITY_TO_COUNTRY[row.name]) {
    ENTITY_TO_COUNTRY[row.name] = row.country;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onSelectEntity: (name: string) => void;
  selected: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorldMap({ onSelectEntity, selected }: Props) {
  const [tooltip, setTooltip] = useState<(EntityInfo & { country: string }) | null>(null);

  const selectedCountry = ENTITY_TO_COUNTRY[selected] ?? null;

  return (
    <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-sm overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
          Global Entity Map
        </p>
        <div className="flex items-center gap-4">
          {[
            { label: "Thriving", color: STATUS_FILL.thriving  },
            { label: "Watch",    color: STATUS_FILL.watch      },
            { label: "At Risk",  color: STATUS_FILL["at-risk"] },
            { label: "Critical", color: STATUS_FILL.critical   },

          ].map((l) => (
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
      <div className="px-5 pb-1 h-6 shrink-0">
        {tooltip ? (
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ background: STATUS_FILL[tooltip.status] ?? EMPTY_FILL }}
            />
            <span className="font-semibold text-[#111]">{tooltip.name}</span>
            <span className="text-[#D1D5DB]">·</span>
            <span className="text-[#9CA3AF]">{tooltip.level}</span>
            <span className="text-[#D1D5DB]">·</span>
            <span className="text-[#9CA3AF]">{tooltip.country}</span>
          </div>
        ) : (
          <span className="text-[11px] text-[#C4C4C4] italic">
            Click a country to select its entity
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0">
        <ComposableMap
          projectionConfig={{ scale: 145, center: [20, 5] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countryName  = geo.properties?.name as string;
                  const entityInfo   = COUNTRY_ENTITIES[countryName];
                  const isSelected   = countryName === selectedCountry;
                  const hasEntity    = !!entityInfo;

                  const fill        = hasEntity
                    ? `${STATUS_FILL[entityInfo.status]}${isSelected ? "FF" : "CC"}`
                    : EMPTY_FILL;

                  const hoverFill   = hasEntity
                    ? STATUS_HOVER[entityInfo.status]
                    : "#D4DBE8";

                  const stroke      = isSelected ? HIGHLIGHT_STROKE : EMPTY_STROKE;
                  const strokeWidth = isSelected ? HIGHLIGHT_STROKE_WIDTH : 0.4;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      onClick={() => {
                        if (!entityInfo) return;
                        onSelectEntity(entityInfo.name);
                        setTooltip({ ...entityInfo, country: countryName });
                      }}
                      onMouseEnter={() => {
                        if (entityInfo) {
                          setTooltip({ ...entityInfo, country: countryName });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill,
                          stroke,
                          strokeWidth,
                          outline: "none",
                          transition: "fill 0.15s ease",
                        },
                        hover: {
                          fill: hoverFill,
                          stroke: isSelected ? HIGHLIGHT_STROKE : EMPTY_STROKE,
                          strokeWidth,
                          outline: "none",
                          cursor: hasEntity ? "pointer" : "default",
                        },
                        pressed: {
                          fill: hoverFill,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
}
