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
new clubs are onboarded onto the **same** deployment and Supabase project
by running `npm run seed:admin` again with a new `SEED_TENANT_SLUG`/
`SEED_TENANT_NAME` — no new Supabase project or Vercel deployment needed.
The new admin then sets their own club name/logo/color from Admin ->
Pengaturan.

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
