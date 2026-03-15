// =============================================
// Derived Metrics — Calculated from raw stats
// =============================================
// These are the insights that make Pulse valuable.
// Raw data is just numbers. Derived metrics tell the story.

import type { YearlyStats } from '@/types/pulse';

export interface DerivedMetrics {
  // Retention
  retentionRate: number | null;       // % of members retained year-over-year
  dropoutRate: number | null;         // % lost to dropped + missing

  // Kingdom Growth (Baptisms + Profession of Faith — not transfers)
  accessionRate: number | null;       // (baptisms + POF) per 100 members
  accessionEfficiency: number | null; // (baptisms + POF) per worker
  totalAccessions: number | null;     // raw count of baptisms + POF

  // Workforce
  membersPerWorker: number | null;    // how stretched is the workforce?
  membersPerChurch: number | null;    // average church size
  membersPerPastor: number | null;    // ordained ministers only

  // Financial Health
  tithePerCapita: number | null;      // tithe per member
  titheGrowthRate: number | null;     // YoY tithe change %

  // Growth Quality
  netGrowthRate: number | null;       // overall growth %
  organicGrowthRate: number | null;   // baptisms only (no transfers)
  transferBalance: number | null;     // transfers in minus transfers out
  lossRate: number | null;            // total losses per 100 members
}

export function calculateDerived(current: YearlyStats, previous?: YearlyStats): DerivedMetrics {
  const mem = current.membership;
  const fin = current.finance;
  const wrk = current.workers;

  // Retention rate: 1 - (dropped + missing) / beginning membership
  const retentionRate = mem.beginning && (mem.dropped !== null || mem.missing !== null)
    ? (1 - ((mem.dropped ?? 0) + (mem.missing ?? 0)) / mem.beginning) * 100
    : null;

  const dropoutRate = mem.beginning && (mem.dropped !== null || mem.missing !== null)
    ? (((mem.dropped ?? 0) + (mem.missing ?? 0)) / mem.beginning) * 100
    : null;

  // Kingdom growth: baptisms + profession of faith (not transfers — those are zero-sum)
  const totalAccessions = (mem.baptisms !== null || mem.professionOfFaith !== null)
    ? (mem.baptisms ?? 0) + (mem.professionOfFaith ?? 0)
    : null;

  const accessionRate = mem.beginning && totalAccessions !== null
    ? (totalAccessions / mem.beginning) * 100
    : null;

  const accessionEfficiency = wrk.totalWorkers && totalAccessions !== null
    ? totalAccessions / wrk.totalWorkers
    : null;

  // Workforce ratios
  const membersPerWorker = wrk.totalWorkers && mem.ending
    ? mem.ending / wrk.totalWorkers
    : null;

  const membersPerChurch = current.churches && mem.ending
    ? mem.ending / current.churches
    : null;

  const membersPerPastor = wrk.ordainedMinisters && mem.ending
    ? mem.ending / wrk.ordainedMinisters
    : null;

  // Financial
  const tithePerCapita = mem.ending && fin.tithe
    ? fin.tithe / mem.ending
    : null;

  const titheGrowthRate = previous?.finance?.tithe && fin.tithe
    ? ((fin.tithe - previous.finance.tithe) / previous.finance.tithe) * 100
    : null;

  // Growth quality
  const netGrowthRate = mem.growthRate;

  const organicGrowthRate = mem.beginning && mem.baptisms !== null && (mem.professionOfFaith !== null)
    ? (((mem.baptisms ?? 0) + (mem.professionOfFaith ?? 0)) / mem.beginning) * 100
    : null;

  const transferBalance = (mem.transfersIn !== null && mem.transfersOut !== null)
    ? (mem.transfersIn ?? 0) - (mem.transfersOut ?? 0)
    : null;

  const lossRate = mem.beginning && mem.totalLosses !== null
    ? (Math.abs(mem.totalLosses) / mem.beginning) * 100
    : null;

  return {
    retentionRate,
    dropoutRate,
    accessionRate,
    accessionEfficiency,
    totalAccessions,
    membersPerWorker,
    membersPerChurch,
    membersPerPastor,
    tithePerCapita,
    titheGrowthRate,
    netGrowthRate,
    organicGrowthRate,
    transferBalance,
    lossRate,
  };
}

// Calculate for multiple years
export function calculateDerivedSeries(stats: YearlyStats[]): { year: number; metrics: DerivedMetrics }[] {
  return stats.map((s, i) => ({
    year: s.year,
    metrics: calculateDerived(s, i > 0 ? stats[i - 1] : undefined),
  }));
}
