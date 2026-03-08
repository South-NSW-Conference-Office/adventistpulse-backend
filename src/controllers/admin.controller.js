import { adminService } from '../services/admin.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'

export const adminController = {
  listUsers: asyncHandler(async (req, res) => {
    const { page, limit, role, isActive } = req.query
    const data = await adminService.listUsers({ page, limit, role, isActive })
    response.success(res, data.items, { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages })
  }),

  initiatePasswordReset: asyncHandler(async (req, res) => {
    const result = await adminService.initiatePasswordReset(req.user.sub, req.params.id)
    response.success(res, result)
  }),

  setUserActive: asyncHandler(async (req, res) => {
    const result = await adminService.setUserActive(req.user.sub, req.params.id, req.body.isActive)
    response.success(res, result)
  }),

  updateUserRole: asyncHandler(async (req, res) => {
    const result = await adminService.updateUserRole(req.user.sub, req.params.id, req.body)
    response.success(res, result)
  }),

  listPendingApprovals: asyncHandler(async (req, res) => {
    const result = await adminService.listPendingApprovals(req.query)
    response.success(res, result)
  }),

  approveUser: asyncHandler(async (req, res) => {
    const result = await adminService.approveUser(req.user.sub, req.params.id)
    response.success(res, result)
  }),

  rejectUser: asyncHandler(async (req, res) => {
    const { reason } = req.body
    const result = await adminService.rejectUser(req.user.sub, req.params.id, reason)
    response.success(res, result)
  }),
}
