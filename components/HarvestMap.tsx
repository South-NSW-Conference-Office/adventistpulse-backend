'use client';

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import type { FeatureCollection } from 'geojson';

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
  source: string;
  countries: CountryData[];
}

function getWhereWeAreColor(ratio: number, presence: string): string {
  if (ratio === 0 || presence === 'none') return '#374151';
  if (ratio < 0.001 || presence === 'minimal' || presence === 'limited') return '#4d7c0f';
  if (ratio < 0.01) return '#65a30d';
  return '#84cc16';
}

function getWhereWeAreNotColor(ratio: number, presence: string): string {
  if (ratio === 0 || presence === 'none') return '#991b1b';
  if (ratio < 0.001 || presence === 'minimal' || presence === 'limited') return '#ef4444';
  if (ratio < 0.01) return '#fca5a5';
  return '#e5e7eb';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

function formatRatio(ratio: number): string {
  if (ratio === 0) return 'None';
  return '1:' + Math.round(1 / ratio).toLocaleString();
}

export default function HarvestMap({ fill = false }: { fill?: boolean }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('where-we-are');
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/data/country-mission-data.json').then(r => r.json()),
      fetch('/data/world-divisions-geo.json').then(r => r.json()),
    ]).then(([mission, geo]) => {
      setMissionData(mission);
      setGeoData(geo);
    });
  }, []);

  const dataMap = useMemo(() => {
    if (!missionData) return new Map<string, CountryData>();
    const m = new Map<string, CountryData>();
    missionData.countries.forEach(c => m.set(c.country, c));
    return m;
  }, [missionData]);

  const fixedGeoData = useMemo(() => {
    if (!geoData) return null;
    return {
      ...geoData,
      features: geoData.features.filter((f: any) => f.properties?.country !== 'Antarctica'),
    };
  }, [geoData]);

  // Init Leaflet
  useEffect(() => {
    if (!mapDivRef.current || mapInstanceRef.current) return;
    // Guard against StrictMode double-mount / already-init DOM node
    if ((mapDivRef.current as any)._leaflet_id) return;

    import('leaflet').then(L => {
      if (!mapDivRef.current || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const bounds = L.latLngBounds(L.latLng(-60, -180), L.latLng(85, 180));

      const map = L.map(mapDivRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd',
        noWrap: true,
        bounds,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;

      // Force size recalculation after paint
      requestAnimationFrame(() => {
        map.invalidateSize(true);
      });

      setLeafletReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
        geoLayerRef.current = null;
        setLeafletReady(false);
      }
    };
  }, []);

  // Invalidate size on window resize
  useEffect(() => {
    const onResize = () => mapInstanceRef.current?.invalidateSize(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Render GeoJSON layer
  useEffect(() => {
    if (!leafletReady || !fixedGeoData || !missionData) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then(L => {
      if (geoLayerRef.current) map.removeLayer(geoLayerRef.current);

      const layer = L.geoJSON(fixedGeoData as any, {
        style: (feature: any) => {
          const name = feature?.properties?.country;
          const d = name ? dataMap.get(name) : null;
          const fillColor = viewMode === 'where-we-are'
            ? getWhereWeAreColor(d?.ratio ?? 0, d?.presence ?? 'none')
            : getWhereWeAreNotColor(d?.ratio ?? 0, d?.presence ?? 'none');
          return { fillColor, fillOpacity: 0.85, color: '#1f2937', weight: 0.8 };
        },
        onEachFeature: (feature: any, layer: any) => {
          const name = feature?.properties?.country;
          const d = name ? dataMap.get(name) : null;

          layer.on('mouseover', function (this: any, e: any) {
            this.setStyle({ weight: 2, color: '#6366f1', fillOpacity: 0.95 });
            e.target.bringToFront?.();
          });
          layer.on('mouseout', function (this: any) {
            geoLayerRef.current?.resetStyle(this);
          });

          const tooltip = viewMode === 'where-we-are'
            ? d && d.ratio > 0
              ? `<div style="font-family:sans-serif;font-size:13px;line-height:1.5"><strong>${name}</strong><br/>Members: ${formatNumber(d.adventist_members)}<br/>Churches: ${formatNumber(d.churches)}<br/>Ratio: ${formatRatio(d.ratio)}</div>`
              : `<div style="font-family:sans-serif;font-size:13px"><strong>${name || 'Unknown'}</strong><br/>${d ? 'No established presence' : 'No data'}</div>`
            : d
              ? `<div style="font-family:sans-serif;font-size:13px;line-height:1.5"><strong>${name}</strong><br/>Population: ${formatNumber(d.population)}<br/>${d.presence === 'none' ? '🔴 No presence' : d.presence === 'minimal' ? '🟠 Minimal' : d.presence === 'limited' ? '🟡 Limited' : '🟢 Established'}</div>`
              : `<div style="font-family:sans-serif;font-size:13px"><strong>${name || 'Unknown'}</strong><br/>No data</div>`;

          layer.bindTooltip(tooltip, { sticky: true, className: 'harvest-tooltip' });
        },
      });

      layer.addTo(map);
      geoLayerRef.current = layer;
    });
  }, [leafletReady, fixedGeoData, missionData, viewMode, dataMap]);

  // Outer container: use 100vw/100vh directly when fill=true — no CSS chain
  const outerStyle: React.CSSProperties = fill
    ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }
    : { position: 'relative', width: '100%', height: '70vh', minHeight: 400 };

  return (
    <div style={outerStyle}>
      <style>{`
        .harvest-tooltip {
          background: rgba(17,24,39,0.95) !important;
          color: white !important;
          border: 1px solid #4b5563 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .harvest-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          background: rgba(31,43,61,0.9) !important;
          color: white !important;
          border-color: #2a3a50 !important;
        }
      `}</style>

      {/* Leaflet container — explicit 100% of the outer div */}
      <div
        ref={mapDivRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#1a1a2e',
        }}
      />

      {/* Toggle */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
        className="flex bg-[#1f2b3d]/95 backdrop-blur rounded-full p-1 border border-[#2a3a50] shadow-lg">
        {(['where-we-are', 'where-we-are-not'] as ViewMode[]).map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === mode ? 'bg-[#6366f1] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
            {mode === 'where-we-are' ? '🌿 Where We Are' : '🔥 Where We Are Not'}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 24, left: 16, zIndex: 1000 }}
        className="bg-[#1f2b3d]/95 backdrop-blur rounded-lg p-3 border border-[#2a3a50] shadow-lg">
        <div className="text-xs text-gray-400 mb-2 font-medium">
          {viewMode === 'where-we-are' ? 'Adventist Presence' : 'Unreached Level'}
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'where-we-are' ? (
            <>
              {[['#84cc16','Strong'],['#65a30d','Medium'],['#4d7c0f','Weak'],['#374151','None']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-4 h-3 rounded-sm" style={{ background: c }} />
                  <span className="text-[10px] text-gray-400">{l}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[['#991b1b','None'],['#ef4444','Weak'],['#fca5a5','Medium'],['#e5e7eb','Reached']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-4 h-3 rounded-sm" style={{ background: c }} />
                  <span className="text-[10px] text-gray-400">{l}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
