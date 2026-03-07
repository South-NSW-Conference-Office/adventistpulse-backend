# Adventist Pulse — Backend Architecture

> **Owner:** Bem  
> **Stack:** Node.js + Express + MongoDB (Mongoose) + jose  
> **Deployment:** Hostinger VPS  
> **Last Updated:** 2026-03-07

---

## Overview

The backend is a standalone Express API server deployed on a Hostinger VPS. It serves the Next.js frontend hosted on Vercel. The two are completely decoupled — the frontend is a dumb UI layer. All business logic, validation, auth, and data processing lives here.

---

## Core Principles

### SOLID
- **S — Single Responsibility:** Controller = HTTP only. Service = business logic only. Repository = DB only. Each file has one reason to change.
- **O — Open/Closed:** New features (e.g. Google OAuth) are added by extension — new files only, existing files untouched.
- **L — Liskov Substitution:** Any repository can be swapped (MongoDB → PostgreSQL) without touching services.
- **I — Interface Segregation:** Nothing depends on methods it doesn't use. Read and write concerns are separated.
- **D — Dependency Inversion:** Services depend on repository abstractions, not Mongoose directly. Enables mocking for tests.

### DRY
Every piece of knowledge has a single, unambiguous home:
- JWT logic → `lib/jwt.js` only
- Password hashing → `lib/crypto.js` only
- Env vars → `config/env.js` only
- Error types → `core/errors/index.js` only
- Response format → `core/response.js` only
- Logger → `core/logger.js` (singleton) only
- Validation schemas → `validators/*.js` only
- Base CRUD → `repositories/base.repository.js` only

---

## Dependency Flow

```
routes → controllers → services → repositories → models
              ↓              ↓
          middleware        lib/ (jwt, crypto, paginate)
              ↓
           core/ (errors, logger, response)
```

**Rules — one direction only:**
- Controllers never import repositories
- Services never import `express` or touch `req`/`res`
- Repositories never import services
- `core/` imports nothing from the project — it's the foundation

---

## Folder Structure

```
backend/
├── src/
│   ├── index.js                          ← Entry point only (starts server)
│   ├── app.js                            ← Express setup only (middleware stack)
│   │
│   ├── config/
│   │   ├── env.js                        ← Single source of truth for all env vars (Zod validated on startup)
│   │   ├── db.js                         ← MongoDB connection (imported once)
│   │   └── cors.js                       ← CORS policy (one place to change allowed origins)
│   │
│   ├── core/                             ← Framework-agnostic. No Express, no Mongoose here.
│   │   ├── errors/
│   │   │   ├── AppError.js               ← Base error class (type, statusCode, isOperational, publicMessage)
│   │   │   ├── AuthError.js              ← Extends AppError (InvalidCredentials, TokenExpired, AccountNotLinked, etc.)
│   │   │   ├── ValidationError.js        ← Extends AppError
│   │   │   ├── NotFoundError.js          ← Extends AppError
│   │   │   ├── ForbiddenError.js         ← Extends AppError
│   │   │   └── index.js                  ← Re-exports all errors (single import point)
│   │   ├── logger.js                     ← Singleton structured logger (error / warn / debug)
│   │   └── response.js                   ← Single response formatter (success / error / paginated)
│   │
│   ├── lib/                              ← Shared utilities — pure functions, no side effects
│   │   ├── jwt.js                        ← ALL JWT logic (JWE encode/decode, HKDF, rotation, blacklist check)
│   │   ├── crypto.js                     ← ALL password hashing (bcrypt hash + compare)
│   │   └── paginate.js                   ← Reusable pagination helper
│   │
│   ├── validators/                       ← Zod schemas — single source of truth for data shape
│   │   ├── auth.validator.js             ← login, register, refresh, changePassword schemas
│   │   ├── entity.validator.js           ← OrgUnit create/update schemas
│   │   └── stats.validator.js            ← YearlyStats create/update schemas
│   │
│   ├── models/                           ← Mongoose models only — no business logic
│   │   ├── User.js
│   │   ├── OrgUnit.js
│   │   ├── YearlyStats.js
│   │   └── TokenBlacklist.js             ← Stores blacklisted refresh token JTIs
│   │
│   ├── repositories/                     ← Data access layer — the ONLY place Mongoose is called
│   │   ├── base.repository.js            ← DRY: findById, findOne, find, create, update, delete, paginate
│   │   ├── user.repository.js            ← Extends base — adds findByEmail, linkOAuthAccount
│   │   ├── entity.repository.js          ← Extends base — adds findByCode, findByLevel, findChildren
│   │   ├── stats.repository.js           ← Extends base — adds findByEntityAndYear, findRange
│   │   └── tokenBlacklist.repository.js  ← Extends base — adds isBlacklisted, blacklist, prune
│   │
│   ├── services/                         ← Business logic — depends on repositories, never on Mongoose
│   │   ├── base.service.js               ← DRY: wraps repo calls with consistent error handling
│   │   ├── token.service.js              ← SRP: ONLY token concerns (issue, verify, refresh, blacklist, rotate)
│   │   ├── auth.service.js               ← SRP: ONLY auth concerns — calls token.service + user.repository
│   │   ├── entity.service.js             ← SRP: ONLY entity business logic
│   │   └── stats.service.js              ← SRP: ONLY stats computation (growth rate, tithe index, rankings, etc.)
│   │
│   ├── controllers/                      ← HTTP layer ONLY — parse req, call service, send res
│   │   ├── base.controller.js            ← DRY: asyncHandler wrapper, sends via response.js
│   │   ├── auth.controller.js            ← Calls auth.service, returns shaped response
│   │   ├── entity.controller.js          ← Calls entity.service
│   │   └── stats.controller.js           ← Calls stats.service
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js            ← Verifies JWT via token.service
│   │   ├── role.middleware.js            ← Checks role from verified token
│   │   ├── validate.middleware.js        ← Runs Zod schema from validators/ against req.body
│   │   ├── rateLimit.middleware.js       ← Rate limiting (auth routes: strict, API routes: relaxed)
│   │   └── error.middleware.js           ← Catches ALL errors, formats via response.js, logs via logger.js
│   │
│   └── routes/
│       ├── index.js                      ← Aggregates all routes (single mount point in app.js)
│       ├── auth.routes.js                ← /auth/*
│       ├── entity.routes.js              ← /entities/*
│       └── stats.routes.js               ← /stats/*
│
├── tests/
│   ├── unit/
│   │   ├── services/                     ← Test services with mock repositories
│   │   └── lib/                          ← Test jwt.js, crypto.js, paginate.js in isolation
│   └── integration/
│       └── routes/                       ← Full request/response cycle tests
│
├── docs/
│   ├── ARCHITECTURE.md                   ← This file
│   ├── AUTH.md                           ← Auth flow, JWT strategy, token lifecycle
│   ├── API.md                            ← All endpoints, request/response shapes
│   └── DECISIONS.md                      ← Why we made key technical decisions
│
├── .env
├── .gitignore
└── package.json
```

---

## Adding New Features (OCP in Practice)

### Adding Google OAuth (Phase 2)
No existing files are modified. Add only:
```
lib/oauth.js                       ← PKCE, state, nonce helpers
services/oauth.service.js          ← Google token exchange + account linking logic
controllers/oauth.controller.js    ← OAuth callback handler
routes/oauth.routes.js             ← /auth/google, /auth/google/callback
validators/oauth.validator.js      ← Google callback schema
```

### Adding a New Data Module (e.g. `/reports`)
```
validators/report.validator.js
models/Report.js
repositories/report.repository.js
services/report.service.js
controllers/report.controller.js
routes/report.routes.js
```
Then add one line to `routes/index.js`. Nothing else changes.

---

## Technical Debt Prevention Rules

| Rule | Where Enforced |
|---|---|
| No business logic in controllers | Code review |
| No raw `console.log` — use `logger` | ESLint |
| No direct `process.env` access — use `config/env.js` | ESLint + code review |
| No inline JWT calls — use `lib/jwt.js` | Code review |
| No Mongoose calls outside repositories | Code review |
| All request bodies must pass a named Zod validator | Required middleware on all POST/PUT/PATCH |
| All async routes wrapped in `asyncHandler` | `base.controller.js` enforces this |
| All new error types extend `AppError` | Code review |
| No duplicate error codes — codes are an enum | `core/errors/index.js` |
