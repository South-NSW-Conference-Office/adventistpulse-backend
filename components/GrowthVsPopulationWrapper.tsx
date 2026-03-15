'use client';

import { GrowthVsPopulation } from './GrowthVsPopulation';
import type { YearlyStats } from '@/types/pulse';

interface Props {
  entityName: string;
  stats: YearlyStats[];
  populationLabel?: string;
}

/**
 * Template wrapper that converts any entity's YearlyStats into
 * the format GrowthVsPopulation expects. Population data is
 * optional — chart renders membership-only when unavailable.
 */
export function GrowthVsPopulationWrapper({ entityName, stats, populationLabel }: Props) {
  if (!stats || stats.length < 2) return null;

  const data = stats
    .filter(y => (y.membership.ending ?? 0) > 0)
    .sort((a, b) => a.year - b.year)
    .map(y => ({
      year: y.year,
      membership: Number(y.membership.ending) || 0,
      population: 0,
      membershipPct: 0,
    }));

  if (data.length < 2) return null;

  return (
    <GrowthVsPopulation
      entityName={entityName}
      data={data}
      membershipLabel="Adventist Membership"
      populationLabel={populationLabel || ''}
    />
  );
}
