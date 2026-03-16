// =============================================
// Risk Assessment — API-backed
// =============================================

import { apiFetch } from './api';
import type { DerivedMetrics } from './derived';

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
  projectedZeroYear: number | null;
}

export async function assessRisk(code: string): Promise<RiskAssessment> {
  return apiFetch<RiskAssessment>(`/risk/${code}`);
}

export async function assessRiskBulk(params: { level?: string; parentCode?: string }): Promise<RiskAssessment[]> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<RiskAssessment[]>(`/risk?${qs}`);
}
