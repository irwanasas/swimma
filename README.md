# Bugarswim

Swimming club management app: membership, scheduling, attendance, billing,
cash ledger, coach payroll, and promo announcements, for admin/coach/parent
roles.

Now Live at https://n-1repo.github.io/bugarswim/

Stack: Next.js (App Router) + TypeScript, Supabase Postgres with Row Level
Security, Tailwind CSS, Vercel deployment.

## Auth model

Authentication is **custom** (bcrypt password hashes in our own
`auth_credentials` table), not Supabase Auth. On login, the server verifies
the password and mints its own JWT signed with the Supabase project's JWT
secret, carrying `sub` (user id) and `app_role` (admin/coach/parent). That
JWT is stored in an httpOnly cookie and attached as the `Authorization`
header on every Supabase request, so Postgres RLS (`auth.uid()`,
`auth.jwt()`) enforces access exactly as it would with Supabase Auth.

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
per-request JWT-bound client, so RLS is the real security boundary.

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
   - `NEXT_PUBLIC_CLUB_NAME` — optional; the name shown on the login page,
     sidebar header, and browser tab. Defaults to "Bugarswim" if unset.
5. Seed the first admin account:
   ```bash
   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=ChangeMe123 npm run seed:admin
   ```
6. `npm run dev` and log in at `/login`.

## Deploying to Vercel

Create a Vercel project linked to this repo, set the same environment
variables there, and deploy. `vercel.json` already schedules the monthly
invoice-generation cron (`/api/cron/generate-invoices`, 1st of each month).

## Reusing this codebase for a new client

This app is currently **single-tenant**: one deployment and one Supabase
project serves one club's data, with no `club_id`/organization concept
anywhere in the schema. To onboard a new client today, deploy a separate
instance from this same codebase rather than adding them to an existing
one:

1. Create a new Supabase project for the client and repeat the **Local
   setup** steps above against it (migrations, env vars, seed admin).
2. Set `NEXT_PUBLIC_CLUB_NAME` to the new client's name.
3. Re-theme `app/globals.css` — the color tokens in `:root` (`--primary`,
   `--sidebar`, etc.) and the fonts in `app/layout.tsx` are the club's
   brand; edit them for the new client before deploying.
4. Deploy to a new Vercel project pointed at the new Supabase project.

Each client gets their own isolated database and deployment from the same
source — no cross-client data exposure risk, but also no shared upgrades:
a fix or feature has to be redeployed to each client's instance
separately. If/when there's enough demand to justify it, the schema would
need a real multi-tenant pass (`club_id` on every table, RLS scoped by
club) to run many clients off one shared deployment instead.

## Notes / out of scope

- Swim competition (lomba renang) tracking is intentionally not built, but
  nothing in the schema (e.g. `class_types`) assumes it can't be added
  later.
- WhatsApp and payment-gateway integrations are left as TODOs — invoices are
  marked paid manually by an admin for now.
- No self-registration: admin creates parent and coach accounts (with a
  temporary password that must be changed on first login) since letting
  parents register themselves would undermine the duplicate-child check.
