'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import type { FeatureCollection, Feature } from 'geojson';

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
  if (ratio === 0 || presence === 'none') return '#374151';     // Nothing — gray
  if (ratio < 0.001 || presence === 'minimal' || presence === 'limited') return '#4d7c0f'; // Weak — dim green
  if (ratio < 0.01) return '#65a30d';                           // Medium — green
  return '#84cc16';                                              // Strong — bright green
}

function getWhereWeAreNotColor(ratio: number, presence: string): string {
  if (ratio === 0 || presence === 'none') return '#991b1b';     // Nothing — dark red
  if (ratio < 0.001 || presence === 'minimal' || presence === 'limited') return '#ef4444'; // Weak — red
  if (ratio < 0.01) return '#fca5a5';                           // Medium — light red
  return '#e5e7eb';                                              // Strong — gray (reached)
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

function formatRatio(ratio: number): string {
  if (ratio === 0) return 'None';
  if (ratio < 0.0001) return '1:' + Math.round(1 / ratio).toLocaleString();
  return '1:' + Math.round(1 / ratio).toLocaleString();
}

export default function HarvestMap({ fill = false }: { fill?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('where-we-are');
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);

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

  // Filter out Antarctica (no mission data)
  const fixedGeoData = useMemo(() => {
    if (!geoData) return null;
    return {
      ...geoData,
      features: geoData.features.filter((f: any) => f.properties?.country !== 'Antarctica'),
    };
  }, [geoData]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const southWest = L.latLng(-60, -180);
      const northEast = L.latLng(85, 180);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapRef.current!, {
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
        bounds: bounds,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setLeafletReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render GeoJSON layer
  useEffect(() => {
    if (!leafletReady || !fixedGeoData || !missionData) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then(L => {
      if (geoLayerRef.current) {
        map.removeLayer(geoLayerRef.current);
      }

      const layer = L.geoJSON(fixedGeoData as any, {
        style: (feature: any) => {
          const name = feature?.properties?.country;
          const d = name ? dataMap.get(name) : null;
          const ratio = d?.ratio ?? 0;
          const presence = d?.presence ?? 'none';
          const fillColor = viewMode === 'where-we-are'
            ? getWhereWeAreColor(ratio, presence)
            : getWhereWeAreNotColor(ratio, presence);
          return {
            fillColor,
            fillOpacity: 0.85,
            color: '#1f2937',
            weight: 0.8,
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const name = feature?.properties?.country;
          const d = name ? dataMap.get(name) : null;

          layer.on('mouseover', function (this: any, e: any) {
            this.setStyle({ weight: 2, color: '#6366f1', fillOpacity: 0.95 });
            if (e.target.bringToFront) e.target.bringToFront();
          });
          layer.on('mouseout', function (this: any) {
            if (geoLayerRef.current) geoLayerRef.current.resetStyle(this);
          });

          let tooltip = '';
          if (viewMode === 'where-we-are') {
            if (d && d.ratio > 0) {
              tooltip = `<div style="font-family:system-ui;font-size:13px;line-height:1.5">
                <strong>${name}</strong><br/>
                Members: ${formatNumber(d.adventist_members)}<br/>
                Churches: ${formatNumber(d.churches)}<br/>
                Ratio: ${formatRatio(d.ratio)}
              </div>`;
            } else {
              tooltip = `<div style="font-family:system-ui;font-size:13px;line-height:1.5">
                <strong>${name || 'Unknown'}</strong><br/>
                ${d ? 'No established presence' : 'No data'}
              </div>`;
            }
          } else {
            if (d) {
              const urgency = d.presence === 'none' ? '🔴 No Adventist presence'
                : d.presence === 'minimal' ? '🟠 Minimal presence'
                : d.presence === 'limited' ? '🟡 Limited presence'
                : '🟢 Established presence';
              tooltip = `<div style="font-family:system-ui;font-size:13px;line-height:1.5">
                <strong>${name}</strong><br/>
                Population: ${formatNumber(d.population)}<br/>
                ${urgency}<br/>
                ${d.ratio > 0 ? 'Ratio: ' + formatRatio(d.ratio) : ''}
              </div>`;
            } else {
              tooltip = `<div style="font-family:system-ui;font-size:13px"><strong>${name || 'Unknown'}</strong><br/>No data</div>`;
            }
          }
          layer.bindTooltip(tooltip, { sticky: true, className: 'harvest-tooltip' });
        },
      });

      layer.addTo(map);
      geoLayerRef.current = layer;
    });
  }, [leafletReady, fixedGeoData, missionData, viewMode, dataMap]);

  return (
    <div className="relative w-full" style={fill ? { height: '100%', minHeight: 0 } : { height: '70vh', minHeight: '400px' }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        .harvest-tooltip {
          background: rgba(17, 24, 39, 0.95) !important;
          color: white !important;
          border: 1px solid #4b5563 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .harvest-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          background: rgba(31, 43, 61, 0.9) !important;
          color: white !important;
          border-color: #2a3a50 !important;
        }
      `}</style>

      <div
        ref={mapRef}
        className="w-full h-full rounded-xl border border-[#2a3a50] overflow-hidden"
        style={{ background: '#1a1a2e' }}
      />

      {/* Toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex bg-[#1f2b3d]/95 backdrop-blur rounded-full p-1 border border-[#2a3a50] shadow-lg">
        <button
          onClick={() => setViewMode('where-we-are')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            viewMode === 'where-we-are'
              ? 'bg-[#6366f1] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🌿 Where We Are
        </button>
        <button
          onClick={() => setViewMode('where-we-are-not')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            viewMode === 'where-we-are-not'
              ? 'bg-[#6366f1] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🔥 Where We Are Not
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-[#1f2b3d]/95 backdrop-blur rounded-lg p-3 border border-[#2a3a50] shadow-lg">
        <div className="text-xs text-gray-400 mb-2 font-medium">
          {viewMode === 'where-we-are' ? 'Adventist Presence' : 'Unreached Level'}
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'where-we-are' ? (
            <>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#84cc16' }} /><span className="text-[10px] text-gray-400">Strong</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#65a30d' }} /><span className="text-[10px] text-gray-400">Medium</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#4d7c0f' }} /><span className="text-[10px] text-gray-400">Weak</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#374151' }} /><span className="text-[10px] text-gray-400">None</span></div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#991b1b' }} /><span className="text-[10px] text-gray-400">None</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#ef4444' }} /><span className="text-[10px] text-gray-400">Weak</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#fca5a5' }} /><span className="text-[10px] text-gray-400">Medium</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{ background: '#e5e7eb' }} /><span className="text-[10px] text-gray-400">Reached</span></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
