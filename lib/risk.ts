// =============================================
// Risk Assessment Engine
// =============================================
// Identifies entities that need urgent attention.
// Framing: "at risk" = needs help, not "failing" = shame.

import type { YearlyStats } from '@/types/pulse';
import type { DerivedMetrics } from './derived';
import { calculateDerived } from './derived';

export type RiskLevel = 'critical' | 'warning' | 'watch' | 'healthy';

export interface RiskFlag {
  category: string;
  label: string;
  detail: string;
  level: RiskLevel;
}

export interface RiskAssessment {
  code: string;
  name: string;
  level: string;
  overallRisk: RiskLevel;
  flags: RiskFlag[];
  metrics: DerivedMetrics;
  latestYear: number;
  consecutiveDeclineYears: number;
  projectedZeroYear: number | null; // year membership hits zero at current trajectory
}

function countConsecutiveDecline(stats: YearlyStats[]): number {
  let count = 0;
  for (let i = stats.length - 1; i >= 0; i--) {
    const rate = stats[i].membership.growthRate;
    if (rate !== null && rate < 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function projectZeroYear(stats: YearlyStats[]): number | null {
  // Use average growth rate of last 5 years
  const recent = stats.slice(-5);
  const rates = recent
    .map(s => s.membership.growthRate)
    .filter((r): r is number => r !== null);

  if (rates.length < 2) return null;

  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  if (avgRate >= 0) return null; // not declining

  const lastMem = stats[stats.length - 1]?.membership.ending;
  const lastYear = stats[stats.length - 1]?.year;
  if (!lastMem || !lastYear) return null;

  // Years until membership hits 0 at current rate
  // M * (1 + r)^n = 0 never happens, so project to <10 members
  const target = 10;
  const yearsToTarget = Math.log(target / lastMem) / Math.log(1 + avgRate / 100);

  if (yearsToTarget > 100) return null; // too far out to be meaningful
  return Math.round(lastYear + yearsToTarget);
}

export function assessRisk(
  code: string,
  name: string,
  entityLevel: string,
  stats: YearlyStats[]
): RiskAssessment {
  const flags: RiskFlag[] = [];

  if (stats.length < 2) {
    return {
      code, name, level: entityLevel,
      overallRisk: 'healthy',
      flags: [{ category: 'Data', label: 'Insufficient Data', detail: 'Less than 2 years of data', level: 'watch' }],
      metrics: calculateDerived(stats[0]),
      latestYear: stats[0]?.year ?? 0,
      consecutiveDeclineYears: 0,
      projectedZeroYear: null,
    };
  }

  const latest = stats[stats.length - 1];
  const prev = stats[stats.length - 2];
  const metrics = calculateDerived(latest, prev);
  const consecutiveDecline = countConsecutiveDecline(stats);
  const zeroYear = projectZeroYear(stats);

  // --- Growth flags ---
  if (metrics.netGrowthRate !== null) {
    if (metrics.netGrowthRate < -3) {
      flags.push({ category: 'Growth', label: 'Severe Decline', detail: `${metrics.netGrowthRate.toFixed(1)}% membership loss`, level: 'critical' });
    } else if (metrics.netGrowthRate < -1) {
      flags.push({ category: 'Growth', label: 'Declining', detail: `${metrics.netGrowthRate.toFixed(1)}% membership loss`, level: 'warning' });
    } else if (metrics.netGrowthRate < 0) {
      flags.push({ category: 'Growth', label: 'Slight Decline', detail: `${metrics.netGrowthRate.toFixed(1)}% membership loss`, level: 'watch' });
    }
  }

  // Consecutive decline
  if (consecutiveDecline >= 5) {
    flags.push({ category: 'Growth', label: 'Prolonged Decline', detail: `${consecutiveDecline} consecutive years of decline`, level: 'critical' });
  } else if (consecutiveDecline >= 3) {
    flags.push({ category: 'Growth', label: 'Multi-Year Decline', detail: `${consecutiveDecline} consecutive years of decline`, level: 'warning' });
  }

  // Extinction projection
  if (zeroYear && zeroYear <= latest.year + 50) {
    flags.push({
      category: 'Growth',
      label: 'Extinction Risk',
      detail: `At current trajectory, membership reaches zero by ~${zeroYear}`,
      level: 'critical',
    });
  }

  // --- Retention flags ---
  if (metrics.retentionRate !== null) {
    if (metrics.retentionRate < 90) {
      flags.push({ category: 'Retention', label: 'Severe Retention Crisis', detail: `Only ${metrics.retentionRate.toFixed(1)}% of members retained`, level: 'critical' });
    } else if (metrics.retentionRate < 95) {
      flags.push({ category: 'Retention', label: 'Retention Concern', detail: `${metrics.retentionRate.toFixed(1)}% retention rate`, level: 'warning' });
    }
  }

  // --- Kingdom growth flags (baptisms + POF) ---
  if (metrics.accessionRate !== null) {
    if (metrics.accessionRate < 1) {
      flags.push({ category: 'Evangelism', label: 'Minimal Kingdom Growth', detail: `Only ${metrics.accessionRate.toFixed(1)}% accession rate (baptisms + POF)`, level: 'critical' });
    } else if (metrics.accessionRate < 2) {
      flags.push({ category: 'Evangelism', label: 'Low Kingdom Growth', detail: `${metrics.accessionRate.toFixed(1)}% accession rate (baptisms + POF)`, level: 'warning' });
    }
  }

  // --- Loss flags ---
  if (metrics.lossRate !== null && metrics.lossRate > 5) {
    flags.push({ category: 'Retention', label: 'High Loss Rate', detail: `${metrics.lossRate.toFixed(1)}% of members lost`, level: 'warning' });
  }

  // --- Determine overall risk ---
  let overallRisk: RiskLevel = 'healthy';
  if (flags.some(f => f.level === 'critical')) overallRisk = 'critical';
  else if (flags.some(f => f.level === 'warning')) overallRisk = 'warning';
  else if (flags.some(f => f.level === 'watch')) overallRisk = 'watch';

  return {
    code, name, level: entityLevel,
    overallRisk,
    flags,
    metrics,
    latestYear: latest.year,
    consecutiveDeclineYears: consecutiveDecline,
    projectedZeroYear: zeroYear,
  };
}
