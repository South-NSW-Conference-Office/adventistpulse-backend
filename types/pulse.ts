// =============================================
// Adventist Pulse — Core Type Definitions
// =============================================

export type EntityLevel = 'gc' | 'division' | 'union' | 'conference' | 'mission' | 'church' | 'field' | 'section' | 'field_station';

export interface OrgUnit {
  code: string;          // Unique identifier: "SNSW", "AUC", "SPD", "GC"
  name: string;          // Full name: "South NSW Conference"
  level: EntityLevel;
  parentCode: string | null;  // "AUC" for SNSW, null for GC
  metadata?: {
    region?: string;
    country?: string;
    established?: number;
    website?: string;
  };
}

export interface YearlyStats {
  year: number;
  churches: number | null;
  companies: number | null;
  membership: {
    beginning: number | null;
    ending: number | null;
    baptisms: number | null;
    professionOfFaith: number | null;
    transfersIn: number | null;
    transfersOut: number | null;
    deaths: number | null;
    dropped: number | null;
    missing: number | null;
    totalGains: number | null;
    totalLosses: number | null;
    netGrowth: number | null;
    growthRate: number | null;
    accessionRate: number | null;
  };
  workers: {
    ordainedMinisters: number | null;
    licensedMinisters: number | null;
    licensedMissionaries: number | null;
    literatureEvangelists: number | null;
    credentialedMissionaries: number | null;
    totalWorkers: number | null;
  };
  finance: {
    tithe: number | null;
    titheCurrency: string;
    perCapitaTithe: number | null;
    offerings: number | null;
  };
  source: string;
}

export interface EntityWithStats extends OrgUnit {
  latestYear: YearlyStats | null;
  yearRange: { from: number; to: number } | null;
  totalYears: number;
}

export interface EntityDetail extends OrgUnit {
  stats: YearlyStats[];
  children: EntityWithStats[];
}

// QuickStats — the headline numbers shown on every entity page
export interface QuickStats {
  membership: number | null;
  churches: number | null;
  baptisms: number | null;
  growthRate: number | null;
  tithe: number | null;
  workers: number | null;
  year: number;
}

// Rankings
export type RankingMetric = 'membership' | 'baptisms' | 'growthRate' | 'churches' | 'tithe' | 'workers' | 'tithePerCapita' | 'accessions';

export interface RankedEntity {
  code: string;
  name: string;
  level: EntityLevel;
  value: number | null;
  rank: number;
  year: number;
}

// ---- Personnel ----

export interface Person {
  name: string;
  role: string;
  roleCategory: 'administration' | 'department' | 'pastoral' | 'support' | 'education' | 'healthcare';
  entityCode: string;       // which entity they serve
  startDate?: string;       // ISO date or year
  endDate?: string;         // null = current
  credentials?: string;     // ordained, licensed, commissioned, etc.
  source: string;           // 'yearbook' | 'acms' | 'manual'
}

export interface LeadershipRecord {
  code: string;             // entity code
  administration: Person[]; // president, secretary, treasurer
  departments: Person[];    // departmental directors
  pastoral: Person[];       // pastors (church level)
  workers: Person[];        // all other employed staff
  asOf: string;             // date this data reflects
}

// Level hierarchy for navigation
export const LEVEL_HIERARCHY: EntityLevel[] = ['gc', 'division', 'union', 'conference', 'mission', 'church'];

export const LEVEL_LABELS: Record<EntityLevel, string> = {
  gc: 'General Conference',
  division: 'Division',
  union: 'Union',
  conference: 'Conference',
  mission: 'Mission',
  church: 'Church',
  field: 'Field',
  section: 'Section',
  field_station: 'Field Station',
};

export const LEVEL_LABELS_PLURAL: Record<EntityLevel, string> = {
  gc: 'General Conference',
  division: 'Divisions',
  union: 'Unions',
  conference: 'Conferences',
  mission: 'Missions',
  church: 'Churches',
  field: 'Fields',
  section: 'Sections',
  field_station: 'Field Stations',
};
