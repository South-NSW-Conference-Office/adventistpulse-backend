'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Church {
  name: string;
  conference: string;
  conferenceName: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

interface WorldDivision {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    color: string;
    territory: string;
    center: [number, number];
    zoom: number;
  };
  geometry: any;
}

interface TerritoryFeature {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    color: string;
    state?: string;
    union?: string;
    division?: string;
    layer: 'conference' | 'union' | 'division';
  };
  geometry: any;
}

interface Entity {
  code: string;
  name: string;
  level: string;
  parentCode: string | null;
  latestYear?: {
    membership?: { ending?: number | null };
    churches?: number | null;
  } | null;
}

interface BreadcrumbItem {
  code: string;
  name: string;
  level: 'world' | 'division' | 'union' | 'conference';
}

interface ViewState {
  level: 'world' | 'division' | 'union' | 'conference';
  selectedDivision: string | null;
  selectedUnion: string | null;
  selectedConference: string | null;
}

const CONF_COLORS: Record<string, string> = {
  SNSW: '#6366F1', NNSW: '#3b82f6', GSYD: '#8b5cf6', VIC: '#10b981',
  SQ: '#f59e0b', NAC: '#ef4444', SA: '#6366F1', WAC: '#6366F1', TAS: '#ec4899',
};

const DIVISION_TERRITORY_MAP: Record<string, string[]> = {
  SPD: ['Australia', 'New Zealand', 'Papua New Guinea', 'Pacific Islands'],
  NAD: ['United States', 'Canada', 'Bermuda', 'Guam'],
  SAD: ['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia'],
  IAD: ['Mexico', 'Central America', 'Caribbean'],
  ECD: ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'DRC'],
  SID: ['South Africa', 'Zimbabwe', 'Madagascar', 'Mozambique'],
  WAD: ['Nigeria', 'Ghana', 'Cameroon', 'Côte d\'Ivoire'],
  EUD: ['France', 'Spain', 'Portugal', 'Morocco'],
  TED: ['Germany', 'United Kingdom', 'Netherlands', 'Scandinavia'],
  ESD: ['Russia', 'Ukraine', 'Kazakhstan', 'Eastern Europe'],
  SUD: ['India', 'Pakistan', 'Sri Lanka', 'Bangladesh'],
  NSD: ['China', 'Japan', 'South Korea', 'Mongolia'],
  SSD: ['Indonesia', 'Philippines', 'Thailand', 'Malaysia']
};

// Union geographic centers for proper marker placement
const UNION_CENTERS: Record<string, [number, number]> = {
  // SPD Unions
  'AUC': [-27, 134],    // Australian Union Conference (center of Australia)
  'NZPUC': [-41, 174],  // New Zealand Pacific Union Conference (New Zealand)
  'PNGUM': [-6, 147],   // Papua New Guinea Union Mission (PNG)
  'TPUM': [-18, 179],   // Trans-Pacific Union Mission (Fiji/Pacific Islands)
  // Add more unions as needed for other divisions
};

function useLeaflet() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if ((window as any).L) { setLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link2 = document.createElement('link');
      link2.rel = 'stylesheet';
      link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(link2);
      const link3 = document.createElement('link');
      link3.rel = 'stylesheet';
      link3.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(link3);
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      script2.onload = () => setLoaded(true);
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  }, []);
  return loaded;
}

export default function MapExplorer() {
  const leafletLoaded = useLeaflet();
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const territoryLayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data state
  const [churches, setChurches] = useState<Church[]>([]);
  const [worldDivisions, setWorldDivisions] = useState<WorldDivision[]>([]);
  const [territories, setTerritories] = useState<TerritoryFeature[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // UI state
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, geocoded: 0 });
  
  // Navigation state
  const [viewState, setViewState] = useState<ViewState>({
    level: 'world',
    selectedDivision: null,
    selectedUnion: null,
    selectedConference: null,
  });

  // Load initial data
  useEffect(() => {
    // Load world divisions (now with actual country geometries)
    fetch('/data/world-divisions-geo.json')
      .then(r => r.json())
      .then(data => {
        // Filter out features that cross the antimeridian to avoid visual glitches
        // Instead of trying to fix coordinates, we'll simply filter out problematic polygons
        const filterAntimeridianFeatures = (features: any[]): any[] => {
          return features.filter((feature: any) => {
            if (!feature.geometry || !feature.geometry.coordinates) return true;
            
            // Check if this feature crosses the antimeridian
            const checkPolygonCrossing = (coords: number[][]): boolean => {
              for (let i = 1; i < coords.length; i++) {
                const [prevLng] = coords[i - 1];
                const [currentLng] = coords[i];
                // If longitude jumps more than 180°, it crosses antimeridian
                if (Math.abs(currentLng - prevLng) > 180) {
                  return true;
                }
              }
              return false;
            };

            if (feature.geometry.type === 'Polygon') {
              // Check first ring (outer boundary)
              if (checkPolygonCrossing(feature.geometry.coordinates[0])) {
                console.log(`Filtering out antimeridian-crossing feature: ${feature.properties.country}`);
                return false;
              }
            } else if (feature.geometry.type === 'MultiPolygon') {
              // Check all polygons in multipolygon
              for (const polygon of feature.geometry.coordinates) {
                if (checkPolygonCrossing(polygon[0])) {
                  console.log(`Filtering out antimeridian-crossing multipolygon: ${feature.properties.country}`);
                  return false;
                }
              }
            }
            
            return true; // Keep feature if it doesn't cross antimeridian
          });
        };

        // Apply filtering to remove problematic features
        data.features = filterAntimeridianFeatures(data.features);

        // Group countries by division for easier handling
        const divisionGroups: Record<string, any[]> = {};
        data.features.forEach((feature: any) => {
          const division = feature.properties.division;
          if (!divisionGroups[division]) {
            divisionGroups[division] = [];
          }
          divisionGroups[division].push(feature);
        });
        
        // Convert to the expected format for compatibility
        const divisionFeatures = Object.keys(divisionGroups).map(divisionCode => {
          const countries = divisionGroups[divisionCode];
          const firstCountry = countries[0];
          
          return {
            type: 'Feature' as const,
            properties: {
              code: divisionCode,
              name: firstCountry.properties.name,
              color: firstCountry.properties.color,
              territory: countries.map(c => c.properties.country).join(', '),
              center: [0, 0] as [number, number], // We'll calculate this dynamically
              zoom: 3
            },
            geometry: null // We'll use the individual country geometries
          };
        });
        
        setWorldDivisions(divisionFeatures);
        
        // Store the raw country features for rendering
        (window as any).countryFeatures = data.features;
      })
      .catch(console.error);

    // Load Australian churches from API
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${apiBase}/api/v1/stats/map?limit=2000`)
      .then(r => r.json())
      .then(data => {
        const raw: any[] = data?.data ?? [];
        const churches: Church[] = raw.filter((c: any) => c.lat && c.lng).map((c: any) => ({
          name: c.name ?? '',
          lat: c.lat ?? c.location?.coordinates?.[1],
          lng: c.lng ?? c.location?.coordinates?.[0],
          conference: c.parentCode ?? '',
          conferenceName: c.conferenceName ?? '',
          address: c.address ?? '',
          suburb: c.suburb ?? '',
          state: c.state ?? '',
          postcode: c.postcode ?? '',
        }));
        setChurches(churches);
        setStats({ total: churches.length, geocoded: churches.length });
      })
      .catch(console.error);

    // Territories: static GeoJSON (non-sensitive reference data, served separately)
    // setTerritories([]) — disabled until GeoJSON endpoint available

    // Load all entities from API
    fetch(`${apiBase}/api/v1/entities?limit=5000`)
      .then(r => r.json())
      .then((data: any) => {
        const list: any[] = data?.data?.data ?? data?.data ?? [];
        const mapped = list.map((e: any) => ({
          code: e.code,
          name: e.name,
          level: e.level,
          parentCode: e.parentCode,
        }));
        setEntities(mapped);
      })
      .catch(console.error);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    
    // World view by default
    const map = L.map(containerRef.current, { 
      center: [20, 0], 
      zoom: 2, 
      zoomControl: true,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      attributionControl: false, // Remove attribution to reduce clutter
    });
    
    // Set map container background to dark theme
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '#1a2332';
    }
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO', 
      subdomains: 'abcd', 
      maxZoom: 19,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
    }).addTo(map);
    
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [leafletLoaded]);

  // Handle navigation
  const navigateToLevel = useCallback((newState: Partial<ViewState>) => {
    setViewState(prev => ({ ...prev, ...newState }));
  }, []);

  const navigateToDivision = useCallback((divisionCode: string) => {
    const countryFeatures = (window as any).countryFeatures || [];
    const divisionCountries = countryFeatures.filter((f: any) => f.properties.division === divisionCode);
    
    if (divisionCountries.length > 0 && mapRef.current) {
      const L = (window as any).L;
      
      // Define optimal view centers for each division to ensure proper navigation
      const DIVISION_CENTERS: Record<string, { center: [number, number], zoom: number }> = {
        SPD: { center: [-15, 155], zoom: 3 }, // South Pacific: Australia/Pacific region
        NAD: { center: [45, -100], zoom: 3 }, // North America
        SAD: { center: [-15, -60], zoom: 3 }, // South America
        IAD: { center: [15, -85], zoom: 4 }, // Inter-America: Mexico/Central America/Caribbean
        ECD: { center: [0, 35], zoom: 4 }, // East-Central Africa
        SID: { center: [-20, 25], zoom: 4 }, // Southern Africa-Indian Ocean
        WAD: { center: [10, 0], zoom: 4 }, // West-Central Africa
        EUD: { center: [45, 5], zoom: 4 }, // Euro-Africa: Western Europe/North Africa
        TED: { center: [55, 10], zoom: 4 }, // Trans-European: Northern/Eastern Europe
        ESD: { center: [55, 50], zoom: 3 }, // Euro-Asia: Russia/Eastern Europe
        SUD: { center: [20, 75], zoom: 4 }, // Southern Asia-Pacific: India/South Asia
        NSD: { center: [35, 110], zoom: 3 }, // Northern Asia-Pacific: China/East Asia
        SSD: { center: [0, 120], zoom: 4 }  // Southern Asia-Pacific: Southeast Asia
      };

      const divisionView = DIVISION_CENTERS[divisionCode];
      if (divisionView) {
        // Use predefined center for reliable navigation
        console.log(`Navigating to division ${divisionCode} at center:`, divisionView.center);
        mapRef.current.setView(divisionView.center, divisionView.zoom, { animate: true });
      } else {
        // Calculate bounds for all countries in this division
        // Filter out countries that would cause antimeridian issues
        const filteredCountries = divisionCountries.filter((country: any) => {
          // For divisions that span the Pacific, exclude far-eastern countries
          if (divisionCode === 'SPD') {
            // Only include western Pacific countries (Australia, NZ, PNG)
            const countryName = country.properties.country;
            return ['Australia', 'New Zealand', 'Papua New Guinea'].includes(countryName);
          }
          if (divisionCode === 'ESD') {
            // Only include European part of Russia, exclude far-eastern Russia
            const countryName = country.properties.country;
            return countryName !== 'Russia' || true; // For now, include all
          }
          return true;
        });
        
        const bounds = L.latLngBounds();
        let validBounds = false;
        
        filteredCountries.forEach((country: any) => {
          if (country.geometry && country.geometry.coordinates) {
            // Calculate bounds for each country
            const coords = country.geometry.coordinates;
            if (country.geometry.type === 'Polygon') {
              coords[0].forEach((coord: number[]) => {
                const [lng, lat] = coord;
                // Skip coordinates that would create antimeridian issues
                if (Math.abs(lng) > 170 && divisionCode === 'SPD') return;
                bounds.extend([lat, lng]);
                validBounds = true;
              });
            } else if (country.geometry.type === 'MultiPolygon') {
              coords.forEach((polygon: number[][][]) => {
                polygon[0].forEach((coord: number[]) => {
                  const [lng, lat] = coord;
                  // Skip coordinates that would create antimeridian issues
                  if (Math.abs(lng) > 170 && divisionCode === 'SPD') return;
                  bounds.extend([lat, lng]);
                  validBounds = true;
                });
              });
            }
          }
        });
        
        // Fit the map to show all countries in this division
        if (validBounds && bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [20, 20], animate: true });
        } else {
          // Fallback to world view if bounds calculation fails
          mapRef.current.setView([20, 0], 2, { animate: true });
        }
      }
      
      navigateToLevel({
        level: 'division',
        selectedDivision: divisionCode,
        selectedUnion: null,
        selectedConference: null
      });
    }
  }, [navigateToLevel]);

  const navigateToUnion = useCallback((unionCode: string) => {
    navigateToLevel({
      level: 'union',
      selectedUnion: unionCode,
      selectedConference: null
    });
  }, [navigateToLevel]);

  const navigateToConference = useCallback((conferenceCode: string) => {
    navigateToLevel({
      level: 'conference',
      selectedConference: conferenceCode
    });
  }, [navigateToLevel]);

  const navigateUp = useCallback(() => {
    if (viewState.level === 'conference') {
      navigateToLevel({ level: 'union', selectedConference: null });
    } else if (viewState.level === 'union') {
      navigateToLevel({ level: 'division', selectedUnion: null, selectedConference: null });
    } else if (viewState.level === 'division') {
      if (mapRef.current) {
        mapRef.current.setView([20, 0], 2, { animate: true });
      }
      navigateToLevel({ 
        level: 'world', 
        selectedDivision: null, 
        selectedUnion: null, 
        selectedConference: null 
      });
    }
  }, [viewState.level, navigateToLevel]);

  // Generate breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { code: 'world', name: 'World', level: 'world' }
  ];

  if (viewState.selectedDivision) {
    const division = worldDivisions.find(d => d.properties.code === viewState.selectedDivision);
    if (division) {
      breadcrumbs.push({ 
        code: division.properties.code, 
        name: division.properties.name, 
        level: 'division' 
      });
    }
  }

  if (viewState.selectedUnion) {
    const union = entities.find(e => e.code === viewState.selectedUnion);
    if (union) {
      breadcrumbs.push({ 
        code: union.code, 
        name: union.name, 
        level: 'union' 
      });
    }
  }

  if (viewState.selectedConference) {
    const conference = entities.find(e => e.code === viewState.selectedConference);
    if (conference) {
      breadcrumbs.push({ 
        code: conference.code, 
        name: conference.name, 
        level: 'conference' 
      });
    }
  }

  // Render world divisions
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || worldDivisions.length === 0) return;
    if (viewState.level !== 'world') return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Clear existing layers
    if (territoryLayerRef.current) {
      map.removeLayer(territoryLayerRef.current);
    }
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    // Get country features from global storage
    const countryFeatures = (window as any).countryFeatures || [];
    
    if (countryFeatures.length === 0) {
      console.log('No country features loaded yet');
      return;
    }

    const geoJsonLayer = L.geoJSON({ type: 'FeatureCollection', features: countryFeatures }, {
      style: (feature: any) => ({
        fillColor: feature.properties.color,
        fillOpacity: 0.4,
        color: feature.properties.color,
        weight: 1,
        opacity: 0.8,
      }),
      onEachFeature: (feature: any, layer: any) => {
        const p = feature.properties;
        const divisionEntities = entities.filter(e => 
          e.level === 'division' && e.code === p.division
        );
        const membership = divisionEntities[0]?.latestYear?.membership?.ending || 0;
        const churchCount = divisionEntities[0]?.latestYear?.churches || 0;
        
        // Show popup on click
        layer.bindPopup(`
          <div style="font-family:system-ui;min-width:220px">
            <div style="font-weight:700;font-size:16px;color:${p.color};margin-bottom:4px">${p.name}</div>
            <div style="font-size:14px;color:#333;margin-bottom:6px">${p.country}</div>
            <div style="font-size:13px;margin-bottom:8px">
              <div style="margin-bottom:2px"><strong>${(membership || 0).toLocaleString()}</strong> members</div>
              <div style="margin-bottom:2px"><strong>${(churchCount || 0).toLocaleString()}</strong> churches</div>
            </div>
            <button onclick="window.navigateToDivision('${p.division}')" 
              style="background:${p.color};color:white;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;width:100%">
              Explore ${p.division} →
            </button>
          </div>
        `);

        layer.on('click', () => navigateToDivision(p.division));
        
        // Hover effects
        layer.on('mouseover', function(this: any) {
          this.setStyle({ fillOpacity: 0.7, weight: 2 });
        });
        layer.on('mouseout', function(this: any) {
          this.setStyle({ fillOpacity: 0.4, weight: 1 });
        });
      },
    });

    geoJsonLayer.addTo(map);
    territoryLayerRef.current = geoJsonLayer;

    // Expose navigation function to global scope for popup buttons
    (window as any).navigateToDivision = navigateToDivision;

  }, [worldDivisions, leafletLoaded, viewState.level, entities, navigateToDivision]);

  // Render division-level entities (unions)
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    if (viewState.level !== 'division' || !viewState.selectedDivision) return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Clear existing layers
    if (territoryLayerRef.current) {
      map.removeLayer(territoryLayerRef.current);
    }
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    // Get unions for this division
    const unions = entities.filter(e => 
      e.level === 'union' && e.parentCode === viewState.selectedDivision
    );

    if (unions.length === 0) return;

    // Create markers for unions (since we don't have geographic boundaries)
    unions.forEach(union => {
      const membership = union.latestYear?.membership?.ending || 0;
      const churchCount = union.latestYear?.churches || 0;
      
      // Use proper geographic centers for unions, especially SPD
      let unionLat: number, unionLng: number;
      
      if (UNION_CENTERS[union.code]) {
        // Use predefined geographic center for this union
        [unionLat, unionLng] = UNION_CENTERS[union.code];
      } else {
        // Fallback: generate a position based on union name hash for consistent placement
        const hash = union.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const division = worldDivisions.find(d => d.properties.code === viewState.selectedDivision);
        if (!division) return;

        // Use proper division centers instead of [0, 0]
        const DIVISION_CENTERS: Record<string, [number, number]> = {
          SPD: [-15, 155], NAD: [45, -100], SAD: [-15, -60], IAD: [15, -85],
          ECD: [0, 35], SID: [-20, 25], WAD: [10, 0], EUD: [45, 5],
          TED: [55, 10], ESD: [55, 50], SUD: [20, 75], NSD: [35, 110], SSD: [0, 120]
        };
        
        const [baseLng, baseLat] = DIVISION_CENTERS[viewState.selectedDivision!] || [0, 0];
        const offsetLat = ((hash % 1000) / 1000 - 0.5) * 20; // ±10 degrees
        const offsetLng = (((hash * 31) % 1000) / 1000 - 0.5) * 30; // ±15 degrees
        
        unionLat = baseLat + offsetLat;
        unionLng = baseLng + offsetLng;
      }
      
      const division = worldDivisions.find(d => d.properties.code === viewState.selectedDivision);
      if (!division) return;
      
      const marker = L.circleMarker([unionLat, unionLng], {
        radius: Math.max(8, Math.min(20, Math.sqrt(membership / 1000))),
        fillColor: division.properties.color,
        fillOpacity: 0.7,
        color: '#fff',
        weight: 2
      });

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:200px">
          <div style="font-weight:700;font-size:15px;color:${division.properties.color};margin-bottom:4px">${union.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:2px">Union - ${union.code}</div>
          <div style="font-size:13px;margin-bottom:8px">
            <div style="margin-bottom:2px"><strong>${membership.toLocaleString()}</strong> members</div>
            <div style="margin-bottom:2px"><strong>${churchCount.toLocaleString()}</strong> churches</div>
          </div>
          <button onclick="window.navigateToUnion('${union.code}')" 
            style="background:${division.properties.color};color:white;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;width:100%">
            Explore ${union.code} →
          </button>
        </div>
      `);

      marker.on('click', () => navigateToUnion(union.code));
      marker.addTo(map);
    });

    // Expose navigation function to global scope for popup buttons
    (window as any).navigateToUnion = navigateToUnion;

  }, [viewState.level, viewState.selectedDivision, entities, leafletLoaded, worldDivisions, navigateToUnion]);

  // Render union-level entities (conferences)
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    if (viewState.level !== 'union' || !viewState.selectedUnion) return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Clear existing layers
    if (territoryLayerRef.current) {
      map.removeLayer(territoryLayerRef.current);
    }
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    // Get conferences for this union
    const conferences = entities.filter(e => 
      (e.level === 'conference' || e.level === 'mission') && 
      e.parentCode === viewState.selectedUnion
    );

    if (conferences.length === 0) return;

    // For SPD conferences, use AU territories if available
    if (viewState.selectedDivision === 'SPD' && territories.length > 0) {
      const auConferences = territories.filter(t => t.properties.layer === 'conference');
      
      if (auConferences.length > 0) {
        const geoJsonLayer = L.geoJSON({ type: 'FeatureCollection', features: auConferences }, {
          style: (feature: any) => ({
            fillColor: feature.properties.color,
            fillOpacity: 0.25,
            color: feature.properties.color,
            weight: 2,
            opacity: 0.8,
          }),
          onEachFeature: (feature: any, layer: any) => {
            const p = feature.properties;
            const churchCount = churches.filter(c => c.conference === p.code).length;

            layer.bindPopup(`
              <div style="font-family:system-ui;min-width:200px">
                <div style="font-weight:700;font-size:15px;color:${p.color};margin-bottom:4px">${p.name}</div>
                <div style="font-size:12px;color:#666;margin-bottom:2px">Conference - ${p.code}</div>
                <div style="font-size:12px;color:#888;margin-bottom:4px">${churchCount} churches</div>
                <button onclick="window.navigateToConference('${p.code}')" 
                  style="background:${p.color};color:white;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;width:100%">
                  View Churches →
                </button>
              </div>
            `);

            layer.on('click', () => navigateToConference(p.code));
            
            layer.on('mouseover', function(this: any) {
              this.setStyle({ fillOpacity: 0.45, weight: 3 });
            });
            layer.on('mouseout', function(this: any) {
              this.setStyle({ fillOpacity: 0.25, weight: 2 });
            });
          },
        });

        geoJsonLayer.addTo(map);
        territoryLayerRef.current = geoJsonLayer;
      }
    } else {
      // For other divisions, create circle markers for conferences
      const union = entities.find(e => e.code === viewState.selectedUnion);
      const division = worldDivisions.find(d => d.properties.code === viewState.selectedDivision);
      if (!union || !division) return;

      conferences.forEach(conference => {
        const membership = conference.latestYear?.membership?.ending || 0;
        const churchCount = conference.latestYear?.churches || 0;
        
        // Generate positions around the union area
        const hash = conference.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const [baseLng, baseLat] = division.properties.center;
        const offsetLat = ((hash % 1000) / 1000 - 0.5) * 10;
        const offsetLng = (((hash * 31) % 1000) / 1000 - 0.5) * 15;
        
        const marker = L.circleMarker([baseLat + offsetLat, baseLng + offsetLng], {
          radius: Math.max(6, Math.min(15, Math.sqrt(membership / 2000))),
          fillColor: division.properties.color,
          fillOpacity: 0.6,
          color: '#fff',
          weight: 2
        });

        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-weight:700;font-size:14px;color:${division.properties.color};margin-bottom:4px">${conference.name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:2px">${conference.level.charAt(0).toUpperCase() + conference.level.slice(1)} - ${conference.code}</div>
            <div style="font-size:13px;margin-bottom:8px">
              <div style="margin-bottom:2px"><strong>${membership.toLocaleString()}</strong> members</div>
              <div style="margin-bottom:2px"><strong>${churchCount.toLocaleString()}</strong> churches</div>
            </div>
            <a href="/entity/${conference.code}" style="color:#3b82f6;font-size:11px;text-decoration:none">View Details →</a>
          </div>
        `);

        marker.addTo(map);
      });
    }

    // Expose navigation function to global scope for popup buttons
    (window as any).navigateToConference = navigateToConference;

  }, [viewState.level, viewState.selectedUnion, viewState.selectedDivision, entities, leafletLoaded, territories, churches, worldDivisions, navigateToConference]);

  // Render conference-level churches
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    if (viewState.level !== 'conference' || !viewState.selectedConference) return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Clear existing layers
    if (territoryLayerRef.current) {
      map.removeLayer(territoryLayerRef.current);
      territoryLayerRef.current = null;
    }
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    // Filter churches for this conference
    const conferenceChurches = churches.filter(c => c.conference === viewState.selectedConference);

    if (conferenceChurches.length === 0) {
      // No detailed church data available for this conference
      return;
    }

    // Create marker cluster for churches
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const size = count > 50 ? 40 : count > 10 ? 30 : 20;
        return L.divIcon({
          html: `<div style="background:#6366F1;color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #1a2332">${count}</div>`,
          className: '', iconSize: [size, size],
        });
      },
    });

    conferenceChurches.forEach(church => {
      if (!church.lat || !church.lng) return;
      
      const color = CONF_COLORS[church.conference] || '#6366F1';
      const marker = L.circleMarker([church.lat, church.lng], {
        radius: 6, fillColor: color, fillOpacity: 0.9, color: '#1a2332', weight: 2,
      });
      
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${church.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:2px">${church.suburb}, ${church.state} ${church.postcode}</div>
          <div style="font-size:12px;color:${color};font-weight:600;margin-bottom:4px">${church.conferenceName}</div>
          <a href="/entity/${church.conference}" style="font-size:11px;color:#3b82f6">View on Pulse →</a>
        </div>
      `);
      
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    // Zoom to churches if this is SPD
    if (viewState.selectedDivision === 'SPD' && conferenceChurches.length > 0) {
      const group = new L.featureGroup(conferenceChurches
        .filter(c => c.lat && c.lng)
        .map(c => L.marker([c.lat!, c.lng!]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [viewState.level, viewState.selectedConference, viewState.selectedDivision, churches, leafletLoaded]);

  // Search functionality
  const searchResults = search
    ? churches.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.suburb.toLowerCase().includes(search.toLowerCase()) ||
        c.postcode.includes(search)
      ).slice(0, 8)
    : [];

  const flyToChurch = useCallback((church: Church) => {
    if (!mapRef.current || !church.lat || !church.lng) return;
    
    // Navigate to church level if not already there
    if (viewState.level !== 'conference' || viewState.selectedConference !== church.conference) {
      setViewState({
        level: 'conference',
        selectedDivision: 'SPD', // Assume SPD for AU churches
        selectedUnion: 'AUC',    // Assume AUC for AU churches  
        selectedConference: church.conference
      });
    }
    
    mapRef.current.setView([church.lat, church.lng], 14, { animate: true });
    setSearch('');
  }, [viewState]);

  const currentLevelData = () => {
    switch (viewState.level) {
      case 'world':
        // Group divisions by code and show division-level data
        const divisionMap = new Map();
        worldDivisions.forEach(d => {
          if (!divisionMap.has(d.properties.code)) {
            divisionMap.set(d.properties.code, {
              code: d.properties.code,
              name: d.properties.name,
              color: d.properties.color,
              stats: entities.find(e => e.code === d.properties.code)?.latestYear
            });
          }
        });
        return Array.from(divisionMap.values());
      case 'division':
        return entities.filter(e => e.level === 'union' && e.parentCode === viewState.selectedDivision);
      case 'union':
        return entities.filter(e => (e.level === 'conference' || e.level === 'mission') && e.parentCode === viewState.selectedUnion);
      case 'conference':
        return [];
      default:
        return [];
    }
  };

  const levelData = currentLevelData();

  return (
    <main className="h-screen bg-gray-50 dark:bg-[#1a2332] text-gray-900 dark:text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#2a3a50] px-4 py-3 flex flex-col gap-3 z-20 bg-gray-50 dark:bg-[#1a2332] flex-shrink-0">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.code} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (i === 0) {
                    navigateUp();
                    if (mapRef.current) mapRef.current.setView([20, 0], 2);
                    setViewState({ level: 'world', selectedDivision: null, selectedUnion: null, selectedConference: null });
                  } else if (crumb.level === 'division') {
                    navigateToDivision(crumb.code);
                  } else if (crumb.level === 'union') {
                    navigateToUnion(crumb.code);
                  }
                }}
                className={`transition-colors ${
                  i === breadcrumbs.length - 1 
                    ? 'text-[#6366F1] font-semibold cursor-default' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
                }`}
                disabled={i === breadcrumbs.length - 1}
              >
                {crumb.name}
              </button>
              {i < breadcrumbs.length - 1 && (
                <span className="text-gray-400 dark:text-slate-600">→</span>
              )}
            </div>
          ))}
          
          {viewState.level !== 'world' && (
            <button
              onClick={navigateUp}
              className="ml-4 px-2 py-1 text-xs bg-gray-200 dark:bg-[#2a3a50] rounded hover:bg-gray-300 dark:hover:bg-[#3a4a60] transition-colors"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Title and Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold">Adventist Pulse Global Map</h1>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              {viewState.level === 'world' && 'Explore 13 world divisions'}
              {viewState.level === 'division' && `${viewState.selectedDivision} - Unions and Conferences`}
              {viewState.level === 'union' && `${viewState.selectedUnion} - Conferences and Missions`}
              {viewState.level === 'conference' && `${viewState.selectedConference} - ${churches.filter(c => c.conference === viewState.selectedConference).length} churches`}
            </p>
          </div>

          {/* Search - only show for churches */}
          {(viewState.level === 'conference' || search) && (
            <div className="flex-1 relative max-w-md">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find a church..."
                className="w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366F1]/50"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                  {searchResults.map((c, i) => (
                    <button key={`${c.name}-${i}`} onClick={() => flyToChurch(c)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-200 dark:border-slate-800/30 last:border-0">
                      <div className="text-sm text-gray-900 dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">{c.suburb}, {c.state}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r border-gray-200 dark:border-[#2a3a50] bg-gray-50 dark:bg-[#1a2332] overflow-y-auto z-10 flex-shrink-0 max-h-full">
          <div className="p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
              {viewState.level === 'world' && 'World Divisions'}
              {viewState.level === 'division' && 'Union Conferences'}
              {viewState.level === 'union' && 'Conferences & Missions'}
              {viewState.level === 'conference' && 'Churches'}
            </h3>
            
            {levelData.map((item: any) => (
              <div key={item.code} className="mb-2 p-2 rounded border border-gray-200 dark:border-[#2a3a50] hover:bg-gray-100 dark:hover:bg-[#2a3a50]/30 transition-colors">
                <div className="flex items-center gap-2">
                  {item.color && (
                    <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{item.code}</div>
                    {item.stats && (
                      <div className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
                        {item.stats.membership?.ending && (
                          <div>{item.stats.membership.ending.toLocaleString()} members</div>
                        )}
                        {item.stats.churches && (
                          <div>{item.stats.churches.toLocaleString()} churches</div>
                        )}
                      </div>
                    )}
                    {item.latestYear && (
                      <div className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
                        {item.latestYear.membership?.ending && (
                          <div>{item.latestYear.membership.ending.toLocaleString()} members</div>
                        )}
                        {item.latestYear.churches && (
                          <div>{item.latestYear.churches.toLocaleString()} churches</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {viewState.level === 'conference' && viewState.selectedConference && (
              <div className="space-y-1">
                {churches
                  .filter(c => c.conference === viewState.selectedConference)
                  .slice(0, 20)
                  .map((church, i) => (
                    <button
                      key={`${church.name}-${i}`}
                      onClick={() => flyToChurch(church)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a3a50]/30 transition-colors"
                    >
                      <div className="text-xs font-medium">{church.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">{church.suburb}</div>
                    </button>
                  ))
                }
                {churches.filter(c => c.conference === viewState.selectedConference).length > 20 && (
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 text-center p-2">
                    ... and {churches.filter(c => c.conference === viewState.selectedConference).length - 20} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-[#1a2332]" 
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </main>
  );
}