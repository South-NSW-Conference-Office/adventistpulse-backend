# Adventist Pulse — Backend

Express API server for Adventist Pulse. Deployed on Hostinger VPS. Serves the Next.js frontend on Vercel.

## Docs

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Folder structure, SOLID/DRY principles, dependency flow |
| [AUTH.md](./docs/AUTH.md) | JWT strategy, token lifecycle, auth flows |
| [API.md](./docs/API.md) | All endpoints, request/response shapes, error codes |
| [DECISIONS.md](./docs/DECISIONS.md) | Why we made key technical decisions |

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose) — `adventistpulse_dev` (dev), `adventistpulse` (prod)
- **Auth:** `jose` (JWE tokens) + `bcryptjs`
- **Validation:** `zod`
- **Security:** `helmet`, `cors`, `express-rate-limit`

## Getting Started

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # starts on :5000 with nodemon
```

## Environment Variables

See `.env.example` for all required variables. All vars are validated at startup via Zod — the server will not start with missing or malformed config.

## Scripts

```bash
npm run dev      # development (nodemon)
npm start        # production
npm test         # run tests
```

## Principles

- **No business logic in controllers** — HTTP layer only
- **No Mongoose outside repositories** — data access layer only  
- **No `process.env` outside `config/env.js`** — single source of truth
- **No inline JWT calls** — always through `lib/jwt.js`
- **All request bodies validated** — Zod schema required on every POST/PUT/PATCH
