import { entityRepository } from '../repositories/entity.repository.js'
import { statsRepository } from '../repositories/stats.repository.js'
import { AppError, NotFoundError } from '../core/errors/index.js'
import { getPaginationParams } from '../lib/paginate.js'

class EntityService {
  async list(query) {
    const { page, limit, skip } = getPaginationParams(query)
    const filter = {}
    if (query.level)      filter.level = query.level
    if (query.parentCode) filter.parentCode = query.parentCode.toUpperCase()

    const { data, total } = await entityRepository.paginate(filter, { page, limit })
    const codes      = data.map(e => e.code)
    const [latestStats, yearRanges] = await Promise.all([
      statsRepository.findLatestForEntities(codes),
      statsRepository.findYearRangesForEntities(codes),
    ])
    const statsMap    = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))
    const yearRangeMap = Object.fromEntries(yearRanges.map(r => [r._id, { from: r.minYear, to: r.maxYear }]))

    return {
      data: data.map(entity => ({
        ...entity,
        latestYear: statsMap[entity.code] ?? null,
        yearRange:  yearRangeMap[entity.code] ?? null,
      })),
      total, page, limit,
    }
  }

  async getByCode(code) {
    const entity     = await entityRepository.findByCodeOrFail(code)
    const latestStats = await statsRepository.findLatestForEntity(code)
    return { ...entity, latestYear: latestStats ?? null }
  }

  async getChildren(code) {
    await entityRepository.findByCodeOrFail(code)
    const children   = await entityRepository.findChildren(code)
    const codes      = children.map(c => c.code)
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap   = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))
    return children.map(c => ({ ...c, latestYear: statsMap[c.code] ?? null }))
  }

  async create(data) {
    const exists = await entityRepository.existsByCode(data.code)
    if (exists) throw new AppError(`Entity with code '${data.code}' already exists`, { code: 'ENTITY_CODE_TAKEN', statusCode: 409 })

    // Validate parentCode points to a real entity
    if (data.parentCode) {
      const parent = await entityRepository.findByCode(data.parentCode)
      if (!parent) throw new NotFoundError(`Parent entity '${data.parentCode}'`)
    }

    return entityRepository.create(data)
  }

  async update(code, data) {
    const entity = await entityRepository.findByCodeOrFail(code)

    // Validate parentCode if being changed
    if (data.parentCode) {
      const parent = await entityRepository.findByCode(data.parentCode)
      if (!parent) throw new NotFoundError(`Parent entity '${data.parentCode}'`)

      // Prevent self-referencing
      if (data.parentCode === code.toUpperCase()) {
        throw new AppError('An entity cannot be its own parent', { code: 'INVALID_PARENT', statusCode: 400 })
      }
    }

    return entityRepository.updateById(entity._id, data)
  }

  async search(query, limit = 10) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const entities = await entityRepository.model
      .find({ hidden: { $ne: true }, $or: [{ name: regex }, { code: regex }] })
      .limit(Number(limit))
      .lean()

    const codes = entities.map(e => e.code)
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))

    return entities.map(entity => ({ ...entity, latestYear: statsMap[entity.code] ?? null }))
  }

  async getBreadcrumbs(code) {
    // Single DB round-trip via $graphLookup instead of N sequential queries
    const chain = await entityRepository.findAncestorChain(code)
    if (!chain.length) throw new NotFoundError(`Entity '${code}'`)
    return chain
  }

  async getSiblings(code) {
    const entity = await entityRepository.findByCodeOrFail(code)
    if (!entity.parentCode) return []

    const siblings = await entityRepository.findChildren(entity.parentCode)
    const filtered = siblings.filter(s => s.code !== entity.code)
    const codes = filtered.map(s => s.code)
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))

    return filtered.map(s => ({ ...s, latestStats: statsMap[s.code] ?? null }))
  }

  async getBenchmarks(code) {
    const entity = await entityRepository.findByCodeOrFail(code)
    const stats = await statsRepository.findLatestForEntity(code)
    if (!stats) return []

    const membership = stats.membership?.ending ?? 0
    const growthRate = stats.membership?.growthRate != null ? stats.membership.growthRate * 100 : null
    const suggestions = []

    // 1. PEER: same level, ±30% size
    if (membership > 0) {
      const peers = await this.#findWithStats({
        level: entity.level,
        code: { $ne: entity.code },
      }, stats, 3, (s) => {
        const m = s.membership?.ending ?? 0
        return m >= membership * 0.7 && m <= membership * 1.3
      })
      for (const p of peers) {
        const pm = p.latestStats.membership?.ending ?? 0
        suggestions.push({
          entity: p.entity, latestStats: p.latestStats,
          reason: `Similar size peer (${Math.round(pm / 1000)}K members)`,
          similarity: 1 - Math.abs(membership - pm) / membership,
          category: 'peer',
        })
      }
    }

    // 2. ASPIRATION: same level, 1.5x+ size, positive growth
    if (membership > 0) {
      const aspirational = await this.#findWithStats({
        level: entity.level,
        code: { $ne: entity.code },
      }, stats, 2, (s) => {
        const m = s.membership?.ending ?? 0
        const gr = s.membership?.growthRate ?? 0
        return m > membership * 1.5 && gr > 0
      })
      for (const a of aspirational) {
        suggestions.push({
          entity: a.entity, latestStats: a.latestStats,
          reason: `Aspirational target (+${((a.latestStats.membership?.growthRate ?? 0) * 100).toFixed(1)}% growth)`,
          similarity: 0.8,
          category: 'aspiration',
        })
      }
    }

    // 3. TRAJECTORY: ±2% growth rate, same level
    if (growthRate != null) {
      const trajectory = await this.#findWithStats({
        level: entity.level,
        code: { $ne: entity.code },
      }, stats, 2, (s) => {
        const gr = s.membership?.growthRate != null ? s.membership.growthRate * 100 : null
        return gr != null && gr >= growthRate - 2 && gr <= growthRate + 2
      })
      for (const t of trajectory) {
        const gr = (t.latestStats.membership?.growthRate ?? 0) * 100
        suggestions.push({
          entity: t.entity, latestStats: t.latestStats,
          reason: `Similar growth pattern (${gr > 0 ? '+' : ''}${gr.toFixed(1)}%)`,
          similarity: 1 - Math.abs(growthRate - gr) / 10,
          category: 'trajectory',
        })
      }
    }

    // 4. GEOGRAPHIC: same parent
    if (entity.parentCode) {
      const parent = await entityRepository.findByCode(entity.parentCode)
      const siblings = await entityRepository.findChildren(entity.parentCode, { limit: 4 })
      const filtered = siblings.filter(s => s.code !== entity.code).slice(0, 3)
      const sibCodes = filtered.map(s => s.code)
      const sibStats = await statsRepository.findLatestForEntities(sibCodes)
      const sibMap = Object.fromEntries(sibStats.map(s => [s.entityCode, s]))

      for (const s of filtered) {
        if (sibMap[s.code]) {
          suggestions.push({
            entity: s, latestStats: sibMap[s.code],
            reason: `Geographic neighbor in ${parent?.name ?? 'same region'}`,
            similarity: 0.7,
            category: 'geographic',
          })
        }
      }
    }

    // 5. SIMILAR SIZE: 1.1-5x, different level
    if (membership > 0) {
      const sizeCohort = await this.#findWithStats({
        level: { $ne: entity.level },
        code: { $ne: entity.code },
      }, stats, 2, (s) => {
        const m = s.membership?.ending ?? 0
        return m >= membership * 1.1 && m <= membership * 5
      })
      for (const sc of sizeCohort) {
        const m = sc.latestStats.membership?.ending ?? 0
        suggestions.push({
          entity: sc.entity, latestStats: sc.latestStats,
          reason: `Similar scale (${sc.entity.level}, ${Math.round(m / 1000)}K members)`,
          similarity: 1 - Math.abs(membership - m) / Math.max(membership, m),
          category: 'similar-size',
        })
      }
    }

    // Deduplicate, sort by category priority + similarity, return top 6
    const categoryPriority = { peer: 4, aspiration: 3, trajectory: 2, geographic: 1, 'similar-size': 0 }
    const seen = new Set()
    return suggestions
      .filter(s => {
        if (seen.has(s.entity.code)) return false
        seen.add(s.entity.code)
        return true
      })
      .sort((a, b) => {
        const ap = categoryPriority[a.category] ?? 0
        const bp = categoryPriority[b.category] ?? 0
        if (ap !== bp) return bp - ap
        return b.similarity - a.similarity
      })
      .slice(0, 6)
  }

  async getNearby(code, limit = 3) {
    const entity = await entityRepository.findByCodeOrFail(code)
    if (!entity.location?.coordinates?.length) {
      return []
    }

    const [lng, lat] = entity.location.coordinates
    const nearby = await entityRepository.model.find({
      code: { $ne: entity.code },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 500000, // 500km
        },
      },
    }).limit(Number(limit)).lean()

    return nearby.map(n => {
      const [nLng, nLat] = n.location.coordinates
      const distanceKm = this.#haversine(lat, lng, nLat, nLng)
      return { entity: n, distanceKm: Math.round(distanceKm * 10) / 10 }
    })
  }

  #haversine(lat1, lon1, lat2, lon2) {
    const R = 6371
    const toRad = d => d * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  async #findWithStats(filter, refStats, limit, filterFn) {
    // Get entities matching filter, then join with latest stats and apply filterFn
    const entities = await entityRepository.model.find(filter).limit(200).lean()
    const codes = entities.map(e => e.code)
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))

    const results = []
    for (const e of entities) {
      const s = statsMap[e.code]
      if (s && filterFn(s)) {
        results.push({ entity: e, latestStats: s })
        if (results.length >= limit) break
      }
    }
    return results
  }

  async delete(code) {
    const entity = await entityRepository.findByCodeOrFail(code)

    // Check no children exist
    const children = await entityRepository.findChildren(code)
    if (children.length > 0) {
      throw new AppError(
        `Cannot delete '${code}' — it has ${children.length} child entit${children.length > 1 ? 'ies' : 'y'}. Remove children first.`,
        { code: 'HAS_CHILDREN', statusCode: 409 }
      )
    }

    // Cascade delete YearlyStats
    await statsRepository.deleteByEntityCode(code)
    await entityRepository.deleteById(entity._id)

    return { deleted: code }
  }
}

export const entityService = new EntityService()
