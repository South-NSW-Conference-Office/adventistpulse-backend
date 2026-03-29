/**
 * Spiritual Gifts Scoring Engine — denomination-agnostic
 *
 * Pure functions: no DB access, no side effects.
 *
 * Adaptive two-phase functions: scorePhase1, getPhase2Candidates, scorePhase2, scoreFinal
 * Legacy single-phase function: scoreAssessment (kept for backward compat)
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
 * @returns {string[]} deduplicated ministry recommendations, top 5
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

  return recommendations.slice(0, 5)
}

// ─── Adaptive Two-Phase Scoring Functions ─────────────────────────────────────

/**
 * Score Phase 1 (screening / anchor questions).
 *
 * @param {Array<{questionId: string, score: number}>} responses - 22 anchor responses
 * @param {Array<{id: string, giftId: string, phase: string}>} questions - full question list
 * @returns {Array<{giftId: string, anchorScore: number, rank: number}>} sorted desc by anchorScore
 */
export function scorePhase1(responses, questions) {
  const questionMap = new Map(questions.map(q => [q.id, q]))
  const giftScores = new Map()

  for (const r of responses) {
    const q = questionMap.get(r.questionId)
    if (!q || q.phase !== 'screening') continue
    // No reverse scoring in Phase 1 — all anchors are forward-scored
    giftScores.set(q.giftId, r.score)
  }

  const result = []
  for (const [giftId, anchorScore] of giftScores) {
    result.push({ giftId, anchorScore })
  }

  // Sort descending by anchorScore, then alphabetically for determinism
  result.sort((a, b) => b.anchorScore - a.anchorScore || a.giftId.localeCompare(b.giftId))
  result.forEach((item, i) => { item.rank = i + 1 })

  return result
}

/**
 * Select Phase 2 candidate gifts from Phase 1 ranked scores.
 *
 * Standard rule: top 5 gifts.
 * Early-exit rule: if gap between rank 3 and rank 4 is ≥ 1.5, select only top 3.
 *
 * @param {Array<{giftId: string, anchorScore: number, rank: number}>} phase1Scores - sorted desc
 * @param {number} maxCandidates - default 5
 * @returns {string[]} candidate giftIds
 */
export function getPhase2Candidates(phase1Scores, maxCandidates = 5) {
  if (phase1Scores.length <= 3) {
    return phase1Scores.map(s => s.giftId)
  }

  const rank3Score = phase1Scores[2]?.anchorScore ?? 0
  const rank4Score = phase1Scores[3]?.anchorScore ?? 0
  const gap = rank3Score - rank4Score

  if (gap >= 1.5) {
    // Early-exit: top 3 are clearly dominant
    return phase1Scores.slice(0, 3).map(s => s.giftId)
  }

  return phase1Scores.slice(0, maxCandidates).map(s => s.giftId)
}

/**
 * Score Phase 2 (deep-dive questions).
 * Applies reverse scoring where q.reverse === true: effectiveScore = 6 - rawScore.
 *
 * @param {Array<{questionId: string, score: number}>} responses - deep question responses
 * @param {Array<{id: string, giftId: string, phase: string, reverse: boolean}>} questions
 * @returns {Array<{giftId: string, deepScore: number, deepAverage: number}>}
 */
export function scorePhase2(responses, questions) {
  const questionMap = new Map(questions.map(q => [q.id, q]))
  const giftData = new Map() // giftId → { scores: number[] }

  for (const r of responses) {
    const q = questionMap.get(r.questionId)
    if (!q || q.phase !== 'deep') continue

    const effectiveScore = q.reverse ? (6 - r.score) : r.score

    if (!giftData.has(q.giftId)) giftData.set(q.giftId, { scores: [] })
    giftData.get(q.giftId).scores.push(effectiveScore)
  }

  const result = []
  for (const [giftId, { scores }] of giftData) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const deepScore = Math.round(avg * 100) / 100
    result.push({ giftId, deepScore, deepAverage: deepScore })
  }

  return result
}

/**
 * Combine Phase 1 and Phase 2 into a final ranked score for all gifts.
 *
 * For candidate gifts (in phase2): finalScore = (anchorScore × 0.3) + (deepScore × 0.7)
 * For non-candidate gifts: finalScore = anchorScore, confidence = 'indicative'
 *
 * @param {Array<{giftId: string, anchorScore: number}>} phase1Scores
 * @param {Array<{giftId: string, deepScore: number}>} phase2Scores
 * @param {string[]} allGiftIds - all gift IDs for this version
 * @returns {Array<{giftId, finalScore, confidence: 'high'|'indicative', anchorScore, deepScore, rank}>}
 *   sorted by finalScore desc
 */
export function scoreFinal(phase1Scores, phase2Scores, allGiftIds) {
  const phase1Map = new Map(phase1Scores.map(s => [s.giftId, s.anchorScore]))
  const phase2Map = new Map(phase2Scores.map(s => [s.giftId, s]))

  const result = []

  for (const giftId of allGiftIds) {
    const anchorScore = phase1Map.get(giftId) ?? 0
    const phase2Data = phase2Map.get(giftId)

    if (phase2Data) {
      const finalScore = Math.round(((anchorScore * 0.3) + (phase2Data.deepScore * 0.7)) * 100) / 100
      result.push({
        giftId,
        finalScore,
        confidence: 'high',
        anchorScore,
        deepScore: phase2Data.deepScore,
      })
    } else {
      result.push({
        giftId,
        finalScore: anchorScore,
        confidence: 'indicative',
        anchorScore,
        deepScore: null,
      })
    }
  }

  // Sort descending by finalScore, then alphabetically for determinism
  result.sort((a, b) => b.finalScore - a.finalScore || a.giftId.localeCompare(b.giftId))
  result.forEach((item, i) => { item.rank = i + 1 })

  return result
}
