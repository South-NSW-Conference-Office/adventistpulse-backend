# Adventist Pulse — Auth System

> **Strategy:** JWT (JWE) via `jose`  
> **No NextAuth** — auth is entirely backend-owned  
> **Last Updated:** 2026-03-07

---

## Why JWE (Not JWS)

Most implementations use `jsonwebtoken` which produces a JWS — a *signed* token. The payload is base64-encoded and **readable by anyone** who intercepts it.

We use `jose` with JWE (JSON Web Encryption) — the payload is **fully encrypted** using `A256CBC-HS512`. Even if a token is intercepted, it reveals nothing.

| | JWS (`jsonwebtoken`) | JWE (`jose`) |
|---|---|---|
| Payload readable? | ✅ Yes (base64 decode) | ❌ No — encrypted |
| Secret used directly? | ✅ Yes | ❌ No — HKDF derived |
| Secret rotation | Manual | Array of secrets |
| Runtime | Node only | Universal |

---

## Key Derivation (HKDF)

The encryption key is never the raw secret. We derive it using HKDF:

```
encryptionKey = HKDF(sha256, JWT_SECRET, salt, "Adventist Pulse Encryption Key ({salt})", 64 bytes)
```

- `salt` differs per token type: `access_token` salt ≠ `refresh_token` salt
- Protects against weak secrets
- Borrowed from the NextAuth.js codebase

---

## Token Types

### Access Token
- **Expiry:** 15 minutes
- **Algorithm:** JWE `A256CBC-HS512`
- **Transport:** `Authorization: Bearer <token>` header
- **Contains:**
  ```json
  {
    "sub": "userId",
    "name": "Bem",
    "email": "bem@snsw.org",
    "role": "admin",
    "entityAccess": ["SNSW", "AUC"],
    "iat": 1234567890,
    "exp": 1234568790,
    "jti": "uuid-v4"
  }
  ```

### Refresh Token
- **Expiry:** 7 days
- **Algorithm:** JWE `A256CBC-HS512`
- **Transport:** HttpOnly, Secure, SameSite=None cookie
- **Contains:**
  ```json
  {
    "sub": "userId",
    "jti": "uuid-v4",
    "iat": 1234567890,
    "exp": 1234654290
  }
  ```
- **JTI stored in DB:** `TokenBlacklist` collection tracks revoked JTIs

---

## Secret Rotation

`JWT_SECRET` accepts a comma-separated list of secrets in `.env`:

```
JWT_SECRET=newSecret2026,oldSecret2025
```

- First secret → used for all new token encoding
- All secrets → tried in order for decoding (old tokens still valid during rotation)
- Enables zero-downtime secret rotation

---

## Auth Flow

### Register
```
POST /auth/register
Body: { name, email, password }

1. Validate body (Zod) — password checked with zxcvbn (min 12 chars, score ≥ 2)
2. Check email not already taken (user.repository)
3. Hash password (bcryptjs, 12 rounds)
4. Generate verification token (crypto.randomBytes(32)) → store SHA-256 hash
5. Create user with emailVerified: false
6. Send verification email (non-blocking)
7. Issue access + refresh tokens (token.service)
8. Set refresh token as HttpOnly cookie
9. Return: { accessToken, user: { id, name, email, role, emailVerified } }
```

### Login
```
POST /auth/login
Body: { email, password }

1. Validate body (Zod)
2. Find user by email (user.repository)
3. Compare password hash (lib/crypto.js)
4. Issue access + refresh tokens (token.service)
5. Set refresh token as HttpOnly cookie
6. Return: { accessToken, user: { id, name, email, role }, isNewUser }
```

### Refresh
```
POST /auth/refresh
Cookie: refresh_token (HttpOnly)

1. Extract refresh token from cookie
2. Decode + verify JWE (lib/jwt.js)
3. Check JTI not blacklisted (tokenBlacklist.repository)
4. Blacklist old refresh token JTI
5. Issue new access + refresh tokens (token.service)
6. Set new refresh token cookie
7. Return: { accessToken }
```

### Logout
```
POST /auth/logout
Cookie: refresh_token (HttpOnly)

1. Extract refresh token from cookie
2. Decode JTI (lib/jwt.js)
3. Blacklist JTI (tokenBlacklist.repository)
4. Clear refresh token cookie
5. Return: { message: "Logged out" }
```

### Verify Email
```
GET /auth/verify-email?token=<rawToken>

1. SHA-256 hash the incoming token
2. Find user where emailVerificationToken == hash AND emailVerificationExpires > now
3. Set emailVerified: true, clear token fields
4. Return: { message: "Email verified successfully" }
```

### Resend Verification Email
```
POST /auth/resend-verification
Auth: Bearer token required

1. Check user.emailVerified — reject if already verified (ALREADY_VERIFIED)
2. Check verificationEmailSentAt — reject if < 2 min ago (RESEND_COOLDOWN, with seconds remaining)
3. Generate new rawToken → store new SHA-256 hash (invalidates old token)
4. Send verification email (non-blocking)
5. Return: { message: "Verification email sent" }
```

### Forgot Password
```
POST /auth/forgot-password
Body: { email }

1. Record start time
2. Look up email — if not found, skip to step 7 (same response either way)
2a. If account is deactivated (isActive: false) → skip silently, no email sent
2b. If account has no password (OAuth-only) → send OAuthOnlyNotice email instead, no reset link
3. Check resetEmailSentAt — if < 1 hour ago, pad response time then throw RESET_RATE_LIMITED
4. Generate rawToken → write SHA-256 hash + expiry to DB (resetEmailSentAt NOT yet written)
5. Attempt to send reset email (awaited, not fire-and-forget):
   - Success → write resetEmailSentAt = now (rate limit applied only on confirmed delivery)
   - Failure → log error, do NOT write resetEmailSentAt (user can retry immediately)
6. Pad response to minimum 600ms (prevents timing-based email enumeration)
7. Return: { message: "If that email exists, a reset link has been sent" }

Note: resetEmailSentAt is only persisted after confirmed SMTP delivery.
If the mail server is down, the user is not phantom-rate-limited.
```

### Reset Password
```
POST /auth/reset-password
Body: { token, password }

1. Validate password strength (zxcvbn, min 12 chars)
2. SHA-256 hash the token
3. Find user where passwordResetToken == hash AND passwordResetExpires > now
4. Hash new password (bcryptjs, 12 rounds)
5. Save new password, clear passwordResetToken + passwordResetExpires, set passwordChangedAt = now
6. Clear loginAttempts + lockUntil (reset account lockout), set mustChangePassword: false
7. Do NOT clear resetEmailSentAt — keeps the 1-hour cooldown in effect after a reset
8. Send password-changed security alert email (non-blocking — does not fail the reset):
   - To: account owner's email
   - Includes: date and time of the change (changedAt)
   - Advises: "If this wasn't you, contact your administrator immediately"
9. Return: { message: "Password reset successfully. Please log in." }

Note: passwordChangedAt invalidates ALL existing sessions immediately.
Note: keepin resetEmailSentAt prevents an attacker who just reset someone's
      password from immediately triggering another reset email.
```

### Admin-Initiated Password Reset
```
POST /admin/users/:id/reset-password
Auth: Bearer token + admin role required

1. Verify target user exists (NOT_FOUND if missing)
2. Verify target user is active (ACCOUNT_DEACTIVATED if not)
3. Verify target user has a password (OAUTH_ONLY if OAuth-only account)
4. Generate rawToken → write SHA-256 hash + expiry to DB
5. Set mustChangePassword: true — user must change password on next login
6. Set resetEmailSentAt: null — admin bypass overrides the per-email rate limit
7. Send admin password reset email to target user (awaited):
   - Failure → throw EMAIL_SEND_FAILED (token is already saved — admin can retry)
8. Return: { message: "Password reset email sent to <email>" }

Note: Admins cannot reset their own password via this endpoint (SELF_DEACTIVATION guard).
Note: The raw token is sent to the user, never exposed to the admin.
```

### Change Email
```
POST /auth/change-email
Auth: Bearer token required
Body: { newEmail, password }

1. Verify current password (bcryptjs compare)
2. Check newEmail not already taken
3. Generate rawToken → store SHA-256 hash, set pendingEmail = newEmail, expiry = +1 hour
4. Send confirmation email to newEmail (non-blocking)
5. Return: { message: "A confirmation link has been sent to <newEmail>" }
```

### Confirm Email Change
```
GET /auth/confirm-email-change?token=<rawToken>

1. SHA-256 hash the incoming token
2. Find user where emailChangeToken == hash AND emailChangeExpires > now
3. Double-check pendingEmail not taken by another account (race condition guard)
4. Set email = pendingEmail, emailVerified = true, passwordChangedAt = now
5. Clear pendingEmail + emailChangeToken fields
6. Return: { message: "Email address updated successfully. Please log in again." }
Note: passwordChangedAt invalidates ALL existing sessions
```

### Silent Access Token Rotation
On every authenticated API call:
- If access token has < 5 minutes remaining → issue new access token
- Return new token in `X-New-Access-Token` response header
- Frontend intercepts header and updates stored token

---

## Clock Tolerance

JWT decode uses `clockTolerance: 15` (seconds). Accounts for clock drift between frontend (Vercel) and backend (Hostinger VPS).

---

## Error Codes

All auth errors return a machine-readable `code` for the frontend to switch on:

| Code | HTTP Status | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token expired — frontend should refresh |
| `TOKEN_INVALID` | 401 | Malformed or tampered token |
| `TOKEN_REVOKED` | 401 | Refresh token JTI is blacklisted |
| `REFRESH_TOKEN_MISSING` | 401 | No refresh cookie present |
| `ACCOUNT_NOT_LINKED` | 409 | OAuth email matches existing password account |
| `EMAIL_TAKEN` | 409 | Registration email already in use |
| `ACCESS_DENIED` | 403 | Insufficient role for this resource |
| `EMAIL_NOT_VERIFIED` | 403 | Write access blocked until email is verified |
| `RESEND_COOLDOWN` | 429 | Must wait 2 minutes between resend requests |
| `RESET_RATE_LIMITED` | 429 | Max 1 reset email per hour per email address |
| `ACCOUNT_DEACTIVATED` | 403 | Account has been disabled by an admin |
| `ACCOUNT_LOCKED` | 429 | Locked after 5 failed login attempts (15 min) |
| `INVALID_TOKEN` | 400 | Bad or expired verification/reset/email-change link |
| `ALREADY_VERIFIED` | 400 | Email already verified — resend not needed |
| `OAUTH_ONLY` | 400 | Account uses Google sign-in only — no password to reset |
| `MUST_CHANGE_PASSWORD` | 403 | Admin forced a password change — must reset before proceeding |
| `EMAIL_SEND_FAILED` | 502 | Admin reset email delivery failed — token saved, admin can retry |

---

## Password Policy

Enforced by `lib/passwordStrength.js` using [zxcvbn](https://github.com/dropbox/zxcvbn) (Dropbox's open-source password strength estimator).

| Rule | Value |
|---|---|
| Minimum length | **12 characters** |
| Maximum length | **128 characters** |
| Complexity requirement | **None** — length beats complexity |
| Strength check | **zxcvbn score ≥ 2** (rejects score 0–1) |
| Common passwords blocked | Yes — zxcvbn maintains an internal list of ~30,000 common passwords and patterns |

**Where it applies:** `register`, `reset-password`, `change-password`
**Where it does not apply:** `login` (no strength check on login — only correctness matters)

### Why zxcvbn (NIST 2024 guidance)
- **No arbitrary complexity rules** — uppercase/number/symbol requirements train users to do `Password1!` which is predictably weak
- **Length is the strongest signal** — a long random passphrase beats a short "complex" password every time
- **Contextual checking** — zxcvbn penalises passwords that contain the user's name or email
- **Human-readable feedback** — rejection messages are plain English, not "must contain 1 uppercase"

### Error messages (examples)
```
"Password must be at least 12 characters"
"This is a very common password"
"This is similar to a commonly used password"
"Try a longer passphrase or mix of random words"
```

---

## Security Rules

- Errors NEVER hint at whether email or password was wrong — always `INVALID_CREDENTIALS`
- Full error details are logged server-side only, never sent to client
- Rate limiting on all `/auth/*` routes (see rates per endpoint in API.md)
- Refresh token is HttpOnly + Secure + SameSite=None (cross-domain safe)
- Access token is never stored in cookies — memory or short-lived storage only
- Refresh token JTI is stored as a hash in DB, not plaintext
- Verification and reset tokens stored as SHA-256 hashes — raw token only lives in the email
- `passwordChangedAt` timestamp on User — all sessions issued before this are immediately invalid

---

## Google OAuth (Phase 2 — Not Yet Built)

When added:
- PKCE (`S256`) is mandatory — prevents authorization code interception
- State cookie is a 15-minute JWE — prevents CSRF
- Nonce prevents replay attacks
- **No auto email account linking** — if a Google email matches an existing password account, the user must log in with their password first, then explicitly link Google in Settings
- Implemented entirely in new files — no existing auth files are modified

---

## Token Lifecycle Diagram

```
User logs in
    └─→ POST /auth/login
            └─→ Issue accessToken (15min) + refreshToken (7d)
                    └─→ accessToken → returned in response body
                    └─→ refreshToken → set as HttpOnly cookie

Every API call
    └─→ Authorization: Bearer <accessToken>
            └─→ auth.middleware verifies JWE
            └─→ If < 5min remaining → silently issue new accessToken
                    └─→ X-New-Access-Token header in response

accessToken expires
    └─→ Frontend detects 401 { code: "TOKEN_EXPIRED" }
            └─→ POST /auth/refresh (cookie auto-sent)
                    └─→ Old refreshToken JTI blacklisted
                    └─→ New accessToken + refreshToken issued

User logs out
    └─→ POST /auth/logout
            └─→ refreshToken JTI blacklisted in DB
            └─→ Cookie cleared
            └─→ Frontend discards accessToken from memory
```
