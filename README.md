# Swimma

Multi-tenant swimming club management platform: membership, scheduling,
attendance, billing, cash ledger, coach payroll, and promo announcements, for
admin/coach/parent roles. One deployment can serve many independent clubs
(tenants), each with its own isolated data and branding.

Stack: Next.js (App Router) + TypeScript, Supabase Postgres with Row Level
Security, Tailwind CSS, Vercel deployment.

## Multi-tenancy model

Every club is a row in `tenants`. All club-owned data (profiles, locations,
class types, children, classes, bookings, packages, subscriptions, invoices,
cash ledger, payroll, promo) carries a `tenant_id` and is isolated by
Postgres Row Level Security — the database, not the frontend, is the
isolation boundary. `current_tenant_id()` reads the tenant id embedded in the
caller's session JWT, and every RLS policy filters by it; cross-tenant
foreign key references (e.g. a booking's child and class must belong to the
same tenant) are additionally rejected by trigger checks at write time.

A profile (login identity) belongs to exactly one tenant with one role
(admin/coach/parent). The same email address can hold separate accounts in
different clubs. A club's own name, logo, and primary color live in
`tenants` and are edited from Admin -> Pengaturan; they are not environment
variables.

## Auth model

Authentication is **custom** (bcrypt password hashes in our own
`auth_credentials` table), not Supabase Auth. On login (email + password +
club code), the server verifies the password and mints its own JWT signed
with the Supabase project's JWT secret, carrying `sub` (profile id),
`tenant_id`, and `app_role` (admin/coach/parent). That JWT is stored in an
httpOnly cookie and attached as the `Authorization` header on every Supabase
request, so Postgres RLS (`auth.uid()`, `auth.jwt()`) enforces both role and
tenant scoping exactly as it would with Supabase Auth.

**Before running migrations against a real project**, check Project
Settings → API → JWT Keys. This setup requires the legacy shared **HS256
JWT secret** to be available (`SUPABASE_JWT_SECRET`). If a project only has
asymmetric JWT signing keys enabled and no legacy secret, self-minted HS256
tokens won't validate against PostgREST — in that case use Supabase's
Third-Party Auth (JWKS) support instead of `lib/auth/jwt.ts` as written.

The service-role key is used only in a few narrow, reviewed places (never in
client-reachable code): login lookup, creating a parent/coach account
together with its credentials row, the monthly invoice-generation cron and
its "generate now" admin button. Every other read/write goes through the
per-request JWT-bound client, so RLS is the real security boundary. Every
service-role write to a tenant-scoped table passes `tenant_id` explicitly
(the service-role client has no session JWT for `current_tenant_id()` to
read).

Deactivating an account (`profiles.is_active = false`) cuts off all DB
access immediately, even though its JWT technically hasn't expired — this is
enforced inside the `is_admin()` / `is_coach()` / `is_parent()` SQL helper
functions, not just in individual policies.

## Local setup

1. Create a Supabase project.
2. Enable extensions `pgcrypto`, `btree_gist`, `pg_trgm` (the first migration
   does this automatically if the project allows it).
3. Apply the SQL migrations in `supabase/migrations/` in order (via the
   Supabase CLI, `supabase db push`, or pasting them into the SQL editor in
   order).
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
     Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API (server-only,
     never expose to the client).
   - `SUPABASE_JWT_SECRET` — Project Settings → API → JWT Keys (legacy
     secret; see the note above).
   - `CRON_SECRET` — any random string; Vercel Cron sends it automatically
     as a bearer token once set as an env var on the project.
   - `NEXT_PUBLIC_APP_NAME` — optional; the platform name shown before a
     club is selected (login screen, browser tab). Defaults to "Swimma".
5. Onboard the first club and its admin account:
   ```bash
   SEED_TENANT_SLUG=my-club SEED_TENANT_NAME="My Club" \
   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=ChangeMe123 \
   npm run seed:admin
   ```
   Run it again with a different `SEED_TENANT_SLUG` to onboard another club
   onto the same deployment/database.
6. `npm run dev` and log in at `/login` with the club code, email, and
   password.

## Deploying to Vercel

Create a Vercel project linked to this repo, set the same environment
variables there, and deploy. `vercel.json` already schedules the monthly
invoice-generation cron (`/api/cron/generate-invoices`, 1st of each month),
which generates invoices for every active tenant in one run.

## Onboarding a new club

Because isolation is enforced at the database level (RLS + `tenant_id`),
new clubs are onboarded onto the **same** deployment and Supabase project —
no new Supabase project or Vercel deployment needed. Two ways in:

- **Self-service** (`/daftar`): a club owner fills in club name, club code,
  their own name/email/password, and is logged straight into their new
  `/admin` — no admin-side setup needed. The new tenant starts on the
  **Trial** plan (14 days, capped at 20 active children, enforced by a DB
  trigger on `children` inserts, not just in the UI).
- **Manual** (`npm run seed:admin` with a new `SEED_TENANT_SLUG`/
  `SEED_TENANT_NAME`) — still available for onboarding a club yourself
  without going through the public form.

Either way, the new admin sets their own club name/logo/color from Admin ->
Pengaturan.

## Platform billing (superadmin)

Swimma-the-product bills clubs, separately from how a club bills its own
parents. This is a distinct actor from `admin`/`coach`/`parent` — a
superadmin is **not** tied to any tenant and manages every club's plan and
payment status from its own portal, `/superadmin`.

- Bootstrap the first superadmin (chicken-and-egg — there's no UI for this,
  by design):
  ```bash
  SEED_SUPERADMIN_EMAIL=you@example.com SEED_SUPERADMIN_PASSWORD=ChangeMe123 \
  npm run seed:superadmin
  ```
- Log in at `/superadmin/login` (separate session cookie and JWT shape from
  club logins — a superadmin session carries no `tenant_id`/`app_role` and
  is never used as a Supabase bearer token; every superadmin query goes
  through the service-role client, not RLS).
- `/superadmin` lists every club with its plan, status (trial / active /
  suspended / cancelled), member count vs. plan limit, and trial end date.
  Changing a club to **suspended** also flips `tenants.is_active = false`,
  which immediately blocks login for every user in that club (the same
  flag already checked by `/api/auth/login`) — this is the actual
  enforcement mechanism, not just a label.
- Plans live in `platform_plans` (seeded with "Trial" and "Berbayar") —
  edit prices/limits there as the pricing model firms up; no code changes
  needed to add a new plan tier.
- There's no payment gateway wired up yet — moving a club from trial to
  active is a manual step a superadmin takes after being paid outside the
  app (bank transfer, invoice, etc.), the same "mark paid manually" pattern
  the app already uses for a club's own parent invoices.

### Pricing model

Prices in `platform_plans` (Starter/Growth/Pro) are cost-derived, not
arbitrary, so the platform stays solvent even with generous trials:

- **Fixed monthly infra floor** (one deployment serves every tenant, so
  this cost doesn't scale per club): Vercel Pro ≈ $24/mo, Supabase Pro ≈
  $25/mo, plus a usage/overage buffer ≈ $20–30/mo → **≈ Rp 1,300,000/bulan**
  at ≈ Rp 17,900/USD (verify current pricing/FX before relying on this —
  it was checked once, not live-monitored).
- **Marginal cost per additional tenant is ≈ Rp 0** — a trial club or a
  discounted club doesn't add hosting spend, it only forgoes revenue it
  wouldn't otherwise have paid. The real risk isn't "one discount," it's
  not having enough paying clubs to clear the fixed floor above.
- **Break-even**: roughly 2 Growth-tier clubs, or 1 Pro-tier club, or ~5
  Starter-tier clubs, covers the entire infra floor. Every paying club
  beyond that is >90% margin (support time aside), since nothing scales
  per-tenant until real usage growth pushes Supabase/Vercel into a higher
  tier.
- Starter is intentionally priced as an acquisition tier (small clubs,
  thin margin alone); Growth/Pro are what carry the platform's margin.

## Notes / out of scope

- Swim competition (lomba renang) tracking is intentionally not built, but
  nothing in the schema (e.g. `class_types`) assumes it can't be added
  later.
- WhatsApp and payment-gateway integrations are left as TODOs — invoices are
  marked paid manually by an admin for now.
- No self-registration: admin creates parent and coach accounts (with a
  temporary password that must be changed on first login) since letting
  parents register themselves would undermine the duplicate-child check.

## Changelog

### 2026-09-26 (2)

- Real cost-derived pricing tiers (Starter/Growth/Pro) replacing the
  placeholder flat plan, seeded via `20250101000011_pricing_tiers.sql`; see
  "Pricing model" above for the break-even math.
- Narrow RLS read policies so a tenant admin can see `platform_plans` and
  their **own** `platform_subscriptions` row (still no update access —
  upgrades stay superadmin-only).
- Landing page: new "Harga" pricing section (4 tiers, all CTAs route to the
  real `/daftar` trial signup — no fake checkout).
- Admin dashboard: a plan/upgrade banner showing trial countdown, member
  usage vs. limit, and the paid tiers as an upgrade offer.

### 2026-09-26

- Platform-to-club billing mechanism: new `superadmins`, `platform_plans`,
  `platform_subscriptions` tables (migration
  `20250101000010_platform_billing.sql`), a separate `/superadmin` portal
  (own login/session, service-role only, no tenant scoping) to set each
  club's plan/status, and a DB-enforced trial member limit on `children`
  inserts.
- Self-service club onboarding at `/daftar` — a club owner signs up
  directly (no admin-side setup), lands on the Trial plan, and is logged
  straight into `/admin`. Landing page CTAs updated ("Daftarkan Klub Anda").
- `scripts/seed-superadmin.ts` (`npm run seed:superadmin`) to bootstrap the
  first superadmin account.

### 2026-09-22

- Added `frontend-design`, `bencium-innovative-ux-designer`, `design-audit`
  skills under `.claude/skills/`.
- Admin dashboard (`/admin`) now shows live KPIs, overdue/expiring alerts,
  today's classes, recent cash entries, and quick actions (was a static
  welcome card).
- Search/filter added to the members, coaches, schedule, subscriptions, and
  invoices list pages.
- New session-pack billing mode (N sessions / X weeks) alongside the
  existing recurring `billing_cycle` packages — additive migration
  `20250101000009_session_packages.sql`, a `subscription_usage` view, and a
  fix to `generate_invoices_for_period` so it never double-bills
  session-pack subscribers.
- Light/dark theme (`next-themes`).
- Add/manage flows switched from dedicated pages and always-visible inline
  forms to dialogs (native `<dialog>`, Next.js intercepting routes for
  members/coaches/schedule).
- Public marketing landing page at `/` (hero, features, how-it-works,
  multi-tenant section, dashboard preview, CTA, footer); an authenticated
  session still redirects straight to its role home, and `/login` is
  unchanged.
