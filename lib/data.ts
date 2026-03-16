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
  const params = new URLSearchParams({ entityCode: code });
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  return apiFetchList<YearlyStats>(`/stats?${params}`);
}

export async function getEntityChildren(code: string): Promise<EntityWithStats[]> {
  return apiFetchList<EntityWithStats>(`/entities/${code}/children`);
}

export async function getEntitySiblings(code: string): Promise<EntityWithStats[]> {
  return apiFetchList<EntityWithStats>(`/entities/${code}/siblings`);
}

export async function searchEntities(query: string, limit = 10): Promise<EntityWithStats[]> {
  return apiFetchList<EntityWithStats>(`/entities/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getBreadcrumbs(code: string): Promise<OrgUnit[]> {
  return apiFetch<OrgUnit[]>(`/entities/${code}/breadcrumbs`);
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
}

export interface LocalChurch {
  name: string;
  suburb: string;
  state: string;
  address: string;
}

export async function getLocalChurches(conferenceCode: string): Promise<LocalChurch[]> {
  try {
    return await apiFetch<LocalChurch[]>(`/entities/${conferenceCode}/churches`);
  } catch {
    return [];
  }
}

export async function getAllChurches(): Promise<GeocodedChurch[]> {
  try {
    return await apiFetch<GeocodedChurch[]>('/api/churches');
  } catch {
    return [];
  }
}

export async function getChurchBySlug(slug: string): Promise<GeocodedChurch | null> {
  try {
    return await apiFetch<GeocodedChurch>(`/api/churches/${slug}`);
  } catch {
    return null;
  }
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
    return await apiFetch<Array<GeocodedChurch & { distanceKm: number }>>(`/api/churches/${slug}/nearby?limit=${limit}`);
  } catch {
    return [];
  }
}
