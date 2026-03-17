// =============================================
// Benchmarking — API-backed
// =============================================

import { apiFetch } from './api';
import type { OrgUnit, QuickStats } from '@/types/pulse';

export interface BenchmarkSuggestion {
  entity: OrgUnit;
  stats: QuickStats;
  reason: string;
  similarity: number;
  category: 'peer' | 'aspiration' | 'similar-size' | 'geographic' | 'trajectory';
}

export async function getBenchmarks(code: string): Promise<BenchmarkSuggestion[]> {
  // Auth-gated endpoint — returns empty for unauthenticated users
  try {
    return await apiFetch<BenchmarkSuggestion[]>(`/entities/${code}/benchmarks`);
  } catch {
    return [];
  }
}

/** @deprecated Use getBenchmarks instead */
export const getBenchmarkSuggestions = getBenchmarks;

export async function getTopBenchmark(code: string): Promise<BenchmarkSuggestion | null> {
  const suggestions = await getBenchmarks(code);
  return suggestions[0] || null;
}
