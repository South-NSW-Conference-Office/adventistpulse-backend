import { BaseRepository } from './base.repository.js'
import { OrgUnit } from '../models/OrgUnit.js'
import { NotFoundError } from '../core/errors/index.js'

class EntityRepository extends BaseRepository {
  constructor() {
    super(OrgUnit)
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase() }).lean()
  }

  async findByCodeOrFail(code) {
    const doc = await this.findByCode(code)
    if (!doc) throw new NotFoundError(`Entity '${code}'`)
    return doc
  }

  async findByLevel(level, { skip, limit, sort } = {}) {
    return this.find({ level }, { skip, limit, sort })
  }

  async findChildren(parentCode, { skip, limit } = {}) {
    return this.find({ parentCode: parentCode.toUpperCase() }, { skip, limit })
  }

  async existsByCode(code) {
    return this.model.exists({ code: code.toUpperCase() })
  }

  /**
   * Returns the full ancestor chain for an entity, ordered root → entity.
   * Uses $graphLookup to traverse parentCode → code in a single DB round-trip
   * instead of N sequential queries.
   */
  async findAncestorChain(code) {
    const result = await this.model.aggregate([
      { $match: { code: code.toUpperCase() } },
      {
        $graphLookup: {
          from:             'orgunits',
          startWith:        '$parentCode',
          connectFromField: 'parentCode',
          connectToField:   'code',
          as:               'ancestors',
          maxDepth:         10,
          depthField:       '_depth',
        },
      },
      {
        $project: {
          self:      '$$ROOT',
          ancestors: 1,
        },
      },
    ])

    if (!result.length) return []

    const { self, ancestors } = result[0]
    // ancestors has no guaranteed order — sort by depth desc so root is first
    const sorted = [...ancestors].sort((a, b) => b._depth - a._depth)
    // Remove internal fields before returning
    const clean = (doc) => {
      // eslint-disable-next-line no-unused-vars
      const { _depth, ancestors: _a, self: _s, ...rest } = doc
      return rest
    }
    return [...sorted.map(clean), clean(self)]
  }
}

export const entityRepository = new EntityRepository()
