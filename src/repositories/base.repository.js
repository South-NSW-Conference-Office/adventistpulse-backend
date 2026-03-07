import { NotFoundError } from '../core/errors/index.js'

export class BaseRepository {
  constructor(model) {
    this.model = model
  }

  async findById(id) {
    return this.model.findById(id).lean()
  }

  async findByIdOrFail(id, resourceName) {
    const doc = await this.findById(id)
    if (!doc) throw new NotFoundError(resourceName ?? this.model.modelName)
    return doc
  }

  async findOne(filter) {
    return this.model.findOne(filter).lean()
  }

  async find(filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return this.model.find(filter).sort(sort).skip(skip).limit(limit).lean()
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter)
  }

  async create(data) {
    const doc = await this.model.create(data)
    return doc.toObject()
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean()
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id).lean()
  }

  async paginate(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.find(filter, { sort, skip, limit }),
      this.count(filter),
    ])
    return { data, total, page, limit }
  }
}
