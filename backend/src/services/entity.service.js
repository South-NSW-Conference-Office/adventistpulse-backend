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
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap   = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))

    return {
      data: data.map(entity => ({ ...entity, latestStats: statsMap[entity.code] ?? null })),
      total, page, limit,
    }
  }

  async getByCode(code) {
    const entity     = await entityRepository.findByCodeOrFail(code)
    const latestStats = await statsRepository.findLatestForEntity(code)
    return { ...entity, latestStats: latestStats ?? null }
  }

  async getChildren(code) {
    await entityRepository.findByCodeOrFail(code)
    const children   = await entityRepository.findChildren(code)
    const codes      = children.map(c => c.code)
    const latestStats = await statsRepository.findLatestForEntities(codes)
    const statsMap   = Object.fromEntries(latestStats.map(s => [s.entityCode, s]))
    return children.map(c => ({ ...c, latestStats: statsMap[c.code] ?? null }))
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
