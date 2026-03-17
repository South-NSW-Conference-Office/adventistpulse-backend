// =============================================
// Pulse Score — API-backed
// =============================================

import { apiFetch } from './api';

export interface ScoreComponent {
  category: string;
  weight: number;
  score: number | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '—';
  available: boolean;
  factors: { label: string; value: string; status: 'good' | 'warning' | 'danger' | 'neutral' }[];
  description: string;
}

export interface PulseScore {
  overall: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F' | '—';
  dataCompleteness: number;
  components: ScoreComponent[];
  missingData: string[];
}

export async function getPulseScore(code: string, year?: number): Promise<PulseScore> {
  const qs = year ? `?year=${year}` : '';
  return apiFetch<PulseScore>(`/pulse/${code}${qs}`);
}

export async function getPulseScoreBulk(params: { level?: string; parentCode?: string; year?: number }): Promise<PulseScore[]> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<PulseScore[]>(`/pulse?${qs}`);
}

/** @deprecated Use getPulseScore instead — fetches pre-computed score from the API */
export async function calculatePulseScore(_metrics: unknown): Promise<PulseScore> {
  throw new Error('calculatePulseScore is removed — use getPulseScore(code) instead');
}

// Pure presentation helpers
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#10b981';
    case 'B': return '#6366F1';
    case 'C': return '#f59e0b';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function getGradeBg(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'B': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'C': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'D': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'F': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}
