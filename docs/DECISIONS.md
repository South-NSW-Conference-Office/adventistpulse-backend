# Adventist Pulse — Technical Decision Log

> Every significant architectural decision is recorded here with the reasoning.  
> Future contributors should read this before questioning "why did we do it this way?"

---

## 001 — Separate Backend (Express/VPS) Instead of Next.js API Routes

**Decision:** Full Express backend on Hostinger VPS, not Next.js API routes.

**Why:**
- Frontend (Vercel) and backend (VPS) are on different domains — cross-origin by design
- Next.js API routes are tightly coupled to the frontend deployment — no independent scaling
- Express gives full control over middleware, rate limiting, and connection pooling
- Backend can be consumed by multiple frontends in future (mobile app, admin dashboard)
- No business logic in the frontend — enforced by the separation at the infrastructure level

**Trade-offs:** CORS configuration required. Slightly more setup than Next.js API routes.

---

## 002 — jose (JWE) Instead of jsonwebtoken (JWS)

**Decision:** Use `jose` for JWT operations, producing JWE (encrypted) tokens instead of JWS (signed-only).

**Why:**
- JWS payloads are base64-encoded — readable by anyone who intercepts the token
- Our tokens contain `role` and `entityAccess` — sensitive enough to warrant full encryption
- `jose` uses `A256CBC-HS512` by default — industry standard
- HKDF key derivation means the raw secret is never used directly
- Secret rotation is built-in (array of secrets)
- Runtime agnostic — works on Node, edge, Deno

**Inspired by:** NextAuth.js core JWT implementation

**Trade-offs:** Slightly more complex than `jsonwebtoken`. No ecosystem tooling that assumes JWS format.

---

## 003 — HKDF Key Derivation

**Decision:** Derive the encryption key from `JWT_SECRET` using HKDF, not use the secret directly.

**Why:**
- Protects against weak secrets — HKDF output is always the correct key length
- Different salts for access vs refresh tokens — compromise of one doesn't compromise the other
- Same pattern used by NextAuth.js, Vercel, and most serious auth libraries

---

## 004 — Refresh Token as HttpOnly Cookie

**Decision:** Refresh token is stored as an HttpOnly, Secure, SameSite=None cookie. Access token is returned in the response body only (stored in memory by frontend).

**Why:**
- HttpOnly cookie is inaccessible to JavaScript — XSS cannot steal the refresh token
- SameSite=None required because frontend (Vercel) and backend (VPS) are different domains
- Access token in memory (not localStorage) — XSS can't persist a stolen access token across page loads
- Short access token expiry (15 min) limits the damage window if intercepted

**Trade-offs:** SameSite=None requires HTTPS in production. Frontend must handle token refresh flow.

---

## 005 — Refresh Token JTI Blacklist

**Decision:** On refresh and logout, the old refresh token's JTI is stored in a `TokenBlacklist` MongoDB collection. Every refresh request checks this list.

**Why:**
- JWTs are stateless — you can't "invalidate" them without server-side tracking
- Without blacklisting, a stolen refresh token is valid until expiry (7 days)
- JTI (JWT ID) is a `crypto.randomUUID()` — unique per token, stored as a hash

**Trade-offs:** DB lookup on every refresh request. Mitigated by TTL index on the blacklist collection (auto-cleans expired JTIs).

---

## 006 — Repository Pattern

**Decision:** All database access goes through repository classes. Services never call Mongoose directly.

**Why:**
- Testability — services can be unit tested with mock repositories, no DB needed
- Single responsibility — services contain business logic, repositories contain DB logic
- Swappability — if we ever migrate from MongoDB to PostgreSQL, only repositories change
- DRY — base repository has `findById`, `findOne`, `find`, `create`, `update`, `delete`, `paginate` — no duplication

---

## 007 — Zod for Validation (Backend Only)

**Decision:** All request body validation is done server-side with Zod. No validation in the frontend.

**Why:**
- Frontend is a dumb UI layer — business rules (including what's valid) belong to the backend
- Client-side validation can be bypassed (curl, Postman, modified JS)
- Zod schemas are the single source of truth for data shape
- Zod's `z.infer<>` gives TypeScript types for free from the same schema

**Trade-offs:** Network round-trip for validation feedback. Frontend shows whatever error message the backend returns.

---

## 008 — No Auto Email Account Linking (OAuth)

**Decision:** When a Google sign-in email matches an existing password account, we throw `ACCOUNT_NOT_LINKED` instead of auto-merging.

**Why:**
- Auto-linking is a known OAuth security vulnerability
- Google doesn't always verify email ownership before issuing tokens
- An attacker could create a Google account with your email and hijack your account
- Explicit linking (log in with password → then link Google in Settings) is safe and auditable

**Inspired by:** NextAuth.js `handleLoginOrRegister` implementation

---

## 009 — Structured Error Hierarchy

**Decision:** All errors extend `AppError`. Errors have a `code` (machine-readable), a `publicMessage` (safe to send to client), and a `cause` (logged server-side only).

**Why:**
- Client always gets a consistent, safe error shape — no accidental stack trace leakage
- Machine-readable `code` lets the frontend switch on specific errors without string matching
- Full error details are always logged server-side for debugging
- Error codes are an enum in one file — no duplicates, no magic strings scattered everywhere

---

## 010 — Silent Access Token Rotation

**Decision:** If an access token has < 5 minutes until expiry, the server issues a new one and returns it in `X-New-Access-Token` response header — without the user noticing.

**Why:**
- Better UX than forcing a refresh mid-session
- Reduces the frequency of `/auth/refresh` calls
- Keeps access tokens short-lived (15 min) without interrupting the user

**Inspired by:** NextAuth.js session auto-refresh behavior

---

## 011 — Single Logger Singleton

**Decision:** One `logger` instance created in `core/logger.js` and imported everywhere. Three levels: `error`, `warn`, `debug`.

**Why:**
- Consistent log format across the entire application
- Single place to configure log level, output format, or swap to a log service (Datadog, etc.)
- Structured logs (`[pulse][error]`, `[pulse][debug]`) are parseable by log aggregators

**Inspired by:** NextAuth.js logger implementation

---

## 012 — zxcvbn for Password Strength (NIST 2024 Guidance)

**Decision:** Use `zxcvbn` (Dropbox's password strength estimator) instead of complexity rules (uppercase + number + special char).

**Why:**
- NIST SP 800-63B (2024 update) explicitly recommends against complexity rules — they produce predictable patterns (`Password1!`)
- Length is the strongest predictor of password entropy
- zxcvbn checks against 30,000+ common passwords, dictionary words, keyboard patterns, and names
- Human-readable rejection messages ("This is a very common password") vs. cryptic "must contain 1 uppercase"
- Contextual checking — penalises passwords containing the user's name or email

**Rules implemented:**
- Minimum 12 characters (up from 8 — NIST guidance)
- Maximum 128 characters
- zxcvbn score must be ≥ 2 (rejects score 0 "too guessable" and score 1 "very guessable")
- No complexity requirements (uppercase/number/symbol) — length and zxcvbn score are sufficient

**Applies to:** `register`, `reset-password`, `change-password`
**Does not apply to:** `login` (only correctness checked, not strength)

---

## 013 — Verification and Reset Tokens Stored as SHA-256 Hashes

**Decision:** Email verification tokens, password reset tokens, and email-change tokens are stored in MongoDB as SHA-256 hashes. The raw token only exists in the email sent to the user.

**Why:**
- If the database is breached, hashed tokens cannot be used to verify emails or reset passwords
- Same principle as storing passwords as bcrypt hashes — the raw secret never lives in the DB
- SHA-256 (not bcrypt) used here because tokens are high-entropy random bytes (32 bytes from `crypto.randomBytes`) — no need for slow hashing, just collision resistance
- Consistent with industry practice (Laravel, Django, Rails all hash reset tokens)

**Implementation:** `crypto.hashToken(rawToken)` in `lib/crypto.js` — `createHash('sha256').update(rawToken).digest('hex')`

---

## 014 — Session Invalidation on Password Change via passwordChangedAt

**Decision:** A `passwordChangedAt` timestamp is set on the User whenever password is changed or email is changed. `authMiddleware` rejects any token issued before this timestamp.

**Why:**
- Without this, resetting a compromised password doesn't actually end the attacker's session — their access token remains valid for up to 15 minutes
- JWTs are stateless — we can't "recall" them — but we can reject them based on issue time
- `passwordChangedAt` + `iat` comparison is O(1) — no extra DB query needed
- Covers: password reset, change-password, email change confirmation

**Implementation:** `if (payload.iat < Math.floor(passwordChangedAt / 1000)) → TokenInvalidError`

---

## 015 — emailVerified Enforcement on Write Operations

**Decision:** Unverified users have read-only access. All write operations (POST/PUT/DELETE) require `emailVerified: true` via `requireVerified` middleware.

**Why:**
- Without enforcement, someone who registers with another person's email gets full write access before the real owner sees anything
- Read-only access is a reasonable grace period — users can browse the app while waiting for the email
- `requireVerified` is applied at the route level (not globally) for surgical control — auth routes like `/resend-verification` intentionally work for unverified users

---

## 016 — Timing Attack Prevention on Forgot Password

**Decision:** The `/auth/forgot-password` endpoint always takes at least 600ms to respond, regardless of whether the email exists.

**Why:**
- Without padding, response time for a real email (~500ms, hits DB + sends email) vs. a fake email (~5ms, returns immediately) reveals which emails are registered
- A 600ms floor makes real and fake email responses indistinguishable by timing
- Combined with identical response body ("If that email exists, a reset link has been sent"), this provides full enumeration resistance

---

## 017 — Per-Email Rate Limit on Password Reset

**Decision:** In addition to the IP-based rate limit (5/15min), a per-email rate limit of 1 reset email per hour is stored on the User document (`resetEmailSentAt`).

**Why:**
- IP-based rate limiting can be trivially bypassed with multiple IPs (VPN, botnets)
- Without per-email limiting, an attacker can flood a victim's inbox with password reset emails from different IPs
- 1 per hour is reasonable for a legitimate user who lost access; negligible for UX

---

## 018 — SMTP-Delivery-Gated Rate Limit (resetEmailSentAt)

**Decision:** `resetEmailSentAt` is only written to the database *after* the reset email is confirmed as delivered — not before the send attempt.

**Why:**
- The naive approach (write `resetEmailSentAt` first, then send) means an SMTP outage silently traps the user: they wait for an email that never comes, then hit the 1-hour rate limit when they try again
- By writing `resetEmailSentAt` only on successful delivery, a failed send leaves the user free to retry immediately
- The reset token itself is written first (before sending), so a retry generates a fresh token — the DB is never in an inconsistent state

**Implementation:** Two separate `updateById` calls: token first, then `resetEmailSentAt` inside a try/catch around the email send.

---

## 019 — Post-Reset Security Notification Email

**Decision:** After every successful password reset, a non-blocking security alert email is sent to the account owner containing the date and time of the change.

**Why:**
- If an attacker requested the reset (e.g., compromised inbox), the real account owner gets no warning without this email
- Standard industry practice: GitHub, Google, Apple all send "your password was changed" alerts
- "Non-blocking" means a failed alert delivery doesn't roll back the reset — the password change still succeeds
- Includes `changedAt` timestamp so the user can tell if the change was recent and intentional
- Alert advises: "If this wasn't you, contact your administrator immediately"

---

## 020 — Frontend Token Stripping via replaceState()

**Decision:** The `/reset-password` page immediately calls `window.history.replaceState()` on mount to remove the `?token=` query parameter from the URL before rendering or making any external requests.

**Why:**
- The raw reset token in the URL ends up in browser history (anyone with physical device access can grab it)
- If the page loads any external scripts (analytics, fonts), the `Referer` header will contain the full URL including the token
- Vercel and other hosting providers log full request URLs — the token would appear in access logs
- `replaceState` removes the token from history without a page reload; the token is preserved in a React `useRef` for use in the form submit
- This is a defence-in-depth measure — the token expires after 1 hour, but stripping it immediately shrinks the exposure window to near zero

**Implementation:** `useEffect` on the `useSearchParams` hook. Token read from params, stored in `useRef`, then `window.history.replaceState({}, '', window.location.pathname)` is called immediately.

---

## 021 — Admin-Initiated Password Reset

**Decision:** Admins can trigger a password reset for any active user via `POST /admin/users/:id/reset-password`. The target user receives a reset email and is forced to change their password on next login (`mustChangePassword: true`).

**Why:**
- Without this, there is no recovery path if a user loses access to their email and forgets their password
- For a church-admin system this is essential — administrators need to be able to assist users who are locked out
- The admin never sees the raw token — it goes directly to the user's email, preserving the security model
- `mustChangePassword: true` ensures the admin-set state is temporary — the user takes ownership on their next login
- `resetEmailSentAt` is cleared on admin reset (bypasses per-email rate limit) — admins need this to be reliable
- Guards: admin cannot reset their own account; deactivated accounts and OAuth-only accounts are rejected with clear errors
- If email delivery fails, `EMAIL_SEND_FAILED` is thrown but the token is already saved — admin can retry safely
