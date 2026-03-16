// =============================================
// Derived Metrics — Read from pre-computed API data
// =============================================
// The backend now computes all derived fields on YearlyStats.
// This file provides types and accessor helpers only.

import type { YearlyStats } from '@/types/pulse';

export interface DerivedMetrics {
  // Retention
  retentionRate: number | null;
  dropoutRate: number | null;

  // Kingdom Growth
  accessionRate: number | null;
  accessionEfficiency: number | null;
  totalAccessions: number | null;

  // Workforce
  membersPerWorker: number | null;
  membersPerChurch: number | null;
  membersPerPastor: number | null;

  // Financial Health
  tithePerCapita: number | null;
  titheGrowthRate: number | null;

  // Growth Quality
  netGrowthRate: number | null;
  organicGrowthRate: number | null;
  transferBalance: number | null;
  lossRate: number | null;
}

/**
 * Read derived metrics from a pre-computed stat object.
 * The backend stores these fields directly on YearlyStats.derived / top-level.
 */
export function getDerivedStats(stat: YearlyStats & { derived?: Partial<DerivedMetrics> }): DerivedMetrics {
  const d = stat.derived ?? {};
  const mem = stat.membership;
  return {
    retentionRate: d.retentionRate ?? null,
    dropoutRate: d.dropoutRate ?? null,
    accessionRate: mem.accessionRate ?? d.accessionRate ?? null,
    accessionEfficiency: d.accessionEfficiency ?? null,
    totalAccessions: d.totalAccessions ?? null,
    membersPerWorker: d.membersPerWorker ?? null,
    membersPerChurch: d.membersPerChurch ?? null,
    membersPerPastor: d.membersPerPastor ?? null,
    tithePerCapita: d.tithePerCapita ?? null,
    titheGrowthRate: d.titheGrowthRate ?? null,
    netGrowthRate: mem.growthRate ?? d.netGrowthRate ?? null,
    organicGrowthRate: d.organicGrowthRate ?? null,
    transferBalance: d.transferBalance ?? null,
    lossRate: d.lossRate ?? null,
  };
}

/** @deprecated Use getDerivedStats instead — reads pre-computed values from the API */
export const calculateDerived = getDerivedStats;

/**
 * Read derived metrics for multiple years.
 */
export function getDerivedStatsSeries(stats: (YearlyStats & { derived?: Partial<DerivedMetrics> })[]): { year: number; metrics: DerivedMetrics }[] {
  return stats.map(s => ({
    year: s.year,
    metrics: getDerivedStats(s),
  }));
}

/** @deprecated Use getDerivedStatsSeries instead */
export const calculateDerivedSeries = getDerivedStatsSeries;
