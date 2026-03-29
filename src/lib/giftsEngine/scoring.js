/**
 * Spiritual Gifts Scoring Engine — denomination-agnostic
 *
 * Pure functions: no DB access, no side effects.
 */

/**
 * Score an assessment from raw responses.
 *
 * @param {Array<{questionId: string, giftId: string, score: number}>} responses
 * @param {Array<{id: string}>} giftDefinitions - the gift set used for this version
 * @returns {Array<{giftId: string, totalScore: number, averageScore: number, rank: number}>}
 *   Sorted by totalScore descending (rank 1 = highest).
 */
export function scoreAssessment(responses, giftDefinitions) {
  // Accumulate scores per gift
  const giftMap = new Map()
  for (const gift of giftDefinitions) {
    giftMap.set(gift.id, { total: 0, count: 0 })
  }

  for (const r of responses) {
    const entry = giftMap.get(r.giftId)
    if (!entry) continue // skip responses for gifts not in this version
    entry.total += r.score
    entry.count += 1
  }

  // Build scored array
  const scored = []
  for (const [giftId, { total, count }] of giftMap) {
    scored.push({
      giftId,
      totalScore: total,
      averageScore: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
    })
  }

  // Sort descending by totalScore, then alphabetically by giftId for determinism
  scored.sort((a, b) => b.totalScore - a.totalScore || a.giftId.localeCompare(b.giftId))

  // Assign rank (1-based)
  scored.forEach((item, i) => { item.rank = i + 1 })

  return scored
}

/**
 * Extract the top N gifts from a scored result set.
 *
 * @param {Array} scoredGifts - output of scoreAssessment()
 * @param {number} n - how many top gifts to return (default 3)
 * @returns {Array} first n items
 */
export function getTopGifts(scoredGifts, n = 3) {
  return scoredGifts.slice(0, n)
}

/**
 * Build ministry recommendations from top gifts and a ministry map.
 *
 * @param {Array<{giftId: string}>} topGifts - typically the top 3
 * @param {Object} ministryMap - giftId → {sdaMinistries: string[]} or similar
 * @returns {string[]} deduplicated ministry recommendations
 */
export function getMinistryRecommendations(topGifts, ministryMap) {
  const seen = new Set()
  const recommendations = []

  for (const gift of topGifts) {
    const mapping = ministryMap[gift.giftId]
    if (!mapping) continue
    const ministries = mapping.sdaMinistries ?? mapping.ministryAreas ?? []
    for (const m of ministries) {
      if (!seen.has(m)) {
        seen.add(m)
        recommendations.push(m)
      }
    }
  }

  return recommendations
}
