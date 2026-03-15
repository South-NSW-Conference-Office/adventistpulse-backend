// =============================================
// Adventist Pulse — JSON-backed Data Layer
// =============================================
// Phase 1: reads from normalised JSON export
// Phase 2: swap to MongoDB queries (same interface)

// Conditional imports for server-side only
let fs: any, path: any;
if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

import type {
  OrgUnit,
  EntityLevel,
  YearlyStats,
  EntityWithStats,
  QuickStats,
  RankedEntity,
  RankingMetric,
} from '@/types/pulse';

// ---- Raw shape from exports/entities.json ----
interface RawYearData {
  Year: number;
  Churches?: number | string;
  Companies?: number | string;
  'Beginning Membership'?: number | string;
  Baptisms?: number | string;
  'Former Member Baptisms'?: number | string;
  'Professions of Faith'?: number | string;
  'Transfers In'?: number | string;
  'Transfers Out'?: number | string;
  Deaths?: number | string;
  Dropped?: number | string;
  Missing?: number | string;
  'Total Gains'?: number | string;
  'Total Losses'?: number | string;
  'Net Growth'?: number | string;
  'Ending Membership'?: number | string;
  'Growth Rate'?: number | string;
  'Accession Rate'?: number | string;
  'Ordained Ministers'?: number | string;
  'Licensed Ministers'?: number | string;
  'Licensed Missionaries'?: number | string;
  'Literature Evangelists'?: number | string;
  'Credentialed Missionaries'?: number | string;
  'Total Workers'?: number | string;
  Tithe?: number | string;
  'Per Capita Tithe'?: number | string;
  [key: string]: unknown;
}

interface NormalisedEntity {
  code: string;
  name: string;
  level: EntityLevel;
  parent: string | null;
  years: RawYearData[];
}

type ExportData = Record<string, NormalisedEntity>;

// ---- Helpers ----

function toNum(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v);
  return isNaN(n) ? null : n;
}

// ---- Load and cache ----

let _cache: ExportData | null = null;

function loadData(): ExportData {
  // Server-side only
  if (typeof window !== 'undefined') {
    throw new Error('loadData() can only be called on the server side');
  }
  
  if (_cache) return _cache;
  let filePath = path.join(process.cwd(), 'public', 'data', 'entities.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  _cache = JSON.parse(raw) as ExportData;
  return _cache;
}

// ---- Normalise raw year data ----

function normaliseYear(raw: RawYearData): YearlyStats {
  return {
    year: raw.Year,
    churches: toNum(raw.Churches),
    companies: toNum(raw.Companies),
    membership: {
      beginning: toNum(raw['Beginning Membership']),
      ending: toNum(raw['Ending Membership']),
      baptisms: toNum(raw.Baptisms),
      professionOfFaith: toNum(raw['Professions of Faith']),
      transfersIn: toNum(raw['Transfers In']),
      transfersOut: toNum(raw['Transfers Out']),
      deaths: toNum(raw.Deaths),
      dropped: toNum(raw.Dropped),
      missing: toNum(raw.Missing),
      totalGains: toNum(raw['Total Gains']),
      totalLosses: toNum(raw['Total Losses']),
      netGrowth: toNum(raw['Net Growth']),
      growthRate: toNum(raw['Growth Rate']),
      accessionRate: toNum(raw['Accession Rate']),
    },
    workers: {
      ordainedMinisters: toNum(raw['Ordained Ministers']),
      licensedMinisters: toNum(raw['Licensed Ministers']),
      licensedMissionaries: toNum(raw['Licensed Missionaries']),
      literatureEvangelists: toNum(raw['Literature Evangelists']),
      credentialedMissionaries: toNum(raw['Credentialed Missionaries']),
      totalWorkers: toNum(raw['Total Workers']),
    },
    finance: {
      tithe: toNum(raw.Tithe),
      titheCurrency: 'USD',
      perCapitaTithe: toNum(raw['Per Capita Tithe']),
      offerings: null,
    },
    source: 'adventiststatistics.org',
  };
}

// ---- Public API ----

export function getAllEntities(): EntityWithStats[] {
  const data = loadData();
  return Object.values(data).map(entity => {
    const years = entity.years.map(normaliseYear).sort((a, b) => a.year - b.year);
    const latest = years[years.length - 1] || null;

    return {
      code: entity.code,
      name: entity.name,
      level: entity.level,
      parentCode: entity.parent,
      latestYear: latest,
      yearRange: years.length > 0
        ? { from: years[0].year, to: years[years.length - 1].year }
        : null,
      totalYears: years.length,
    };
  });
}

export function getEntity(code: string): OrgUnit | null {
  const data = loadData();
  const entity = data[code];
  if (!entity) return null;
  return {
    code: entity.code,
    name: entity.name,
    level: entity.level,
    parentCode: entity.parent,
  };
}

export function getEntityStats(code: string, from?: number, to?: number): YearlyStats[] {
  const data = loadData();
  const entity = data[code];
  if (!entity) return [];
  let years = entity.years.map(normaliseYear).sort((a, b) => a.year - b.year);
  if (from) years = years.filter(y => y.year >= from);
  if (to) years = years.filter(y => y.year <= to);
  return years;
}

export function getEntityChildren(code: string): EntityWithStats[] {
  return getAllEntities().filter(e => e.parentCode === code);
}

export function getQuickStats(code: string): QuickStats | null {
  const stats = getEntityStats(code);
  if (stats.length === 0) return null;
  const latest = stats[stats.length - 1];
  return {
    membership: latest.membership.ending,
    churches: latest.churches,
    baptisms: latest.membership.baptisms,
    growthRate: latest.membership.growthRate,
    tithe: latest.finance.tithe,
    workers: latest.workers.totalWorkers,
    year: latest.year,
  };
}

export function getRankings(
  level: EntityLevel,
  metric: RankingMetric,
  year?: number
): RankedEntity[] {
  const entities = getAllEntities().filter(e => e.level === level);

  const ranked = entities
    .map(e => {
      const stats = year
        ? getEntityStats(e.code, year, year)
        : getEntityStats(e.code);
      const latest = year
        ? stats[0]
        : stats[stats.length - 1];

      if (!latest) return null;

      let value: number | null = null;
      switch (metric) {
        case 'membership': value = latest.membership.ending; break;
        case 'baptisms': value = latest.membership.baptisms; break;
        case 'growthRate': value = latest.membership.growthRate; break;
        case 'churches': value = latest.churches; break;
        case 'tithe': value = latest.finance.tithe; break;
        case 'workers': value = latest.workers.totalWorkers; break;
        case 'tithePerCapita':
          value = (latest.finance.tithe && latest.membership.ending)
            ? latest.finance.tithe / latest.membership.ending
            : null;
          break;
        case 'accessions':
          value = (latest.membership.baptisms !== null || latest.membership.professionOfFaith !== null)
            ? (latest.membership.baptisms ?? 0) + (latest.membership.professionOfFaith ?? 0)
            : null;
          break;
      }

      return {
        code: e.code,
        name: e.name,
        level: e.level,
        value,
        rank: 0,
        year: latest.year,
      };
    })
    .filter((e): e is RankedEntity => e !== null && e.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  ranked.forEach((e, i) => { e.rank = i + 1; });
  return ranked;
}

export function getEntitiesByLevel(level: string): EntityWithStats[] {
  if (level === 'conference') {
    return getAllEntities().filter(e => e.level === 'conference' || e.level === 'mission');
  }
  if (level === 'field') {
    return getAllEntities().filter(e => e.level === 'field' || e.level === 'section' || e.level === 'field_station');
  }
  return getAllEntities().filter(e => e.level === level);
}

// ---- Breadcrumb helper ----

export function getBreadcrumbs(code: string): OrgUnit[] {
  const crumbs: OrgUnit[] = [];
  let current = getEntity(code);
  while (current) {
    crumbs.unshift(current);
    current = current.parentCode ? getEntity(current.parentCode) : null;
  }
  return crumbs;
}

// ---- Siblings helper ----

export function getEntitySiblings(code: string): EntityWithStats[] {
  const entity = getEntity(code);
  if (!entity || !entity.parentCode) return [];
  return getAllEntities()
    .filter(e => e.parentCode === entity.parentCode && e.code !== code)
    .sort((a, b) => (b.latestYear?.membership?.ending ?? 0) - (a.latestYear?.membership?.ending ?? 0));
}

// ---- Search helper ----

export function searchEntities(query: string, limit = 10): EntityWithStats[] {
  const q = query.toLowerCase();
  return getAllEntities()
    .filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
    .slice(0, limit);
}

export interface LocalChurch {
  name: string;
  suburb: string;
  state: string;
  address: string;
}

export function getLocalChurches(conferenceCode: string): LocalChurch[] {
  if (typeof window !== 'undefined') return [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'au-churches-geocoded.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return (data.churches || [])
      .filter((c: any) => c.conference === conferenceCode)
      .map((c: any) => ({ name: c.name, suburb: c.suburb || '', state: c.state || '', address: c.address || '' }))
      .sort((a: LocalChurch, b: LocalChurch) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

// ---- Church directory types and helpers ----

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
  // Optional fields merged from directory
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

// ---- Directory types ----

interface DirectoryChurchEntry {
  name: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  pastor?: string;
  services?: {
    sabbath_school?: string;
    divine_service?: string;
    [key: string]: string | undefined;
  };
  contact?: {
    phone?: string;
    email?: string;
    [key: string]: string | undefined;
  };
  website?: string;
  programs?: string[];
  outreach?: string[];
  notes?: string;
  description?: string;
}

interface DirectoryData {
  conferences: Array<{
    conference: string;
    code: string;
    churches: DirectoryChurchEntry[];
  }>;
}

let _directoryCache: Map<string, DirectoryChurchEntry> | null = null;

function loadDirectoryByName(): Map<string, DirectoryChurchEntry> {
  if (typeof window !== 'undefined') return new Map();
  if (_directoryCache) return _directoryCache;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'au-church-directory.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as DirectoryData;
    const map = new Map<string, DirectoryChurchEntry>();
    for (const conf of data.conferences) {
      for (const church of conf.churches) {
        map.set(church.name.toLowerCase().trim(), church);
      }
    }
    _directoryCache = map;
    return _directoryCache;
  } catch {
    return new Map();
  }
}

function mergeDirectoryData(geo: GeocodedChurch, dir: Map<string, DirectoryChurchEntry>): GeocodedChurch {
  const entry = dir.get(geo.name.toLowerCase().trim());
  if (!entry) return geo;
  return {
    ...geo,
    website: entry.website || geo.website,
    pastor: entry.pastor || geo.pastor,
    worshipTime: entry.services?.divine_service || entry.services?.['Church Service'] || entry.services?.['Worship Service'] || entry.services?.['Worship'] || geo.worshipTime,
    sabbathSchoolTime: entry.services?.sabbath_school || entry.services?.['Bible Study'] || entry.services?.['Sabbath School'] || entry.services?.['Bible Class'] || geo.sabbathSchoolTime,
    phone: entry.contact?.phone || geo.phone,
    email: entry.contact?.email || geo.email,
    programs: entry.programs?.length ? entry.programs : geo.programs,
    outreach: entry.outreach?.length ? entry.outreach : geo.outreach,
    description: entry.description || geo.description,
  };
}

// ── Haversine distance ──────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyChurches(slug: string, limit = 3): Array<GeocodedChurch & { distanceKm: number }> {
  const church = getChurchBySlug(slug);
  if (!church || church.lat === null || church.lng === null) return [];
  const churches = getAllChurches();
  return churches
    .filter(c => c.name !== church.name && c.lat !== null && c.lng !== null)
    .map(c => ({ ...c, distanceKm: haversineKm(church.lat!, church.lng!, c.lat!, c.lng!) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function churchNameToSlug(name: string): string {
  return name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let _churchCache: GeocodedChurch[] | null = null;

export function getAllChurches(): GeocodedChurch[] {
  if (typeof window !== 'undefined') return [];
  if (_churchCache) return _churchCache;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'au-churches-geocoded.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const dir = loadDirectoryByName();
    _churchCache = (data.churches || []).map((c: GeocodedChurch) => mergeDirectoryData(c, dir));
    return _churchCache!;
  } catch {
    return [];
  }
}

export function getChurchBySlug(slug: string): GeocodedChurch | null {
  const churches = getAllChurches();
  return churches.find(c => churchNameToSlug(c.name) === slug) ?? null;
}
