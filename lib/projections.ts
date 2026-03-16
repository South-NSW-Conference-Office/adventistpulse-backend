// =============================================
// Projections — API-backed
// =============================================

import { apiFetch } from './api';

export interface ProjectionPoint {
  year: number;
  current: number;
  moderate: number;
  revival: number;
}

export interface ScenarioContext {
  label: string;
  rate: number;
  description: string;
  actions: string[];
  vitalSignsAnchor: string;
}

export interface CriticalMilestone {
  threshold: number;
  year: number;
  label: string;
  yearsFromNow: number;
}

export interface ProjectionResult {
  points5: ProjectionPoint[];
  points20: ProjectionPoint[];
  points50: ProjectionPoint[];
  extinctionYear: number | null;
  milestones: CriticalMilestone[];
  currentRate: number;
  moderateRate: number;
  revivalRate: number;
  scenarios: {
    current: ScenarioContext;
    moderate: ScenarioContext;
    revival: ScenarioContext;
  };
  insights: string[];
}

export async function getProjections(code: string): Promise<ProjectionResult> {
  return apiFetch<ProjectionResult>(`/stats/${code}/projections`);
}

/** @deprecated Use getProjections instead — fetches pre-computed projections from the API */
export async function generateProjections(_stats: unknown): Promise<ProjectionResult> {
  throw new Error('generateProjections is removed — use getProjections(code) instead');
}
