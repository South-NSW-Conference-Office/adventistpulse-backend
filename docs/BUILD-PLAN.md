# Adventist Pulse — Build Plan

**Status:** In development — separate backend + frontend architecture
**Stack:** Next.js 14 (frontend, Vercel) + Express (backend, Hostinger VPS) + MongoDB + jose + Tailwind
**Updated:** 2026-03-07 — Bem revised architecture from Next.js monorepo to decoupled backend/frontend

> ⚠️ **Architecture Change:** Kyle's original plan used Next.js API routes for the backend and NextAuth for auth. This has been revised. See [ARCHITECTURE.md](./ARCHITECTURE.md), [AUTH.md](./AUTH.md), and [DECISIONS.md](./DECISIONS.md) for full reasoning.

---

## Team

| Person | Domain | Responsibility |
|---|---|---|
| **Kyle** | Product | Direction, content, data sources, review |
| **Neo** | Frontend | Pages, components, charts, maps, data pipeline |
| **Bem** | Backend | Express API, MongoDB, auth, admin, deployment |

---

## What We Have

### Data (massive — this is the moat)
- **93 entities** scraped from adventiststatistics.org (2.2MB master JSON)
- **104 years of SNSW data** (1920-2024) — churches, membership, baptisms, tithe, workers
- **All 9 AU conferences** with 2025 actuals from AUC annual stats
- **SPD entities** — divisions, unions, conferences across South Pacific
- **AUC 2025 annual stats** — 67,381 members, 1,326 baptisms
- Fields per year: Churches, Membership, Baptisms, Professions of Faith, Transfers, Deaths, Dropped, Missing, Tithe, Ordained/Licensed Ministers, and more
- **Nightly scraper** (`scripts/scrape-stats.py`) — one division per night, world church indexed in ~12 nights

### Prototype (proven UX — port to production)
- Rankings page with all 9 conferences
- Conference Vitals (baseball card)
- Harvest Map (cross-denominational, OSM)
- Level navigation: GC → Division → Union → Conference → Church
- Data sources slide-out panel
- QuickStats cards
- Finland case study (69 years of real data)

### App Scaffold (Next.js)
- Auth (NextAuth + MongoDB)
- Entity model (`OrgUnit`)
- API route `/api/entities`
- Entity detail page `/entity/[code]`
- Admin page shell
- Dashboard page shell

---

## Architecture Decision: Decoupled Backend + Frontend

**Frontend:** Next.js 14 on Vercel — pure UI layer, no business logic, calls backend APIs only
**Backend:** Express on Hostinger VPS — owns all business logic, auth, validation, data, APIs

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full folder structure, SOLID/DRY principles, and dependency rules.

### Neo's Domain (Frontend)
- All pages, components, charts, maps
- Fetches everything from backend REST API — no direct DB access
- Design system, responsiveness, UX

### Bem's Domain (Backend)
- Express REST API — all business logic lives here
- MongoDB schema (Mongoose) + repository pattern
- Auth — JWE tokens via `jose`, no NextAuth (see [AUTH.md](./AUTH.md))
- Input validation via Zod (backend only)
- Data ingestion pipeline (JSON → MongoDB)
- Deployment on Hostinger VPS
- Admin panel API + CRUD

---

## Phase 1: Static Data MVP (Neo builds alone — no backend needed)

**Goal:** Ship a working public site with real data, entirely from JSON files.

### Week 1: Core Pages
1. **Landing page** — "The health of every Adventist entity, measured" + search/browse
2. **Entity page `/entity/[code]`** — the universal page that works for any entity level
   - Header: entity name, level badge, parent breadcrumb (SPD → AUC → SNSW)
   - QuickStats bar: membership, churches, baptisms, growth rate (latest year)
   - Level nav tabs: GC → Division → Union → Conference → Church
3. **Conference Vitals** — baseball card, all key metrics, time slider
4. **Rankings** — sortable table of entities at same level (e.g., all AU conferences)

### Week 2: Charts + Analysis
5. **Membership trend chart** (line, multi-year)
6. **Baptism pipeline** (funnel: baptisms → POF → net growth)
7. **Tithe Health Index** (CPI-adjusted giving per member)
8. **Retention Curve** (additions vs losses)
9. **Growth Velocity** (rate of change of rate of change)

### Week 3: Maps + Comparison
10. **Harvest Map** — port from prototype (Leaflet + OSM)
11. **Comparative Benchmark** — entity vs peers
12. **Denominational Benchmark** — Adventist vs other churches (Census data)

### Week 4: Polish + Launch
13. **ShareCards** — OG image generation for social sharing
14. **Responsive mobile** — Kyle reviews everything on phone
15. **SEO** — every entity page is indexable, metadata optimised
16. **Deploy** — Vercel or similar

### Data Strategy for Phase 1
- JSON files in `data/` folder
- Next.js API routes read JSON, filter by entity code, return to frontend
- No MongoDB needed yet — ship faster
- When Bem is ready, API routes switch from JSON → MongoDB with zero frontend changes

---

## Phase 2: Backend + Admin (Bem builds)

See [API.md](./API.md) for full endpoint reference and [ARCHITECTURE.md](./ARCHITECTURE.md) for folder structure.

### What Bem Needs to Build

#### 1. Database Models
- `OrgUnit` — entity hierarchy (GC → Division → Union → Conference → Church)
- `YearlyStats` — full stat record per entity per year (membership, baptisms, tithe, workers)
- `User` — auth users with roles (admin / editor / viewer) and entityAccess
- `TokenBlacklist` — revoked refresh token JTIs (TTL-indexed, auto-cleans)

#### 2. Auth System
Full auth via JWE tokens (jose) — no NextAuth. See [AUTH.md](./AUTH.md).
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET  /auth/me`
- Google OAuth — Phase 3 (added without modifying existing auth files)

#### 3. API Endpoints
```
GET    /entities                        — list all (filterable by level, parent)
GET    /entities/:code                  — single entity + latest stats
GET    /entities/:code/stats            — all yearly stats (filterable by year range)
GET    /entities/:code/children         — child entities + latest stats
GET    /stats/rankings                  — ranked list by metric + year
POST   /entities                        — create entity (admin)
PUT    /entities/:code                  — update entity (admin/editor)
POST   /stats/import                    — bulk import from JSON (admin)
```

#### 4. Data Ingestion Script
- Read `data/master/adventist-statistics-org.json` → populate OrgUnit + YearlyStats
- Idempotent (safe to re-run — upserts, not inserts)
- Handles 93 entities × 100+ years = ~9,000+ stat records

#### 5. Admin Panel API
- Entity CRUD
- Bulk data upload (CSV / JSON)
- User management (roles, entityAccess)
- Data source tracking

#### 6. Deployment
- MongoDB Atlas — `adventistpulse_dev` (dev), `adventistpulse` (prod)
- Backend on Hostinger VPS
- Frontend on Vercel
- Custom domain: adventistpulse.com (when ready)

---

## Phase 3: Advanced Features

- **Pulse Vitality Check** — NCD-equivalent church health diagnostic
- **Pulse Polls** — verified member polling at every level
- **Pulse Notes** — qualitative feedback from members
- **Pulse Field Agents** — contributor/gamification system (7 tiers + Luminary)
- **AI natural language queries** — "Show me all conferences where baptisms declined 3+ years"
- **"State of Adventism" annual report** — auto-generated from data
- **Shareable stat cards** — social media optimised images with live data

---

## Immediate Next Steps

### Neo (tonight / this week)
1. ✅ Write this build plan
2. Port rankings page from prototype → Next.js `/rankings`
3. Build entity page `/entity/[code]` with JSON-backed API routes
4. Build Conference Vitals component
5. Build QuickStats bar component
6. Set up proper data layer (read from JSON, types defined)
7. Get charts working (recharts or chart.js)

### Bem (backend — in progress)
1. ✅ Architecture + auth design documented
2. ✅ Docs updated (ARCHITECTURE.md, AUTH.md, API.md, DECISIONS.md)
3. Build backend: config → models → repositories → services → controllers → routes
4. Build auth module (register, login, refresh, logout)
5. Build entities + stats API
6. Build data ingestion script
7. Deploy to Hostinger VPS

### Kyle
1. Send through any remaining data sources
2. Review as pages go live
3. Decide on domain (adventistpulse.com?)
4. Line up first external reviewer (Boris?)

---

## Design System (Pulse — separate from ACS)

- **Dark theme** — deep navy/slate backgrounds
- **Accent:** electric blue or teal (NOT orange — that's ACS)
- **Typography:** Inter or similar clean sans-serif
- **Charts:** consistent colour palette across all views
- **Cards:** subtle glass-morphism or clean bordered
- **Mobile-first:** Kyle reviews everything on phone

*Detailed style guide: `pulse-ui-styleguide.md`*
