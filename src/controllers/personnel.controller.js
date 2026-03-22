import { personnelService } from '../services/personnel.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'
import { getCallerConference } from '../lib/conference.js'

export const personnelController = {

  /** GET /admin/assignments — current staffing for caller's conference only */
  listCurrent: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const assignments = await personnelService.listCurrent(conferenceCode)
    response.success(res, assignments)
  }),

  /** GET /admin/assignments/church/:code — history scoped to caller's conference */
  churchHistory: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const assignments = await personnelService.churchHistory(req.params.code, conferenceCode)
    response.success(res, assignments)
  }),

  /** POST /admin/assignments — create one assignment, pinned to caller's conference */
  create: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const assignment = await personnelService.createAssignment({
      ...req.body,
      conferenceCode, // override any body value — never trust caller
      uploadedBy: req.user._id,
    })
    response.created(res, assignment)
  }),

  /** PATCH /admin/assignments/:id/end — end assignment, scoped to caller's conference */
  end: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const assignment = await personnelService.endAssignment(req.params.id, conferenceCode)
    response.success(res, assignment)
  }),

  /** POST /admin/assignments/import — CSV bulk import, pinned to caller's conference */
  importCsv: asyncHandler(async (req, res) => {
    if (!req.file) return response.badRequest(res, 'CSV file required (field name: file)')
    const conferenceCode = getCallerConference(req)
    const results = await personnelService.importCsv({
      csvBuffer:    req.file.buffer,
      conferenceCode, // override any body value — never trust caller
      uploadedBy:   req.user._id,
    })
    response.success(res, results)
  }),

  /** POST /pastor/delegate — pastor delegates to elder */
  delegate: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const result = await personnelService.delegateToElder({
      pastorId:       req.user._id,
      elderEmail:     req.body.elderEmail,
      churchCode:     req.body.churchCode,
      expiresAt:      req.body.expiresAt ?? null,
      conferenceCode, // passed for territory check
    })
    response.created(res, result)
  }),

  /** DELETE /pastor/delegate/:elderId/:churchCode — revoke delegation */
  revokeDelegate: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)
    const result = await personnelService.revokeDelegation({
      elderId:        req.params.elderId,
      churchCode:     req.params.churchCode,
      revokedBy:      req.user._id,
      conferenceCode,
    })
    response.success(res, result)
  }),
}
