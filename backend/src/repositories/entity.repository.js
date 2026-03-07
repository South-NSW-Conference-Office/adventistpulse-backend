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
}

export const entityRepository = new EntityRepository()
