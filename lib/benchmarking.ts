import { getEntity, getQuickStats, getAllEntities } from './data';
import type { OrgUnit, QuickStats } from '@/types/pulse';

export interface BenchmarkSuggestion {
  entity: OrgUnit;
  stats: QuickStats;
  reason: string;
  similarity: number; // 0-1 score
  category: 'peer' | 'aspiration' | 'similar-size' | 'geographic' | 'trajectory';
}

/**
 * Smart benchmarking - suggest entities to compare against
 * based on various similarity criteria
 */
export function getBenchmarkSuggestions(entityCode: string): BenchmarkSuggestion[] {
  const entity = getEntity(entityCode);
  const stats = getQuickStats(entityCode);
  
  if (!entity || !stats) return [];

  const allEntities = getAllEntities()
    .filter(e => e.code !== entityCode) // exclude self
    .map(e => ({
      entity: e,
      stats: getQuickStats(e.code),
    }))
    .filter((e): e is { entity: typeof e.entity; stats: NonNullable<typeof e.stats> } => 
      e.stats !== null
    );

  const suggestions: BenchmarkSuggestion[] = [];

  // 1. PEER ENTITIES - same level, similar size (±30%)
  if (stats.membership) {
    const peerRange = {
      min: stats.membership * 0.7,
      max: stats.membership * 1.3,
    };

    const peers = allEntities
      .filter(e => 
        e.entity.level === entity.level &&
        e.stats.membership &&
        e.stats.membership >= peerRange.min &&
        e.stats.membership <= peerRange.max
      )
      .slice(0, 3)
      .map(e => ({
        entity: e.entity,
        stats: e.stats,
        reason: `Similar size peer (${(e.stats.membership! / 1000).toFixed(0)}K members)`,
        similarity: 1 - Math.abs(stats.membership! - e.stats.membership!) / stats.membership!,
        category: 'peer' as const,
      }));

    suggestions.push(...peers);
  }

  // 2. ASPIRATIONAL TARGETS - same level, significantly larger, positive growth
  if (stats.membership) {
    const aspirational = allEntities
      .filter(e => 
        e.entity.level === entity.level &&
        e.stats.membership &&
        stats.membership &&
        e.stats.membership > stats.membership * 1.5 &&
        (e.stats.growthRate || 0) > 0
      )
      .sort((a, b) => (b.stats.growthRate || 0) - (a.stats.growthRate || 0))
      .slice(0, 2)
      .map(e => ({
        entity: e.entity,
        stats: e.stats,
        reason: `Aspirational target (+${((e.stats.growthRate || 0)).toFixed(1)}% growth)`,
        similarity: 0.8,
        category: 'aspiration' as const,
      }));

    suggestions.push(...aspirational);
  }

  // 3. SIMILAR TRAJECTORY - entities with similar growth patterns
  if (stats.growthRate !== null) {
    const trajectoryRange = {
      min: stats.growthRate - 2,
      max: stats.growthRate + 2,
    };

    const similarTrajectory = allEntities
      .filter(e => 
        e.entity.level === entity.level &&
        e.stats.growthRate !== null &&
        e.stats.growthRate >= trajectoryRange.min &&
        e.stats.growthRate <= trajectoryRange.max &&
        e.entity.code !== entityCode
      )
      .slice(0, 2)
      .map(e => ({
        entity: e.entity,
        stats: e.stats,
        reason: `Similar growth pattern (${e.stats.growthRate! > 0 ? '+' : ''}${e.stats.growthRate!.toFixed(1)}%)`,
        similarity: 1 - Math.abs(stats.growthRate! - e.stats.growthRate!) / 10, // normalize to 0-1
        category: 'trajectory' as const,
      }));

    suggestions.push(...similarTrajectory);
  }

  // 4. GEOGRAPHIC NEIGHBORS - same parent entity
  if (entity.parentCode) {
    const siblings = allEntities
      .filter(e => 
        e.entity.parentCode === entity.parentCode &&
        e.entity.code !== entityCode
      )
      .slice(0, 3)
      .map(e => ({
        entity: e.entity,
        stats: e.stats,
        reason: `Geographic neighbor in ${getEntity(entity.parentCode!)?.name || 'same region'}`,
        similarity: 0.7,
        category: 'geographic' as const,
      }));

    suggestions.push(...siblings);
  }

  // 5. SIZE COHORT - entities within 10-50% size range regardless of level
  if (stats.membership) {
    const sizeRange = {
      min: stats.membership * 1.1, // slightly larger
      max: stats.membership * 5,   // up to 5x larger
    };

    const sizeCohort = allEntities
      .filter(e => 
        e.stats.membership &&
        stats.membership &&
        e.stats.membership >= sizeRange.min &&
        e.stats.membership <= sizeRange.max &&
        e.entity.level !== entity.level // different level for context
      )
      .slice(0, 2)
      .map(e => ({
        entity: e.entity,
        stats: e.stats,
        reason: `Similar scale (${e.entity.level}, ${(e.stats.membership! / 1000).toFixed(0)}K members)`,
        similarity: 1 - Math.abs(stats.membership! - e.stats.membership!) / Math.max(stats.membership!, e.stats.membership!),
        category: 'similar-size' as const,
      }));

    suggestions.push(...sizeCohort);
  }

  // Remove duplicates and sort by similarity + category priority
  const unique = suggestions
    .filter((item, index, arr) => 
      arr.findIndex(other => other.entity.code === item.entity.code) === index
    )
    .sort((a, b) => {
      const categoryPriority = { peer: 4, aspiration: 3, trajectory: 2, geographic: 1, 'similar-size': 0 };
      const aPriority = categoryPriority[a.category];
      const bPriority = categoryPriority[b.category];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.similarity - a.similarity;
    })
    .slice(0, 6); // max 6 suggestions

  return unique;
}

/**
 * Get the most relevant comparison for quick access
 */
export function getTopBenchmark(entityCode: string): BenchmarkSuggestion | null {
  const suggestions = getBenchmarkSuggestions(entityCode);
  return suggestions[0] || null;
}