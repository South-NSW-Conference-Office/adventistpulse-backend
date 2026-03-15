'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Password strength hints ─────────────────────────────────────────────────
// Mirrors backend rules: min 12 chars + zxcvbn score ≥ 3
// We do a lightweight client-side hint only; real enforcement is server-side.
function getStrengthLabel(password: string): { label: string; color: string } | null {
  if (!password) return null
  if (password.length < 8) return { label: 'Too short', color: 'text-red-500' }
  if (password.length < 12) return { label: 'Weak', color: 'text-orange-500' }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const variety = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length
  if (variety < 2) return { label: 'Weak', color: 'text-orange-500' }
  if (variety < 3 || password.length < 16) return { label: 'Fair', color: 'text-yellow-500' }
  return { label: 'Strong', color: 'text-green-600' }
}

// ─── The actual reset form ────────────────────────────────────────────────────
function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const tokenRef = useRef<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // ── Issue #3 fix: strip the token from the URL immediately on mount,
  //    before any external scripts (fonts, analytics) can read the Referer header,
  //    and before the token can accumulate in browser history.
  useEffect(() => {
    const raw = searchParams.get('token')
    if (raw) {
      tokenRef.current = raw
      // replaceState removes the token from history so Back button doesn't re-expose it
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  const strength = getStrengthLabel(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!tokenRef.current) {
      setErrorMsg('Missing reset token. Please use the link from your email.')
      setStatus('error')
      return
    }

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }

    if (password.length < 12) {
      setErrorMsg('Password must be at least 12 characters.')
      return
    }

    setStatus('loading')

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiBase}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenRef.current, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data?.error?.message ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Password reset</h2>
        <p className="text-zinc-500 text-sm">
          Your password has been updated. You can now sign in with your new password.
          <br />
          A confirmation email has been sent to your address.
        </p>
        <a
          href="/login"
          className="inline-block mt-2 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-6 py-2.5 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Sign in
        </a>
      </div>
    )
  }

  // ── No token in URL (already stripped or missing) + form not submitted yet ──
  const hasToken = !!tokenRef.current || !!searchParams.get('token')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set a new password
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your new password below. Minimum 12 characters.
        </p>
      </div>

      {/* Token missing warning */}
      {!hasToken && status !== 'error' && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          No reset token found. Please use the link from your password reset email, or{' '}
          <a href="/forgot-password" className="underline font-medium">request a new one</a>.
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && errorMsg && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* New password field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition"
          placeholder="At least 12 characters"
        />
        {strength && (
          <p className={`text-xs font-medium ${strength.color}`}>
            Strength: {strength.label}
          </p>
        )}
      </div>

      {/* Confirm password field */}
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition"
          placeholder="Repeat your new password"
        />
        {confirm && password !== confirm && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !password || !confirm}
        className="w-full rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-2.5 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Resetting…' : 'Reset password'}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Remembered it?{' '}
        <a href="/login" className="underline text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          Sign in
        </a>
      </p>
    </form>
  )
}

// ─── Page shell (Suspense required for useSearchParams in App Router) ─────────
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-8">
        <div className="mb-7 text-center">
          <span className="inline-block text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Adventist Pulse
          </span>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
