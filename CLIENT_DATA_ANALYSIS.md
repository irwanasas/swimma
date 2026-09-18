# Client Data Analysis — Laporan Keuangan 2025

Source file: `Laporan_Keuangan_2025.xlsx` (client-provided, 51 sheets). Cross-referenced against `PRODUCT_BLUEPRINT.md` and the schema already implemented in `supabase/migrations/` and `mvp/`. Read-only analysis — no application code or data changed.

Client's own club name found in the data: **Bugar Swim**.

---

## 1. Executive Findings

- **This is not one dataset, it's three, bolted together by convention, not by structure.** (a) a member roster (`DAFTAR MEMBER BUGAR SWIM`), (b) 48 near-identical **weekly** sheets that are simultaneously an attendance log, a per-session income log, and a per-coach payroll calculation, and (c) a monthly-rollup general ledger (`Buku Besar Club`). Nothing links them by ID — only by matching free-text names and dates.
- **Coach pay is not a percentage of what the member paid.** It's a separate, coach-specific piece-rate per session type (e.g. coach Adel earns Rp75,000 per "Privat" session regardless of whether the member paid Rp95,000 or Rp71,250 for it). The blueprint's payroll formula (`Basic Salary + bonuses - deductions`) has no slot for this at all — it's the single biggest gap between the blueprint and how this club actually runs.
- **Pricing has at least two eras and a new/existing-member tier the blueprint never mentions.** A `rumus` (old) and `rumus baru` (new) rate-card sheet coexist; `rumus baru` splits "Privat" into **Privat Baru** (new client, Rp110,000) vs **Privat Lama** (existing client, Rp100,000), plus separate promo rates. The blueprint's `packages` model has one price per package, full stop.
- **There's a second, semi-independent ledger**: every week, 10% of gross income is swept into `Buku Besar Club` as a "club savings" fund, which then pays equipment, venue tickets, ads, and interview costs — a two-tier cash system the blueprint's single flat ledger doesn't distinguish.
- **Location data is unusable as-is.** The same physical venue is spelled 5–10 different ways across the year (`Fountain` / `FOUNTAIN` / `FOuntain` / `Fontain` / `Fountan`; `WL` / `Wl` / `Watu Lumpang` / `Watu lumpang`; `Grasia` / `Hotel Grasia` / `GRASIA HOTEL` / `Serata Hotel` / `Serrata Hotel` — the last two may or may not be the same place, see open questions). Some "locations" are actually schools (`Ekstra Diponegoro`, `Unnes`) or a client's home (`Home visit`, `Guest Home`) — a venue *type*, not just a name, is missing from the model.
- **Roughly Rp 179 million in gross weekly-recorded income** across 47 of the 48 weekly sheets (Feb 2025 – early Jan 2026), growing from ~Rp 0.9M/week in March to a Rp 5–6M/week range by Q4 — the business grew meaningfully during the period covered, and the "2025" filename undersells it: the data runs into January 2026.
- **No hard data-corruption crisis, but a real process-fragility one.** 10,845 `#N/A` cells sound alarming; they are 100% template artifact (every weekly sheet is a copy of a 1,000-row template with pre-filled lookup formulas — none land on a real transaction row). The genuine issue is 17 `#REF!` errors from deleted rows/columns breaking SUM ranges, concentrated in the Oct–Dec sheets, and 139 free-text "blm adm" (not yet paid) markers that are the *entire* accounts-receivable tracking mechanism — there is no structured outstanding-balance field anywhere.
- **Coach identity is unmanaged.** ~24 name variants map to what looks like 16–20 real coaches, with typo pairs (`gaizka`/`gaiska`, `attiyah`/`atiyyah`, `angra`/`Angra`) and several coaches appearing in only 1–2 weeks (onboarding, trial, or departure — can't tell which from the data alone).

---

## 2. Data Structure / Entity Map

```text
DAFTAR MEMBER BUGAR SWIM  (member roster + lifetime attendance, wide format)
  Member (name, free-text) ──< meeting dates (one per column, unbounded)
  Member ── paket (free-text, inconsistent) [current package label at signup]

Weekly sheets × 48 (one tab per week, Feb 2025 – early Jan 2026)
  each tab = N side-by-side "coach blocks" (8 in a typical mid-year week, fewer early on)
    coach block:
      Session row: date, time, venue (free text), No Akun (rate-card lookup key),
                    Paket (session/package type), Member(s) (1 row per member,
                    multiple rows for a group session sharing one date/time/venue),
                    D = amount charged (Debit / income), K = amount reversed (Kredit),
                    Ket = free-text note (payment status, session-count, corrections)
      Coach payout sub-section ("Pengeluaran"):
        per session-type line: rate × count = subtotal, summed to the coach's weekly pay
      Week-level totals: Total pemasukan (gross income), Saving 10% (income skim)

rumus / rumus baru  (rate-card / chart-of-accounts, "rumus baru" supersedes "rumus")
  No Akun ── Nama Kelas (package/session-type label) ── Debit (rate) [rumus baru: + a 4th
  numeric column, ~amount/250, unexplained — see open questions]

Jangan diubah  ("do not change") — the blank master template every weekly sheet is copied
  from; confirms the canonical column order (No, Hari/Tanggal, Jam, Tempat, No Akun, Paket,
  Member, D, K, Ket) and that D/Paket/No Akun are lookup-formula-driven, not typed.

Buku Besar Club  (monthly-rollup general ledger / club reserve fund)
  Entry: period label (sparse, only on the first row of a period), Keterangan (description),
  Jumlah (unit amount), Qty, D (in) / K (out), Total (running balance)
  Funded by: the weekly "Saving 10%" skim. Spent on: equipment, venue entry tickets,
  refreshments, admin/transfer fees, ads, coach-hiring costs.
```

Implicit relationships (all by name/date matching, never by ID):
- `DAFTAR MEMBER.Member` ↔ weekly sheet `Member` (no shared key; name spelling drifts)
- weekly sheet `No Akun` / `Paket` ↔ `rumus baru.No Akun` (the actual lookup relationship — the only place in the workbook with anything resembling a stable foreign key)
- weekly sheet `Saving 10%` ↔ `Buku Besar Club` entries tagged "Saving 10%" (funds flow between sheets, matched only by the label text)

---

## 3. Data Dictionary

### 3.1 `DAFTAR MEMBER BUGAR SWIM ` (202 rows incl. headers, 38 columns)

| Column | Header (as written) | Observed type | Notes |
|---|---|---|---|
| A | `NO` | Numeric (float, e.g. `1.0`) | Sequential in the top ~130 rows, **blank for the last ~70 rows** (rows added later without renumbering). Not a stable ID. |
| B | `NAMA` | Text | First name / nickname only, no surname, no unique identifier. 176 distinct values across 198 rows — see duplicates below. |
| C | `PAKET` | Text | Free text: `paket privat`, `reguler `, `paket reguler `, `paket privat grup`, `Privat grup`, `Paket Reguler Holiday`, `paket privat hydroteraphy`, `Privat` — 8+ spellings for what appears to be ~4 package families. **19 rows have no paket value at all.** |
| D…AL (4–38) | `TANGGAL PERTEMUAN` (label only on column D; repeats implicitly) | Date, mixed formats | One column per attendance date, unbounded to the right. Mixed storage: real `datetime` values (`2025-04-07 00:00:00`) interleaved with **text strings with no year** (`03-May`, `07-May`) in the same member's row. Max 24 meeting-date columns used by a single member. |

**Row range used:** data starts row 4 (rows 1–3 are title/spacer/header). Last row 202.

### 3.2 Weekly sheets (48 tabs, one canonical layout — documented once)

Confirmed against the `Jangan diubah ` blank template. Each tab repeats this 10-column block once per coach (8 blocks in a typical filled-out week; fewer in the earliest weeks, more as the roster grew — column count per sheet ranges from 19 in February to 125 in August).

| Column offset in block | Header | Type | Notes |
|---|---|---|---|
| +0 | `No` | Numeric | Session sequence number within the coach's week. Blank on continuation rows (2nd+ member of a group session). |
| +1 | `Hari/ Tanggal` | Date | Day + date of the session. |
| +2 | `Jam` | Time (text, `HH.MM`) | Not a real Excel time value in the samples seen — stored as text like `13.30`. |
| +3 | `Tempat` | Text | Venue name, free text — see location data-quality findings. Sometimes a school/extracurricular name, "Home visit," or a person's name (sessions logged out of position). |
| +4 | `No Akun` | Text/numeric lookup key | References `rumus baru.No Akun`. Drives `Paket` and `D` via formula in the template; **`#N/A` when unset (template default)**. |
| +5 | `Paket` | Text | Session/package type for this booking, e.g. `Privat`, `Privat Grup`, `Hydro`, `Reguler`. |
| +6 | `Member` | Text | Member name. One row per member; a group session shares one `No`/date/time/venue row and adds blank-prefixed continuation rows per additional member. |
| +7 | `D` (Debit) | Numeric (IDR) | Amount charged to the member for this session. Blank for members whose package doesn't bill per-visit (see §4, billing-model business rule). |
| +8 | `K` (Kredit) | Numeric (IDR) | Reversal/refund/correction against a session. Rare — mostly blank in samples inspected. |
| +9 | `Ket` | Text | Free-text note. Overloaded field: session-count labels (`Paket pertemuan 4`), payment status (`blm adm` = not yet paid, `mba sigi sudah adm` = now paid), attendance-only markers (`Hanya Datang`), and operator-to-operator memos (`cek bu erna bu rini`, `cek lagi member yang blm admin...`). |

Below the coach blocks, each sheet also has a **"Pengeluaran" (payroll) section**, one sub-block per coach:

| Column | Content | Notes |
|---|---|---|
| Coach name + weekly total | e.g. `Adel — 560000` | Sum of that coach's line items below. |
| Session-type rate table | `Privat 75000 × 6 = 450000`, `Reguler 85000 × 1 = 85000`, `Reguler 50000 × 0 = 0`, `Hanya datang 25000 × 1 = 25000`, `Bonus 50000 × 0 = 0`, … | **Rate is coach-specific and re-typed by hand every single week** — not pulled from a shared table. Two different rates for the same nominal package (`Reguler` at 85000 *and* 50000 for the same coach in the same week) with no explanation encoded — see open questions. |

Week-level summary cells (position varies slightly sheet to sheet, located by label text, not fixed coordinates): `Total pemasukan` (gross weekly income), `Saving 10 %` (10% of gross, swept to `Buku Besar Club`).

### 3.3 `rumus` / `rumus baru` (rate card, "chart of accounts")

| Column | Header | Type | Notes |
|---|---|---|---|
| A | `No Akun` | Numeric (float) | `101`–`115`. Acts as a foreign key from the weekly sheets. |
| B | `Nama Kelas` | Text | Package/session-type label — the canonical spelling other sheets should (but don't consistently) match. |
| C | `Debit` | Numeric (IDR) | The rate for that package/session type. |
| D (rumus baru only) | *(unlabeled)* | Numeric | Present for ~7 of 15 rows; ≈ `Debit ÷ 250` for most rows, `Debit ÷ 125` for one (`Paket Privat Grup`). **Meaning unconfirmed** — see open questions. |

`rumus baru` introduces rows `rumus` doesn't have: `Privat Baru` / `Privat Lama` (new vs. existing member), `Paket Privat Baru` / `Paket Privat Lama`, `Paket Promo Reguler`, `Paket Promo Privat` — i.e. a pricing revision that added tenure- and promo-based tiers mid-year. No date marks *when* `rumus baru` took effect.

### 3.4 `Buku Besar Club ` (172 rows, 12 columns, only 8 used)

| Column | Header | Type | Notes |
|---|---|---|---|
| A | `No` | Numeric | Sequential entry number, continuous across the whole year (not per-period). |
| B | `Waktu` | Text | Period label (e.g. `Juli pekan 1`) — **only populated on the first entry of each period**, blank for subsequent entries in the same period (classic "merged visually, not merged in data" spreadsheet pattern). |
| C | `Keterangan` | Text | Description — free text, e.g. `Saving 10 %`, `Tiket Kedaton`, `Konsumsi WL`, `evaluasi bulanan`, `Interview Pelatih`. |
| D | `Jumlah` | Numeric (IDR) | Unit amount. |
| E | `Qty` | Numeric | Quantity. |
| F | `D` | Numeric (IDR) | Debit (money in) — in practice only ever the weekly `Saving 10%` sweep. |
| G | `K` | Numeric (IDR) | Kredit (money out) — every expense line. |
| H | `Total` | Numeric (IDR) | Running balance (`previous Total ± this row's D/K`), confirmed by formula (`=F99`-style references chaining down). Ends the observed data at **Rp 263,807**. |

### 3.5 `Jangan diubah ` ("do not change")

Structurally identical to a weekly sheet (10-column coach blocks, same headers), but every data row is the unfilled template: `No Akun` and `D` show `#N/A` (broken lookup with nothing selected yet), everything else blank. This is the master copy the 48 weekly tabs were duplicated from — useful as the authoritative column-order reference, not as a data source.

---

## 4. Business Rules Discovered (not in the blueprint)

1. **Coach compensation is a piece-rate per session type, set per coach, independent of what the member was charged.** Confirmed by cross-checking: coach Adel is paid Rp75,000/"Privat" session while the member-facing `rumus baru` price for "Privat Grup" is also Rp75,000 and for plain "Privat" is Rp100,000/110,000 — the numbers coincide for some rows and diverge for others, i.e. they are two genuinely separate rate schedules that happen to overlap, not one schedule read two ways.
2. **Group sessions bill and log per member, not per session.** One "Privat Grup" booking (one date/time/venue/package) produces one row per participating child, each individually charged.
3. **Not all packages bill per visit.** `Reguler` sessions are frequently logged with blank `D` and the note `Hanya Datang` ("just attended") — consistent with `Reguler` being a pre-paid monthly/quota package where attendance doesn't generate a new charge, versus `Privat`/`Privat Grup`/`Hydro`, which appear to charge per session. The blueprint's package model (`monthly | quarterly | yearly` billing cycle) doesn't capture this pay-per-visit vs. subscription distinction.
4. **New vs. existing member pricing.** `rumus baru` prices "Privat Baru" above "Privat Lama" — tenure changes the price, not just the package.
5. **A 10% "club savings" skim is taken from gross weekly income before anything else**, and funds a separate operating account (equipment, venue tickets, ads, hiring costs) — a second ledger, not just an expense category.
6. **Venues include rented per-visit pools (ticket cost logged separately in `Buku Besar Club`), the club's own locations, school extracurricular programs, and home visits** — at least three different venue *relationships*, not just different addresses.
7. **Outstanding balance is tracked entirely as a free-text convention** (`blm adm` = belum admin = not yet processed/paid) inside the `Ket` note field, resolved later by a different free-text note (`mba sigi sudah adm`) or an operator memo asking someone to double-check a name. There is no status field, due date, or amount-owed figure anywhere.
8. **Coaches receive a discretionary `Bonus` line item, entered per coach per week, with no stated formula** — separate from the piece-rate calculation.
9. **The pricing rate card itself has at least two versions in force during the year** (`rumus` → `rumus baru`), meaning historical sessions must be priced by *the rate in effect at the time*, not today's rate — the data as stored doesn't preserve which version applied to which week.

---

## 5. Blueprint vs. Actual Business — Comparison

Legend: ✅ confirmed by data · ❌ not found in data · ⚠️ contradicted by data · 🆕 missing requirement discovered from data · ❓ ambiguous, needs client confirmation · 🗑️ data that should not carry into the new system.

| Blueprint item | Status | Evidence / notes |
|---|---|---|
| Unique Student ID per child | ⚠️ | Roster has no stable ID; `NO` column is non-sequential/blank for later rows. Matching is by first-name text only, with confirmed duplicate names (`Asyifa` ×5, `Aqila` ×3, `Gita` ×3, `Alika` ×3, plus 20 other names appearing twice) — cannot currently tell whether these are the same child twice or different children sharing a name. |
| Parent account owns multiple children | ❌ | No parent identity appears anywhere in this workbook — only child/member first names. Parent contact info, if it exists, is not in this file. |
| Membership & Package: monthly / session-quota / annual / private | ⚠️ | Confirms `privat`, `privat grup`, `reguler`, `hydro` exist as real package families, but contradicts the pricing model: real pricing varies by *new vs. existing member* and by *promo period*, which `packages.price` (one price per package) cannot represent. |
| "Sisa sesi" (remaining session quota) for quota packages | ❌ | Not tracked anywhere in this data — session counts are recounted manually per week per coach for payroll, not decremented from a member-side quota. |
| Class scheduling by pool lane, age group, ability level, capacity, conflict prevention | ❌ | None of these appear. Scheduling in this data is coach-centric (a weekly per-coach log), not class/lane-centric. May be handled elsewhere (paper, verbally) — cannot confirm from this file. |
| Private lesson booking (coach choice, duration, price, booking status) | ⚠️ | Private sessions clearly exist and are the majority of volume, but there's no booking/reservation record — only the after-the-fact attendance + income log. |
| Attendance states: Present / Absent / Excused / Late | ⚠️ | Only a binary-ish reality is recorded: attended-and-charged, attended-without-charge (`Hanya Datang`), or simply not logged. No `Absent`, `Excused`, or `Late` values found anywhere. |
| "Present → auto-deduct 1 session from quota" | ❌ | No quota field exists to deduct from; see above. |
| Coach clock-in/clock-out | ❌ | Not present. The weekly sheets record *sessions taught*, not shift attendance. |
| Progress/evaluation history per member | ⚠️ | `evaluasi bulanan` (monthly evaluation) appears only as a line-item **expense** in `Buku Besar Club` (a cost the club pays, likely for staff evaluating coaches or a venue evaluation fee) — not as member skill/progress records. No swim-technique, personal-best, or skill-level data found. |
| Invoice entity (number, item, amount, discount, due date, status) | ❌ | No invoice records exist. Billing is a same-row charge-and-log, not invoice-then-pay. |
| Payment gateway integration (QRIS/VA/transfer/e-wallet) | ❌ | No gateway data. `Ket` notes like `adm TF` (admin transfer fee) imply bank transfer is used, informally. |
| Payment status: Pending / Paid / Overdue / Cancelled | ⚠️ | Only the two-state free-text convention `blm adm` / (resolved note) exists — no `Overdue` concept (no due dates at all), no `Cancelled` state distinct from a `K` (credit/reversal) line. |
| Finance: transaction/ledger-based, not overwritten balance | ✅ | `Buku Besar Club` is exactly this — running balance computed from a debit/credit sequence, matches the blueprint's stated principle and the app's existing `cash_ledger` design. |
| Finance categories (Income: membership/training/private/registration/competition/merchandise; Expense: salary/bonus/THR/rental/maintenance/operational/other) | ⚠️ | Real expense categories are far more granular and different in kind: venue entrance tickets per location, refreshments (`konsumsi`), admin/transfer fees, coach interview/hiring costs, Instagram ads, swim equipment (floats, rings, charger). None of these map cleanly onto the blueprint's category list. |
| Payroll: `Basic Salary + Private Bonus + Competition Bonus + Allowance - Deduction` | ⚠️ | Actual payroll is `Σ(coach's rate for session type × sessions taught that week)` per coach, plus a separate discretionary `Bonus` line — structurally a piece-rate model, not a salary-plus-bonus model. |
| Inventory (club equipment / merchandise, SKU, stock levels) | ❌ | Individual equipment purchases appear as one-off ledger expenses (`pelampung`, `ring`, `charger`, `handuk`), never as tracked stock with quantities on hand. |
| POS | ❌ | No POS transactions found. |
| Promotions (promo code, discount, validity, usage limit) | 🆕/⚠️ | No promo *codes* exist, but promo **pricing tiers** do (`Paket Promo Reguler`, `Paket Promo Privat` in `rumus baru`) — a simpler, rate-card-level promo, not the code/redemption model the blueprint describes. |
| Landing page / self-registration | ❌ | Not present in this file (expected — it's a finance/ops workbook, not a marketing artifact). |
| Competition management | 🆕 | The token `Lomba` (competition/race) appears at least once inside the free-text `Paket`/`Tempat` fields sampled — the club has *already* touched competitions operationally, even though the blueprint marks this "Future Module." |
| Role-based access (Admin / Coach / Parent) | ❌ | No system/user access data in this file — not this document's concern, but worth noting the workbook itself has **no access control**: every coach's rate and every other coach's pay is visible in the same tab. |
| "Compute derived data, don't store it" principle (age, outstanding amount, revenue) | ✅/⚠️ | The workbook mostly agrees in spirit (running balances are formula-derived) but violates it in the one place it matters most for trust: **payment status is stored as a free-text note, not derived from `charge − payments`**, which is exactly the "Excel says 10 million, dashboard says 9.7 million" failure mode the blueprint itself warns against. |
| Locations (blueprint doesn't detail structure) | 🆕 | Real venues need a `type` (owned pool / rented pool with per-visit ticket cost / school partnership / home visit) that the blueprint's flat `locations` table (and the app's current `locations(id, name, address)` schema) doesn't have. |
| Pool `lanes` | ❓ | Named in the blueprint's DB sketch (§13) but never referenced by anything observable in this data — cannot confirm whether lane-level scheduling is a real operational need or a blueprint aspiration. |
| Data that should **not** carry into the new system | 🗑️ | Operator-to-operator memos left inside data cells (`cek bu erna bu rini`, `cek lagi member yang blm admin bisa diurutkan ya mba...`, `dilengkapi pengeluaran dan saving bonus bulanan`) — these are chat messages that ended up in spreadsheet cells, not data. The 1,000-row template padding (and its `#N/A` filler) is also pure spreadsheet mechanics with nothing to migrate. |

---

## 6. Recommended Schema Implications

Relative to the schema already in `supabase/migrations/` (`profiles`, `children`, `classes`, `bookings`, `membership_packages`, `subscriptions`, `invoices`, `cash_ledger`, `payroll_runs`):

1. **Coach compensation needs its own rate table**, e.g. `coach_session_rates(coach_id, class_type_id, rate, effective_from, effective_until)` — `payroll_runs` currently takes a flat `baseSalary/bonus/thr` and has nowhere to represent "piece-rate × sessions taught," which is what actually happens every week.
2. **`membership_packages` needs a pricing dimension beyond `billing_cycle`** — at minimum a `member_tenure` (new/existing) or a proper **price-list-with-effective-dates** table (`package_prices(package_id, price, effective_from, effective_until)`), so historical sessions can be priced correctly instead of against today's rate.
3. **A real outstanding-balance/payment-status field**, computed (`invoice.amount − Σ payments`), replacing the free-text `blm adm` convention — this is the single highest-value fix relative to the blueprint's own stated principle.
4. **`locations` needs a `type`** (own / rented-with-ticket-cost / school-partner / home-visit) and, for rented venues, a way to log the per-visit entrance cost that currently lives as generic `Buku Besar Club` expense lines.
5. **A club-level "reserve fund" concept** distinct from operating cash — either a `fund` dimension on `cash_ledger` entries or a second ledger table — to represent the 10%-skim-then-spend pattern cleanly, rather than folding it into one undifferentiated balance.
6. **Session-based (quota) packages need a `sessions_remaining`/`sessions_included` field on `subscriptions`**, decremented on attendance — currently absent from both the blueprint's core-table list and the implemented schema.
7. **Group-session billing**: `bookings` already supports one row per child per class, which is compatible with the "one row per group member" pattern seen in the data — no change needed there, just confirming it holds.
8. **Coach identity needs enforcement at data-entry time** (a real `coaches` lookup/autocomplete, not free text) — this single change would have prevented most of the name-variant problem found in this workbook.

---

## 7. Data Migration Considerations

- **No reliable migration key exists yet.** Before any row of this workbook can become a `children`/`profiles` row, first names must be deduplicated against real people — likely requiring a manual review pass (with the client) of every repeated name, cross-checked against package + approximate date range, since the file has no phone/email/parent name to disambiguate.
- **Text dates without a year (`03-May`) must be resolved before import** — inferred from sheet/week context where possible, flagged for manual confirmation where a member's row mixes formats across the year boundary (Dec→Jan).
- **Historical pricing must be time-versioned on import**: a February session priced under `rumus` and a November session priced under `rumus baru` are not the same rate, and the workbook doesn't mark the cutover date — needs client confirmation (see §9).
- **Venue name normalization is a hard prerequisite**, not a nice-to-have: without it, "attendance by location" or "revenue by location" reporting would silently undercount every venue with more than one spelling.
- **Coach payroll history (the piece-rate line items) is rich enough to backfill `coach_session_rates` with real historical values** — this is a genuine asset, not just noise; each week effectively re-states each coach's live rate card.
- **What not to migrate**: operator memos left in data cells, the blank template rows/sheets, and the `#N/A`/`#REF!` artifacts — none of it is business data.
- **`Buku Besar Club`'s running balance (ends at Rp 263,807) is a real opening balance candidate** for the new system's cash ledger, if the client confirms this is still the club's actual reserve-fund balance as of the file's last entry.

---

## 8. Data Quality Issues

| Issue | Scope | Severity |
|---|---|---|
| Location name inconsistency (5–10 spellings per venue) | All 48 weekly sheets | High — blocks any location-based reporting until normalized |
| Coach name inconsistency (~24 variants for ~16–20 people) | All 48 weekly sheets | High — same blocker for coach-based reporting/payroll history |
| Member name duplicates, no unique ID (24 names appear 2–5×), first-name-only | Roster + all weekly sheets | High — cannot safely dedupe automatically |
| Dates stored as text without year, mixed with real datetimes in the same column | Roster (`TANGGAL PERTEMUAN` columns) | Medium — resolvable but needs manual disambiguation at the Dec/Jan boundary |
| Payment/outstanding status is free text only (`blm adm`, ad hoc follow-up notes) | Weekly sheets, `Ket` column | High — this *is* the club's accounts-receivable system today; nothing to reconcile against |
| Operator-to-operator memos stored in data cells | Scattered across weekly sheets | Low (migration hygiene only) |
| 17 `#REF!` formula errors from deleted rows/columns (concentrated in Sep–Dec sheets) | 6 weekly sheets | Medium — means some of those sheets' subtotals are currently wrong in the source file itself |
| 10,845 `#N/A` cells | All weekly sheets | Cosmetic only — confirmed 100% template padding, zero occurrences on real transaction rows (verified by cross-checking `#N/A` cells against rows that have an actual member name) |
| 19 roster rows with no package assigned | Roster | Medium — unclear if genuinely package-less or a data-entry gap |
| `NO` column non-sequential / blank for later roster rows | Roster | Low — cosmetic, confirms it was never meant as a real ID |
| Two rate-card versions coexist with no effective-date marker | `rumus` vs `rumus baru` | Medium — affects historical pricing accuracy on migration |

---

## 9. Questions That Must Be Confirmed With the Client

1. **Identity resolution**: for each of the 24 repeated names (e.g. 5× "Asyifa," 3× "Aqila," 3× "Gita," 3× "Alika") — same child appearing multiple times (re-registration, name re-typed), or genuinely different children who share a first name? This blocks any automated migration of the member roster.
2. **Rate-card cutover date**: when did `rumus baru` (with Privat Baru/Lama and promo tiers) replace `rumus`? Needed to price historical sessions correctly.
3. **The unexplained 4th column in `rumus baru`** (≈ rate ÷ 250, or ÷ 125 for "Paket Privat Grup") — what does it represent? A per-minute rate, a point/credit system, something else?
4. **"Reguler" at two different coach payout rates in the same week for the same coach** (e.g. Rp85,000 and Rp50,000) — two different sub-types of Reguler session, a rate change mid-week, or a data-entry inconsistency?
5. **Are "Serata Hotel" / "Serrata Hotel" / "Hotel Grasia" / "Grasia" the same physical venue, or two different ones that happen to share a spelling pattern?**
6. **What decides whether a member's package bills per visit (`Privat`, `Hydro`) vs. not (`Reguler`, logged as "Hanya Datang")?** Is `Reguler` always a monthly flat-fee package regardless of session count, or does it have its own quota that just isn't tracked in this file?
7. **What triggers the discretionary per-coach `Bonus` line item?** No formula or criteria is visible in the data.
8. **Is the `evaluasi bulanan` (monthly evaluation) ledger expense a payment made *to* someone (an external evaluator, a franchise/certification body) or an internal cost — and is it related at all to the blueprint's member progress-evaluation concept, or a completely separate thing?**
9. **Do venues logged as school names (`Ekstra Diponegoro`, `Unnes`) represent a formal B2B/school-partnership arrangement** (different pricing, different invoicing party) **or just "where the session happened"?**
10. **Is the `Buku Besar Club` closing balance (Rp 263,807) the club's actual current reserve-fund balance**, usable as the new system's opening balance, or does cash exist outside this workbook too?
11. **Should the 10%-savings-fund mechanism be a first-class feature of the new system** (an automatic weekly sweep + a separate fund balance), or was it a manual practice that doesn't need to survive into the software?
12. **For the ~8 coaches who appear in only 1–2 weeks of the year** — trial/probation coaches, departed coaches, or one-off substitutes? Affects whether their historical rate data is worth migrating at all.
