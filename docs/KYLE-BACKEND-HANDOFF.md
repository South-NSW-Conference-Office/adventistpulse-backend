# Backend Integration Handoff — Kyle

Hey Kyle,

I've reviewed your branch and what Bem has built in the backend. You've done a lot of great work — the church profiles, maps, research library, entity pages and the beta signup flow are all solid. Here's what you need to know about connecting it to the backend so the product can actually run in production.

---

## The Short Version

You can't sell this or manage real users without a backend. Here's why, and exactly what to change.

---

## What You Currently Have

### 1. Beta signup → Brevo
Your `/app/api/beta-signup/route.ts` sends signups to Brevo (email marketing). This means:
- Users are stored as **email contacts**, not accounts
- No password, no login, no session
- Kyle manually reviews signups from his laptop
- The "approval dashboard" lives at `http://192.168.233.211:3099` — a local IP that doesn't exist in production and is unreachable by anyone else

### 2. Pastor verification tokens
```ts
const token = Buffer.from(`${email}:${Date.now()}`).toString('base64url')
```
This generates a "token" from the email + timestamp. It's not secret, not stored anywhere, and not verifiable. Anyone who can guess the pattern can confirm or deny any user.

### 3. Static data in the frontend
All your church/entity/stats data is in JSON files bundled with the frontend. This is fine for public read-only data — but any **user-specific, gated, or paid content** cannot work this way. The data is in the browser bundle and anyone can read it regardless of their subscription status.

---

## What the Backend Already Has

Bem has built a production-grade auth + user management system. Here's what exists right now:

| Feature | Backend endpoint | Status |
|---|---|---|
| Register (create account) | `POST /api/v1/auth/register` | ✅ Built |
| Login | `POST /api/v1/auth/login` | ✅ Built |
| Email verification | `GET /api/v1/auth/verify-email?token=...` | ✅ Built |
| Forgot password | `POST /api/v1/auth/forgot-password` | ✅ Built |
| Reset password | `POST /api/v1/auth/reset-password` | ✅ Built |
| Refresh session | `POST /api/v1/auth/refresh` | ✅ Built |
| Logout (revoke tokens) | `POST /api/v1/auth/logout` | ✅ Built |
| Get current user | `GET /api/v1/auth/me` | ✅ Built |
| Onboarding form submit | `POST /api/v1/onboarding/submit` | ✅ Built |
| Onboarding status | `GET /api/v1/onboarding` | ✅ Built |
| Admin: list pending users | `GET /api/v1/admin/approvals` | ✅ Built |
| Admin: approve user | `POST /api/v1/admin/approvals/:id/approve` | ✅ Built |
| Admin: reject user | `POST /api/v1/admin/approvals/:id/reject` | ✅ Built |
| Admin: list all users | `GET /api/v1/admin/users` | ✅ Built |
| Admin: deactivate user | `PATCH /api/v1/admin/users/:id/active` | ✅ Built |
| Admin: change user role | `PATCH /api/v1/admin/users/:id/role` | ✅ Built |

The **user approval lifecycle** is already built:

```
Register → email_unverified
  ↓ click verification email
pending_onboarding
  ↓ submit onboarding form
pending_approval  ← admin notified by email
  ↓ admin approves in dashboard
approved  ← user notified by email
```

If rejected at any point, user gets a rejection email with a reason, and can resubmit.

---

## What Needs to Change in Your Frontend

### 1. Replace the Brevo beta signup with the real register endpoint

**Current (`/app/api/beta-signup/route.ts`):**
```ts
// Posts to Brevo — stores email contact, not a real user account
await fetch('https://api.brevo.com/v3/contacts', { ... })
```

**Change to:**
```ts
// Your /app/beta/page.tsx or a new /app/register/page.tsx
import { apiClient } from '@/lib/api/client'

await apiClient('/api/v1/auth/register', {
  method: 'POST',
  body: JSON.stringify({ name, email, password }),
})
```

You don't need the Next.js API route at all — call the backend directly.

The backend will:
- Create the user account
- Send a verification email automatically (via SMTP, already configured)
- Return a JWT access token

### 2. Your auth pages are already wired — just check the API calls

You already have these pages in your branch:
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/pending-approval`
- `/pending-verification`
- `/onboarding`

Check that each one calls `apiClient` from `lib/api/client.ts` (not raw fetch, and not Brevo). The base URL comes from `NEXT_PUBLIC_API_URL` in `.env.local`.

### 3. The admin dashboard — use the backend

You built a local admin dashboard at port 3099 on your laptop. That's fine for dev, but it needs to work against the real API in production.

The approval endpoints are:
```
GET  /api/v1/admin/approvals          — list pending users
POST /api/v1/admin/approvals/:id/approve
POST /api/v1/admin/approvals/:id/reject   (body: { reason: "..." })
```

You need to be logged in as an admin (`role: 'admin'`) to call these. Bem's account is seeded as super_admin. To make yourself admin, either ask Bem to update your role, or use the seed script once the backend is running.

### 4. Delete `/app/api/beta-signup/route.ts`

Once you're hitting the real backend, the Brevo-based Next.js API route is no longer needed. It also has a hardcoded `pulse@adventist.org.au` email and Kyle's local approval dashboard URL in it — both of which shouldn't be in production code.

---

## The User Model

When a user registers, they get this structure in MongoDB:

```js
{
  name: "Kyle Morrison",
  email: "kyle@adventist.org.au",
  role: "viewer",               // viewer | editor | admin
  emailVerified: false,         // must verify email first
  accountStatus: "approved",    // pending_onboarding → pending_approval → approved | rejected
  entityAccess: [],             // optional array of entity codes they can see
  isActive: true,
}
```

`role` controls **what actions** they can take.
`accountStatus` controls **whether they've been approved** to access the platform.
`entityAccess` can limit them to specific entities (conferences, unions, etc.) — useful if you want to give a conference access to their own data only.

---

## What This Means for Gating Content

Right now all your church/entity data is in JSON files in the frontend. Anyone can open DevTools and read it. For a free public product that's fine. But if you want to:

- Gate certain reports behind a paid tier
- Restrict sensitive stats to approved members only
- Sell access to conference-level dashboards

...you need to move that data to the backend and serve it through authenticated API endpoints. The backend already has `/api/v1/stats/entity/:code` and `/api/v1/stats/rankings` — they're protected by `authMiddleware`. Kyle's public JSON data can stay public, but anything premium should come from the API.

---

## Running the Backend Locally

```bash
cd backend
cp .env.example .env.local   # fill in your MongoDB URI + SMTP
npm install
npm run dev                  # starts on :5001
```

The frontend's `.env.local` already has:
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

So they should talk to each other out of the box.

---

## Summary

| What you built | What to do with it |
|---|---|
| Brevo beta signup | Replace with `POST /api/v1/auth/register` |
| Local admin dashboard (port 3099) | Use backend admin endpoints, build admin UI on top |
| Fake pastor token | Backend has real token + hash + expiry — ask Bem to build a pastor-confirm endpoint |
| Static JSON data (public) | Keep as-is — it's fine for public pages |
| Static JSON data (gated) | Move to backend API endpoints behind auth |
| Auth pages (register, verify, etc.) | Already exist — just wire to `apiClient` |

The backend is solid. You don't need to build any of this yourself — it's done. You just need to point your frontend at it.

— Jarvis

