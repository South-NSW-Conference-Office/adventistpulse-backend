# Adventist Pulse — API Reference

> **Base URL (production):** `https://api.adventistpulse.com`  
> **Base URL (local):** `http://localhost:5000`  
> **Auth:** Bearer token in `Authorization` header  
> **Content-Type:** `application/json`  
> **Last Updated:** 2026-03-07

---

## Response Format

All responses follow a consistent shape:

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Paginated
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 93,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Auth Routes `/auth`

### POST `/auth/register`
Create a new user account.

**Rate limit:** 10 req / 15 min per IP

**Body:**
```json
{
  "name": "Bem",
  "email": "bem@snsw.org",
  "password": "min8chars"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "id": "...",
      "name": "Bem",
      "email": "bem@snsw.org",
      "role": "viewer"
    },
    "isNewUser": true
  }
}
```

**Errors:** `EMAIL_TAKEN` (409), `VALIDATION_ERROR` (400)

---

### POST `/auth/login`
Authenticate and receive tokens.

**Rate limit:** 10 req / 15 min per IP

**Body:**
```json
{
  "email": "bem@snsw.org",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "id": "...",
      "name": "Bem",
      "email": "bem@snsw.org",
      "role": "admin"
    },
    "isNewUser": false
  }
}
```
**Sets:** `refresh_token` HttpOnly cookie (7 days)

**Errors:** `INVALID_CREDENTIALS` (401), `VALIDATION_ERROR` (400)

---

### POST `/auth/refresh`
Exchange refresh token cookie for a new access token.

**Requires:** `refresh_token` cookie (sent automatically by browser)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```
**Sets:** New `refresh_token` cookie (old one revoked)

**Errors:** `REFRESH_TOKEN_MISSING` (401), `TOKEN_REVOKED` (401), `TOKEN_INVALID` (401)

---

### POST `/auth/logout`
Revoke refresh token and clear session.

**Requires:** `refresh_token` cookie

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```
**Clears:** `refresh_token` cookie + blacklists JTI in DB

---

### GET `/auth/me`
Get current user profile.

**Requires:** Bearer token

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Bem",
    "email": "bem@snsw.org",
    "role": "admin",
    "entityAccess": ["SNSW", "AUC"]
  }
}
```

---

## Admin Routes `/admin`

All admin routes require a valid Bearer token with `role: "admin"`.

### GET `/admin/users`
List all users (paginated).

**Requires:** Bearer token + admin role

**Query params:**
| Param | Type | Description |
|---|---|---|
| `role` | string | Filter by role: `admin`, `editor`, `viewer` |
| `isActive` | boolean | Filter by active state |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Response `200`:** Paginated list of user objects

---

### POST `/admin/users/:id/reset-password`
Force a password reset for any user. Sends an email with a reset link and sets `mustChangePassword: true`.

**Requires:** Bearer token + admin role

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent to user@example.com"
  }
}
```

**Errors:**
- `NOT_FOUND` (404) — user doesn't exist
- `ACCOUNT_DEACTIVATED` (400) — cannot reset a deactivated account
- `OAUTH_ONLY` (400) — account has no password (Google sign-in only)
- `EMAIL_SEND_FAILED` (502) — SMTP delivery failed; token is saved, admin can retry

---

### PATCH `/admin/users/:id/active`
Activate or deactivate a user account.

**Requires:** Bearer token + admin role

**Body:**
```json
{ "isActive": false }
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "message": "User deactivated" }
}
```

**Errors:** `SELF_DEACTIVATION` (400) — admins cannot deactivate their own account

---

### PATCH `/admin/users/:id/role`
Update a user's role and/or entity access.

**Requires:** Bearer token + admin role

**Body:**
```json
{
  "role": "editor",
  "entityAccess": ["SNSW", "AUC"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "message": "User updated" }
}
```

**Errors:** `SELF_ROLE_CHANGE` (400) — admins cannot change their own role

---

## Entity Routes `/entities`

### GET `/entities`
List all entities. Filterable by level and parent.

**Requires:** Bearer token  
**Roles:** viewer, editor, admin

**Query params:**
| Param | Type | Description |
|---|---|---|
| `level` | string | `gc`, `division`, `union`, `conference`, `church` |
| `parentCode` | string | Filter by parent entity code |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20, max: 100 |

**Response `200`:** Paginated list of entities

---

### GET `/entities/:code`
Get a single entity with its latest stats.

**Requires:** Bearer token

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "code": "SNSW",
    "name": "South NSW Conference",
    "level": "conference",
    "parentCode": "AUC",
    "latestStats": { ... },
    "metadata": { ... }
  }
}
```

**Errors:** `NOT_FOUND` (404)

---

### GET `/entities/:code/stats`
Get all yearly stats for an entity.

**Requires:** Bearer token

**Query params:**
| Param | Type | Description |
|---|---|---|
| `from` | number | Start year (e.g. 2000) |
| `to` | number | End year (e.g. 2024) |

**Response `200`:** Array of yearly stat objects

---

### GET `/entities/:code/children`
Get all direct child entities with their latest stats.

**Requires:** Bearer token

**Response `200`:** Array of child entities

---

### POST `/entities`
Create a new entity.

**Requires:** Bearer token  
**Roles:** admin only

**Body:**
```json
{
  "code": "SNSW",
  "name": "South NSW Conference",
  "level": "conference",
  "parentCode": "AUC",
  "metadata": {
    "region": "New South Wales",
    "country": "Australia",
    "established": 1902
  }
}
```

**Errors:** `VALIDATION_ERROR` (400), `ACCESS_DENIED` (403)

---

### PUT `/entities/:code`
Update an entity.

**Requires:** Bearer token  
**Roles:** admin, editor

---

## Stats Routes `/stats`

### GET `/stats/rankings`
Get ranked list of entities by metric.

**Requires:** Bearer token

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `level` | string | ✅ | Entity level to rank |
| `metric` | string | ✅ | `baptisms`, `growth_rate`, `tithe_per_member`, `retention` |
| `year` | number | ✅ | Stats year |
| `parentCode` | string | ❌ | Filter to children of this entity |
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 20 |

**Response `200`:** Paginated ranked list

---

### POST `/stats/import`
Bulk import yearly stats from JSON.

**Requires:** Bearer token  
**Roles:** admin only

**Body:**
```json
{
  "entityCode": "SNSW",
  "stats": [
    {
      "year": 2024,
      "churches": 42,
      "membership": { "beginning": 4800, "ending": 4950, "baptisms": 210 },
      "finance": { "tithe": 3200000 }
    }
  ]
}
```

---

## Silent Token Rotation

If an access token has less than 5 minutes until expiry, the server will issue a new one automatically. Check for this header on every response:

```
X-New-Access-Token: eyJ...
```

Frontend should store and use this token going forward.

---

## Error Code Reference

| Code | HTTP | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `TOKEN_INVALID` | 401 | Malformed or tampered token |
| `TOKEN_REVOKED` | 401 | Refresh token has been revoked |
| `REFRESH_TOKEN_MISSING` | 401 | No refresh cookie present |
| `ACCOUNT_NOT_LINKED` | 409 | OAuth email matches existing account |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `ACCESS_DENIED` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `RATE_LIMITED` | 429 | Too many requests |
| `RESET_RATE_LIMITED` | 429 | Max 1 reset email per hour per email address |
| `RESEND_COOLDOWN` | 429 | Must wait 2 minutes between verification resend requests |
| `ACCOUNT_LOCKED` | 429 | Locked after 5 failed login attempts (15 min lockout) |
| `ACCOUNT_DEACTIVATED` | 403 | Account has been disabled by an admin |
| `INVALID_TOKEN` | 400 | Bad or expired verification / reset / email-change link |
| `ALREADY_VERIFIED` | 400 | Email already verified — resend not needed |
| `OAUTH_ONLY` | 400 | Account uses Google sign-in only — no password to reset |
| `MUST_CHANGE_PASSWORD` | 403 | Admin forced a password change — user must reset before continuing |
| `SELF_DEACTIVATION` | 400 | Admin attempted to deactivate their own account |
| `SELF_ROLE_CHANGE` | 400 | Admin attempted to change their own role |
| `EMAIL_SEND_FAILED` | 502 | SMTP delivery failed on admin-initiated reset — token saved, retry is safe |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
