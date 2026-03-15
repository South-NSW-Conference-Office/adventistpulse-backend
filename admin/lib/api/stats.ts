import { apiClient } from "./client";

// ─── Map data types ──────────────────────────────────────────────────────────

export interface MapDataRow {
  country:    string;
  status:     "thriving" | "watch" | "at-risk" | "critical" | "unknown";
  membership: number;
  growthRate: number | null;
  entityName: string;
  entityCode: string;
  level:      string;
}

export interface CountryTrendRow {
  year:  number;
  value: number;
}

export interface CountrySummary {
  country:     string;
  year:        number;
  membership:  number;
  baptisms:    number;
  netGrowth:   number;
  tithe:       number;
  entityCount: number;
  status:      string;
}

export async function getMapData(
  year: number,
  accessToken: string
): Promise<MapDataRow[]> {
  const res = await apiClient<{ data: MapDataRow[] }>(
    `/api/v1/stats/map-data?year=${year}`,
    { accessToken }
  );
  return res.data;
}

export async function getCountryTrend(params: {
  country:      string;
  metric?:      string;
  lookback?:    number;
  accessToken:  string;
}): Promise<CountryTrendRow[]> {
  const qs = new URLSearchParams({
    country: params.country,
    ...(params.metric   ? { metric:   params.metric }            : {}),
    ...(params.lookback ? { lookback: String(params.lookback) }  : {}),
  });
  const res = await apiClient<{ data: CountryTrendRow[] }>(
    `/api/v1/stats/country-trend?${qs}`,
    { accessToken: params.accessToken }
  );
  return res.data;
}

export async function getCountrySummary(params: {
  country:     string;
  year:        number;
  accessToken: string;
}): Promise<CountrySummary> {
  const qs = new URLSearchParams({
    country: params.country,
    year:    String(params.year),
  });
  const res = await apiClient<{ data: CountrySummary }>(
    `/api/v1/stats/country-summary?${qs}`,
    { accessToken: params.accessToken }
  );
  return res.data;
}

// ─── Country rankings types ──────────────────────────────────────────────────

export interface CountryRankingRow {
  country:     string;
  value:       number;
  entityCount: number;
}

export type CountryRankingMetric = "membership" | "baptisms" | "tithe" | "churches";

export interface CountryRankingsParams {
  year:    number;
  metric?: CountryRankingMetric;
  level?:  "gc" | "division" | "union" | "conference" | "church";
  limit?:  number;
  accessToken: string;
}

export async function getCountryRankings({
  year,
  metric = "membership",
  level,
  limit = 5,
  accessToken,
}: CountryRankingsParams): Promise<CountryRankingRow[]> {
  const params = new URLSearchParams({
    year:   String(year),
    metric,
    limit:  String(limit),
    ...(level ? { level } : {}),
  });

  const res = await apiClient<{ data: CountryRankingRow[] }>(
    `/api/v1/stats/country-rankings?${params}`,
    { accessToken }
  );
  return res.data;
}
