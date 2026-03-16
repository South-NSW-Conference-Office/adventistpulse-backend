import { Router } from 'express'
import { riskService } from '../services/risk.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'

const router = Router()

router.use(authMiddleware, requirePasswordChanged, requireApproved)

router.get('/:code', asyncHandler(async (req, res) => {
  const data = await riskService.assessRisk(req.params.code)
  response.success(res, data)
}))

router.get('/', asyncHandler(async (req, res) => {
  const { level, parentCode } = req.query
  const data = await riskService.assessRiskBulk({ level, parentCode })
  response.success(res, data)
}))

export default router
