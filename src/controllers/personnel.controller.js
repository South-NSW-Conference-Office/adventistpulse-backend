import { personnelService } from '../services/personnel.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'

export const personnelController = {

  /** GET /admin/assignments?conferenceCode=SNSW */
  listCurrent: asyncHandler(async (req, res) => {
    const conferenceCode = req.query.conferenceCode ?? req.user.subscription?.conferenceCode
    if (!conferenceCode) return response.badRequest(res, 'conferenceCode required')
    const assignments = await personnelService.listCurrent(conferenceCode)
    response.success(res, assignments)
  }),

  /** GET /admin/assignments/church/:code — full history for one church */
  churchHistory: asyncHandler(async (req, res) => {
    const assignments = await personnelService.churchHistory(req.params.code)
    response.success(res, assignments)
  }),

  /** POST /admin/assignments — create one assignment */
  create: asyncHandler(async (req, res) => {
    const assignment = await personnelService.createAssignment({
      ...req.body,
      conferenceCode: req.body.conferenceCode ?? req.user.subscription?.conferenceCode,
      uploadedBy: req.user._id,
    })
    response.created(res, assignment)
  }),

  /** PATCH /admin/assignments/:id/end — end a current assignment */
  end: asyncHandler(async (req, res) => {
    const assignment = await personnelService.endAssignment(req.params.id, req.user._id)
    response.success(res, assignment)
  }),

  /** POST /admin/assignments/import — CSV bulk import */
  importCsv: asyncHandler(async (req, res) => {
    if (!req.file) return response.badRequest(res, 'CSV file required (field name: file)')
    const conferenceCode = req.body.conferenceCode ?? req.user.subscription?.conferenceCode
    if (!conferenceCode) return response.badRequest(res, 'conferenceCode required')

    const results = await personnelService.importCsv({
      csvBuffer:      req.file.buffer,
      conferenceCode,
      uploadedBy:     req.user._id,
    })
    response.success(res, results)
  }),

  /** POST /admin/delegate — pastor delegates to elder */
  delegate: asyncHandler(async (req, res) => {
    const result = await personnelService.delegateToElder({
      pastorId:   req.user._id,
      elderEmail: req.body.elderEmail,
      churchCode: req.body.churchCode,
      expiresAt:  req.body.expiresAt ?? null,
    })
    response.created(res, result)
  }),

  /** DELETE /admin/delegate/:elderId/:churchCode — revoke delegation */
  revokeDelegate: asyncHandler(async (req, res) => {
    const result = await personnelService.revokeDelegation({
      elderId:    req.params.elderId,
      churchCode: req.params.churchCode,
      revokedBy:  req.user._id,
    })
    response.success(res, result)
  }),
}
