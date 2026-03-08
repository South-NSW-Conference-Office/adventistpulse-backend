# AdventistPulse — Roles, Permissions & Verification Plan
_Last updated: 2026-03-08_

---

## Confirmed Decisions

| Decision | Answer |
|---|---|
| Verifier revocation cascade | ✅ Yes — cascades to all accounts they verified, recursively |
| Verification model | ✅ Hybrid — request OR invite, both-side confirmation |
| Token revocation on role change | ✅ Immediate — JTI blacklisted + cascade blacklist |
| Who can verify Conf/Union | ✅ Conf/Union and above (Union-level scope TBD with Kyle) |
| Who can verify Pro/Pastor | ✅ Conf/Union and above, within their territory |
| Who can verify Verified Member | ✅ Pro/Pastor and above, within their church |
| Email domain fast-tracking | ❌ No |
| Pro/Pastor verification duration | ✅ Annual — must be re-verified every 12 months |
| Free tier definition | ✅ Two free tiers (Open Data + Verified Member) — from pricing matrix |
| Div/GC verification flow | ⏳ Not yet established — placeholder only |
| Union-level Conf/Union verifying Conference-level | ⏳ TBD with Kyle |
| Membership & Tithe Data in Open Data tier | ⏳ TBD with Kyle (flagged for possible removal in pricing doc) |
| 4th platform | ⏳ Unknown — reserved route namespace |

---

## The 6 Tiers

| # | Tier | Price | Platform | Account | Verification |
|---|---|---|---|---|---|
| 0 | **Open Data** | Free | Public website | ❌ None | None |
| 1 | **Verified Member** | Free | Member app | ✅ Required | Pro/Pastor or above in their church |
| 2 | **Pro/Pastor** | $29/mo | Both | ✅ Required | Conf/Union in their territory — **annual renewal** |
| 3 | **Conf/Union** | $199/mo | Conference portal | ✅ Required | Conf/Union or above (Bem for now) |
| 4 | **Div/GC** | Enterprise | All | ✅ Required | Not yet established |
| — | **super_admin** | Internal | All | ✅ Required | Hardcoded — Bem only |

---

## Pro/Pastor Annual Verification

- `verifiedAt` — timestamp of most recent verification
- `verifiedUntil` — `verifiedAt + 365 days`
- **60 days before expiry**: email reminder fires to user + their Conf/Union admin
- **30 days before expiry**: second reminder
- **On expiry**: role downgrades to `open_data` immediately, JTI blacklisted, cascade to their Verified Members
- **Re-verification**: Conf/Union admin re-approves → `verifiedAt` and `verifiedUntil` reset → new token issued
- Schema: `verifiedUntil: Date | null` — null = indefinite (used for Conf/Union and above until policy is set)

---

## Feature Access by Tier (from pricing matrix image)

### Open Data — 19 features (no account required)
Public website, read-only, no personalization:
- Entity pages (every org's profile)
- Membership & Tithe Data — current year ⚠️ *flagged for possible removal from this tier*
- Tithe Flow Sankey Visualiser
- Cross-denominational Comparisons
- Church Celebrations (grace-framed)
- Interactive World Map (zoomable territories)
- Church Directory with Pins
- Territory Boundary Overlays
- LRP Research Summaries
- Full LRP Deep-Dives (15K+ words)
- Check Your Pulse Articles (blog/SEO)
- State of Adventism Annual Report
- Church Manual Interactive Timeline
- Comparison Tool (side-by-side entities)
- Research Quality Scores & Methodology
- Entity Hierarchy Browser
- Institutions Directory
- Intel Cards (read-only, facts with confidence badges)
- Donation Portal (no account required — Stripe, anonymous)

### Verified Member — 12 features (free, account required)
Member app, personalized, community-facing:
- My Church's Pulse (health score for their church)
- Personal Dashboard & Bookmarks
- Notification Alerts (updates on followed entities)
- LRP Voting & Community Contribution
- Pulse Notes (community research)
- 7-Tier Rewards: Data Contribution Points
- 7-Tier Rewards: My Impact Summary
- 7-Tier Rewards: Tier Progression & Badges
- 7-Tier Rewards: Local Authority Designation
- Prayer Wall
- Church Milestones
- Live Pulse Feed (real-time ticker)

### Pro/Pastor — $29/mo (9 features, subscription)
Features across both platforms:
- Historical Data (20+ years)
- Heat Maps (density, growth, decline)
- Demographic Overlays (ABS community data)
- One-Tap Attendance Logger
- Baptism Recording (celebration flow)
- Vitality Check (27-question NCD replacement)
- Pulse Polls (custom surveys)
- Ask Pulse AI (natural language queries) — *rate limited per billing cycle*
- Board Report Preview
- What's Working Nearby
- Pastor Peer Groups
- Historical Time-Series Explorer

### Conf/Union — $199/mo (13 features, subscription)
Conference portal, administrative & analytics:
- Conference Financial Dashboards
- Auto-Generated Board Reports
- Statistical Report Generator
- Vital Signs Reports (any cadence)
- Custom Report Builder
- Intelligence Briefs (conference-specific)
- Conference-wide Vitality Check Aggregate
- Multi-Church Overview Dashboard
- Pastoral Assignment Tracking
- Person Profiles (all conference leaders)
- Predictive Health Alerts
- Church DNA Matching
- EGW/Biblical Integration Layer

### Div/GC — Enterprise (6 features, not yet built)
- Scenario Modelling (What-If)
- API Access (full read/write)
- Division-wide Vitality Check
- White-label Embeddable Widgets
- Real-time Data Feeds
- Intel Cards (create & manage)

---

## Permission Matrix

### Permission Constants (single source of truth)

```
stats.read              — view analytics for assigned entities
stats.read.children     — view analytics for entities below assigned
stats.read.global       — view all analytics globally
stats.create            — add new year's data
stats.update            — edit existing stats
stats.delete            — delete stats records
stats.import            — bulk import CSV/JSON
entities.read           — view entity profiles
entities.create         — add new entities
entities.update         — edit entity info
entities.delete         — delete entities
users.read              — view users in scope
users.create            — invite users
users.update            — edit user roles/access
users.deactivate        — deactivate users
users.verify            — verify/approve tier upgrades in territory
reports.generate        — generate reports
reports.export          — export raw data
settings.read           — view settings panel
settings.update         — change settings
audit.read              — view audit log
intel.read              — read Intel Cards
intel.manage            — create/edit/delete Intel Cards
```

### Role → Permission Matrix

| Permission | open_data | member | pro_pastor | conf_union | div_gc | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| stats.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| stats.read.children | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| stats.read.global | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| stats.create | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| stats.update | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| stats.delete | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| stats.import | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| entities.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| entities.create | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| entities.update | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| entities.delete | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| users.read | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| users.create | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| users.update | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| users.deactivate | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| users.verify | ❌ | ❌ | ✅* | ✅ | ✅ | ✅ |
| reports.generate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports.export | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| settings.read | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| settings.update | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| audit.read | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| intel.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| intel.manage | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

*`users.verify` for Pro/Pastor is scoped to Verified Member only, within their church entity

---

## Cascade Revocation

Revocation is always recursive and asynchronous (background job):

```
1. Admin revokes User A (Conf/Union)
2. Revocation job queued immediately — HTTP response returns 202 Accepted
3. Background job:
   a. Find all users verified by User A
   b. For each: set role → open_data, blacklist their JTI
   c. For each Pro/Pastor in that set: find all Verified Members they verified
   d. Repeat cascade recursively until no more children
   e. Batch-write all JTI blacklist entries in one DB operation
   f. Send email to all affected users: "Your access was revoked — contact your administrator"
4. Admin sees "Revocation complete — N accounts affected" notification
```

**Performance note:** Cascade can affect thousands of accounts. Must be:
- Background job (not synchronous HTTP)
- Single batch DB write for JTI blacklist
- Email queue (not per-user SMTP calls)

---

## Hybrid Verification Flow

### Path A — User Requests Upgrade
```
1. User clicks "Request upgrade" → selects target tier → fills form
   (church name, role/title, supporting context)
2. System identifies correct verifier:
   - Requesting Member → finds Pro/Pastor at that church entity
   - Requesting Pro/Pastor → finds Conf/Union admin for that territory
   - Requesting Conf/Union → Bem (super_admin) notified
3. Verifier receives:
   - In-app notification
   - Email with request details + approve/reject buttons
4. If no action in 7 days → auto-escalate to next level up
5. On approval: role granted, old JTI blacklisted, user notified, new login required
6. On rejection: user notified with reason
```

### Path B — Admin Invites
```
1. Conf/Union admin opens Users panel → Invite User
2. Enters: email, target tier, entity scope
3. System sends invite email with accept link (7-day expiry)
4. User accepts → account created (if new) or role applied (if existing)
5. Role active immediately — no additional approval step
6. Audit log: "Invited by [admin name] on [date]"
```

### Annual Re-verification (Pro/Pastor only)
```
T-60 days: Email to Pro/Pastor + their Conf/Union admin
T-30 days: Second reminder
T-0 (expiry):
  → Role downgraded to open_data
  → JTI blacklisted (immediate logout)
  → Cascade: all Verified Members they verified → downgraded to open_data
  → Email to all affected: "Your verifier's annual renewal lapsed"
Re-verification:
  → Conf/Union admin clicks "Re-verify" in Users panel
  → verifiedAt = now, verifiedUntil = now + 365 days
  → New token issued, user re-logged in
```

---

## User Model — Key Fields

```js
{
  // existing
  email, name, password, isActive,

  // role system
  tier: 'open_data' | 'member' | 'pro_pastor' | 'conf_union' | 'div_gc' | 'super_admin',
  entityAccess: [{
    entityId:    ObjectId,
    entityCode:  String,      // e.g. "SNSW"
    entityLevel: 'gc' | 'division' | 'union' | 'conference' | 'district' | 'church',
    role:        String,      // same as tier at this entity
  }],

  // verification
  verifiedBy:    ObjectId | null,   // userId of who verified them
  verifiedAt:    Date | null,
  verifiedUntil: Date | null,       // null = indefinite; set for pro_pastor = verifiedAt + 365d
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'expired',

  // subscription (Stripe — wired later)
  stripeCustomerId:     String | null,
  stripeSubscriptionId: String | null,
  subscriptionStatus:   'none' | 'active' | 'past_due' | 'canceled',

  // rewards (Verified Member — separate collection)
  // rewardsId: ObjectId → UserRewards collection

  // placeholders (don't build yet)
  divGcPartnerId:   null,
  apiKey:           null,
}
```

---

## Settings Page — Tabs & Visibility

Same design as NLPUM (left sidebar tabs, right content panel, white card, brand-colored active tab):

| Tab | Visible to |
|---|---|
| **General** | super_admin |
| **Security** | super_admin |
| **Roles & Permissions** | super_admin (matrix — super_admin row locked) |
| **Users** | conf_union and above |
| **Verification Queue** | conf_union and above |
| **Notifications** | conf_union and above |
| **Data Import** | conf_union and above |
| **Audit Log** | conf_union and above |
| **Subscription** | conf_union and above (their own billing) |

---

## What Gets Built Now vs Later

### Build now
- Tier model + entityAccess on User
- verifiedBy / verifiedAt / verifiedUntil / verificationStatus fields
- Permission constants, registry, DB matrix
- requirePermission() middleware + usePermission() hook + Guard component
- Hybrid verification flow (request + invite)
- Cascade revocation as background job + batch JTI blacklist
- Annual renewal scheduler for Pro/Pastor
- Settings page → Roles & Permissions tab (NLPUM matrix design)
- Settings page → Users tab + Verification Queue tab

### Design now, build later
- Stripe subscription → role lifecycle (payment fail → cascade downgrade)
- Ask Pulse AI query budget per user per billing cycle
- 7-Tier Rewards subsystem (separate UserRewards collection)
- Annual re-verification email reminders (scheduler)
- Div/GC verification flow

### Leave as nullable placeholder
- verifiedUntil is set for pro_pastor; null for others until policy defined
- divGcPartnerId = null
- apiKey = null (reserved for future API platform)
- 4th platform route namespace /api/v1/platform4/ reserved
