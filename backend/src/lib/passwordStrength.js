import { createRequire } from 'module'

// zxcvbn is CJS — use createRequire to import in ESM context
const require = createRequire(import.meta.url)
const zxcvbn  = require('zxcvbn')

// Score guide (zxcvbn):
//   0 — Too guessable (password, 123456, etc.)
//   1 — Very guessable (slight variation on common)
//   2 — Somewhat guessable — we reject below this
//   3 — Safely unguessable
//   4 — Very unguessable

const MIN_SCORE    = 2
const MIN_LENGTH   = 12
const MAX_LENGTH   = 128

const SCORE_LABELS = ['too common', 'too easy to guess', 'acceptable', 'strong', 'very strong']

/**
 * Validates password strength using zxcvbn.
 * Returns { ok: true } or { ok: false, message: string }
 *
 * @param {string} password
 * @param {string[]} userInputs - contextual data zxcvbn uses to penalise (name, email, etc.)
 */
export function checkPasswordStrength(password, userInputs = []) {
  if (password.length < MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_LENGTH} characters` }
  }

  if (password.length > MAX_LENGTH) {
    return { ok: false, message: `Password must be no more than ${MAX_LENGTH} characters` }
  }

  const result  = zxcvbn(password, userInputs)
  const { score, feedback } = result

  if (score < MIN_SCORE) {
    // Use zxcvbn's own suggestion if available, else give a clear generic message
    const hint = feedback.warning
      ? feedback.warning
      : `This password is ${SCORE_LABELS[score]}. Try a longer passphrase or mix of random words.`

    return { ok: false, message: hint }
  }

  return { ok: true, score, label: SCORE_LABELS[score] }
}
