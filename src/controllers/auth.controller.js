import { authService } from '../services/auth.service.js'
import { tokenService } from '../services/token.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'

const REFRESH_COOKIE = 'refresh_token'

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { tokens, user, isNewUser } = await authService.register(req.body)
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, tokenService.getRefreshCookieOptions())
    response.created(res, { accessToken: tokens.accessToken, user, isNewUser })
  }),

  login: asyncHandler(async (req, res) => {
    const { tokens, user, isNewUser, mustChangePassword } = await authService.login(req.body)
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, tokenService.getRefreshCookieOptions(tokens.refreshExpiry))
    response.success(res, { accessToken: tokens.accessToken, user, isNewUser, mustChangePassword })
  }),

  refresh: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]
    const { tokens }   = await authService.refresh(refreshToken)
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, tokenService.getRefreshCookieOptions())
    response.success(res, { accessToken: tokens.accessToken })
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]
    const accessToken  = req.headers.authorization?.slice(7)
    await authService.logout(accessToken, refreshToken)
    res.clearCookie(REFRESH_COOKIE, { path: '/api' })
    response.success(res, { message: 'Logged out successfully' })
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.sub)
    response.success(res, user)
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.query.token)
    response.success(res, { message: 'Email verified successfully' })
  }),

  resendVerification: asyncHandler(async (req, res) => {
    await authService.resendVerification(req.user.sub)
    response.success(res, { message: 'Verification email sent' })
  }),

  resendVerificationByEmail: asyncHandler(async (req, res) => {
    await authService.resendVerificationByEmail(req.body.email)
    // Always 200 — never reveal whether the email exists or is already verified
    response.success(res, { message: 'If that email is registered and unverified, a new link has been sent' })
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email)
    response.success(res, { message: 'If that email exists, a reset link has been sent' })
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body
    await authService.resetPassword(token, password)
    response.success(res, { message: 'Password reset successfully. Please log in.' })
  }),

  changeEmail: asyncHandler(async (req, res) => {
    const { newEmail, password } = req.body
    await authService.changeEmail(req.user.sub, newEmail, password)
    response.success(res, { message: `A confirmation link has been sent to ${req.body.newEmail}` })
  }),

  confirmEmailChange: asyncHandler(async (req, res) => {
    await authService.confirmEmailChange(req.query.token)
    response.success(res, { message: 'Email address updated successfully. Please log in again.' })
  }),

  betaSignup: asyncHandler(async (req, res) => {
    const result = await authService.betaSignup(req.body)
    response.success(res, result)
  }),

  pastorConfirm: asyncHandler(async (req, res) => {
    const { token, decision } = req.query
    const result = await authService.confirmPastor({ token, decision })
    response.success(res, result)
  }),
}
