// =============================================
// Adventist Pulse — API-backed Data Layer
// =============================================
// All data fetched from Express backend.

import { apiFetch, apiFetchList } from './api';
import type {
  OrgUnit,
  EntityLevel,
  YearlyStats,
  EntityWithStats,
  QuickStats,
  RankedEntity,
  RankingMetric,
} from '@/types/pulse';

// ---- Public API ----

export async function getAllEntities(): Promise<EntityWithStats[]> {
  return apiFetchList<EntityWithStats>('/entities');
}

export async function getEntity(code: string): Promise<OrgUnit | null> {
  try {
    return await apiFetch<OrgUnit>(`/entities/${code}`);
  } catch {
    return null;
  }
}

export async function getEntityStats(code: string, from?: number, to?: number): Promise<YearlyStats[]> {
  try {
    const params = new URLSearchParams();
    if (from) params.set('from', String(from));
    if (to) params.set('to', String(to));
    const qs = params.toString() ? `?${params}` : '';
    return await apiFetchList<YearlyStats>(`/stats/entity/${code}${qs}`);
  } catch {
    return [];
  }
}

export async function getEntityChildren(code: string): Promise<EntityWithStats[]> {
  try {
    return await apiFetchList<EntityWithStats>(`/entities/${code}/children`);
  } catch {
    return [];
  }
}

export async function getEntitySiblings(code: string): Promise<EntityWithStats[]> {
  try {
    return await apiFetchList<EntityWithStats>(`/entities/${code}/siblings`);
  } catch {
    return [];
  }
}

export async function searchEntities(query: string, limit = 10): Promise<EntityWithStats[]> {
  return apiFetchList<EntityWithStats>(`/entities/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getBreadcrumbs(code: string): Promise<OrgUnit[]> {
  try {
    return await apiFetch<OrgUnit[]>(`/entities/${code}/breadcrumbs`);
  } catch {
    return [];
  }
}

export async function getQuickStats(code: string): Promise<QuickStats | null> {
  try {
    const entity = await apiFetch<EntityWithStats>(`/entities/${code}`);
    if (!entity.latestYear) return null;
    const latest = entity.latestYear;
    return {
      membership: latest.membership.ending,
      churches: latest.churches,
      baptisms: latest.membership.baptisms,
      growthRate: latest.membership.growthRate,
      tithe: latest.finance.tithe,
      workers: latest.workers.totalWorkers,
      year: latest.year,
    };
  } catch {
    return null;
  }
}

export async function getRankings(
  level: EntityLevel,
  metric: RankingMetric,
  year?: number,
): Promise<RankedEntity[]> {
  const params = new URLSearchParams({ level, metric });
  if (year) params.set('year', String(year));
  return apiFetchList<RankedEntity>(`/stats/rankings?${params}`);
}

export async function getEntitiesByLevel(level: string): Promise<EntityWithStats[]> {
  const params = new URLSearchParams({ level });
  return apiFetchList<EntityWithStats>(`/entities?${params}`);
}

export async function getMapData(year?: number): Promise<unknown> {
  const params = year ? `?year=${year}` : '';
  return apiFetch(`/stats/map${params}`);
}

export async function getCountryTrend(country: string, metric: string, lookback?: number): Promise<unknown> {
  const params = new URLSearchParams({ country, metric });
  if (lookback) params.set('lookback', String(lookback));
  return apiFetch(`/stats/country-trend?${params}`);
}

export async function getCountrySummary(country: string, year?: number): Promise<unknown> {
  const params = new URLSearchParams({ country });
  if (year) params.set('year', String(year));
  return apiFetch(`/stats/country-summary?${params}`);
}

// ---- Church types and helpers ----

export interface GeocodedChurch {
  name: string;
  conference: string;
  conferenceName: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  website?: string;
  phone?: string;
  email?: string;
  pastor?: string;
  worshipTime?: string;
  sabbathSchoolTime?: string;
  programs?: string[];
  outreach?: string[];
  description?: string;
  slug?: string;
  code?: string;
  // Youth pipeline fields (contributed by churches)
  memberCount?: number;
  adventurerCount?: number;
  pathfinderCount?: number;
  youthCount?: number;
}

export interface LocalChurch {
  name: string;
  suburb: string;
  state: string;
  address: string;
}

export async function getLocalChurches(conferenceCode: string): Promise<LocalChurch[]> {
  try {
    return await apiFetchList<LocalChurch>(`/entities/${conferenceCode}/children`);
  } catch {
    return [];
  }
}

export async function getAllChurches(): Promise<GeocodedChurch[]> {
  try {
    // Fetch churches via entity list (level=church)
    const results = await apiFetchList<any>('/entities?level=church&limit=2000');
    return results.map(entityToChurch);
  } catch {
    return [];
  }
}

export async function getChurchBySlug(slug: string): Promise<GeocodedChurch | null> {
  try {
    // Convert slug back to search terms (e.g. "canberra-national" → "canberra national")
    const searchTerm = slug.replace(/-/g, ' ');
    const results = await apiFetchList<any>(`/entities/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
    // Find the best match — prefer exact slug match
    const match = results.find((r: any) =>
      r.slug === slug ||
      churchNameToSlug(r.name) === slug
    );
    return match ? entityToChurch(match) : null;
  } catch {
    return null;
  }
}

/** Map a backend Entity to the GeocodedChurch shape used by the church page */
function entityToChurch(e: any): GeocodedChurch {
  return {
    name: e.name ?? '',
    conference: e.parentCode ?? '',
    conferenceName: e.conferenceName ?? '',
    address: e.address ?? '',
    suburb: e.suburb ?? '',
    state: e.state ?? '',
    postcode: e.postcode ?? '',
    lat: e.lat ?? e.location?.coordinates?.[1] ?? null,
    lng: e.lng ?? e.location?.coordinates?.[0] ?? null,
    website: e.website ?? undefined,
    phone: e.phone ?? undefined,
    email: e.email ?? undefined,
    pastor: e.pastor ?? undefined,
    worshipTime: e.worshipTime ?? undefined,
    sabbathSchoolTime: e.sabbathSchoolTime ?? undefined,
    programs: e.programs ?? [],
    outreach: e.outreach ?? [],
    description: e.description ?? undefined,
    slug: e.slug ?? undefined,
    code: e.code ?? undefined,
  };
}

export function churchNameToSlug(name: string): string {
  return name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getNearbyChurches(slug: string, limit = 3): Promise<Array<GeocodedChurch & { distanceKm: number }>> {
  try {
    // Find church code first, then use /nearby endpoint
    const church = await getChurchBySlug(slug) as any;
    if (!church?.code) return [];
    const results = await apiFetchList<any>(`/entities/${church.code}/nearby?limit=${limit}`);
    return results.map((r: any) => ({ ...entityToChurch(r), distanceKm: r.distanceKm ?? 0 }));
  } catch {
    return [];
  }
}
