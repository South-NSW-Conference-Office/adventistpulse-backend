import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  loginRateLimit,
  registerRateLimit,
  refreshRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  verifyEmailRateLimit,
} from '../middleware/rateLimit.middleware.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changeEmailSchema,
  resendVerificationByEmailSchema,
} from '../validators/auth.validator.js'

const router = Router()

// Public auth routes
router.post('/register',        registerRateLimit,       validate(registerSchema),       authController.register)
router.post('/login',           loginRateLimit,          validate(loginSchema),           authController.login)
router.post('/refresh',         refreshRateLimit,                                         authController.refresh)
router.post('/logout',                                                                    authController.logout)
router.get ('/verify-email',    verifyEmailRateLimit,                                     authController.verifyEmail)
router.get ('/confirm-email-change',                                                      authController.confirmEmailChange)
router.post('/forgot-password', forgotPasswordRateLimit, validate(forgotPasswordSchema),  authController.forgotPassword)
router.post('/reset-password',  resetPasswordRateLimit,  validate(resetPasswordSchema),   authController.resetPassword)

// Authenticated routes (no emailVerified requirement — users need these regardless of verification status)
router.get ('/me',                  authMiddleware, authController.me)
router.post('/resend-verification',          authMiddleware, authController.resendVerification)
router.post('/resend-verification-by-email', validate(resendVerificationByEmailSchema), authController.resendVerificationByEmail)

// Authenticated + verified routes
router.post('/change-email', authMiddleware, validate(changeEmailSchema), authController.changeEmail)

export default router
