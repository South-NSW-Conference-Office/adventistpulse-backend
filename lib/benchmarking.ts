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
  return apiFetch<BenchmarkSuggestion[]>(`/api/entities/${code}/benchmarks`);
}

/** @deprecated Use getBenchmarks instead */
export const getBenchmarkSuggestions = getBenchmarks;

export async function getTopBenchmark(code: string): Promise<BenchmarkSuggestion | null> {
  const suggestions = await getBenchmarks(code);
  return suggestions[0] || null;
}
