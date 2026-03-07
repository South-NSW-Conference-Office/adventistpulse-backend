import { entityService } from '../services/entity.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'

export const entityController = {
  list: asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await entityService.list(req.query)
    response.paginated(res, data, { total, page, limit })
  }),

  getOne: asyncHandler(async (req, res) => {
    const entity = await entityService.getByCode(req.params.code)
    response.success(res, entity)
  }),

  getChildren: asyncHandler(async (req, res) => {
    const children = await entityService.getChildren(req.params.code)
    response.success(res, children)
  }),

  create: asyncHandler(async (req, res) => {
    const entity = await entityService.create(req.body)
    response.created(res, entity)
  }),

  update: asyncHandler(async (req, res) => {
    const entity = await entityService.update(req.params.code, req.body)
    response.success(res, entity)
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await entityService.delete(req.params.code)
    response.success(res, result)
  }),
}
