# Swimming Club Management System — Product Blueprint

## 1. Tujuan Sistem

Sistem terintegrasi untuk mengelola operasional klub renang dari pendaftaran member, membership, jadwal latihan, absensi, evaluasi, billing, keuangan, payroll, inventory, hingga kompetisi.

Sistem memiliki 3 portal utama:
* **Admin Dashboard** — operasional, member, jadwal, keuangan, HR, inventory.
* **Coach Portal** — jadwal mengajar, absensi member, absensi kerja, evaluasi.
* **Member/Parent Portal** — data anak, jadwal, kehadiran, pembayaran, membership, promo, kompetisi.

---

## 2. Modul Utama

### A. Member & CRM

#### Member Management
* Database member/perenang.
* Unique Student ID untuk setiap anak.
* Data pribadi:
  * Nama
  * Tanggal lahir
  * Alamat
  * Kontak orang tua
  * Kontak darurat
* Tingkat kemampuan:
  * Pemula
  * Intermediate
  * Prestasi
* Catatan medis dan kebutuhan khusus.
* Status member:
  * `Active`
  * `Inactive`

#### Parent Account
* Satu akun orang tua dapat memiliki beberapa anak.
* Orang tua dapat melihat seluruh anak dari satu akun.
* Relasi parent → child menggunakan database ID, bukan pencocokan nama.

#### Membership & Package
Mendukung:
* Paket bulanan.
* Paket sesi (misalnya 8/10/12 sesi).
* Membership tahunan.
* Paket privat.
* Status membership dan masa berlaku.
* Sisa sesi untuk paket berbasis kuota.

---

## 3. Scheduling & Lesson Management

### Class Scheduling
Admin dapat membuat jadwal berdasarkan:
* Tanggal & waktu.
* Lokasi kolam.
* Pool lane.
* Kelompok umur.
* Level kemampuan.
* Coach yang bertugas.
* Kapasitas kelas.

Sistem harus mencegah konflik:
* Coach tidak dapat ditugaskan ke dua kelas pada waktu yang sama.
* Lane tidak dapat digunakan oleh dua kelas pada waktu yang sama.
* Member tidak dapat terdaftar ke kelas yang bentrok.

### Private Lesson
Member dapat melakukan booking sesi privat:
* Coach pilihan.
* Tanggal & waktu.
* Durasi.
* Harga.
* Status booking.
* Status pembayaran.

---

## 4. Attendance & Coach Operations

### Member Attendance
Coach login melalui HP/tablet saat berada di kolam. Sistem menampilkan:

```text
Today's Lesson → Class → Member List
```

Coach dapat mencatat:
* Present
* Absent
* Excused
* Late

Untuk paket berbasis sesi:

```text
Present → otomatis mengurangi 1 sesi dari kuota member
```

Sistem harus memastikan sesi tidak terpotong dua kali apabila attendance diedit atau dikoreksi.

### Coach Attendance
Coach juga dapat melakukan clock-in / clock-out. Data digunakan untuk:
* Timesheet.
* Rekap jam kerja.
* Perhitungan payroll.
* Rekap jam private lesson.

---

## 5. Progress & Evaluation

Coach dapat mencatat perkembangan member dari profil anak, mencakup:
* Skill level.
* Teknik renang.
* Personal best / record waktu.
* Assessment.
* Catatan perkembangan.
* Rekomendasi level berikutnya.

Riwayat evaluasi disimpan sebagai historical records, bukan overwrite data lama.

```text
Member
 └── Evaluation History
      ├── Jan 2026 — Beginner
      ├── Mar 2026 — Intermediate
      └── Jun 2026 — Advanced
```

---

## 6. Billing & Payment

### Invoice
Sistem dapat membuat invoice untuk:
* Registration fee.
* Membership.
* Training package.
* Private lesson.
* Competition fee.
* Produk/merchandise jika diperlukan.

Invoice memiliki:
* Invoice number.
* Member.
* Parent.
* Item.
* Amount.
* Discount/promo.
* Due date.
* Payment status (`Pending`, `Paid`, `Overdue`, `Cancelled`).

### Payment
Integrasi payment gateway seperti:
* QRIS
* Virtual Account
* Bank transfer
* E-wallet

**Flow Pembayaran:**

```text
Invoice Created → Parent Pays → Payment Gateway → Webhook
  → Payment Verified → Invoice = Paid → Membership Activated
  → Financial Transaction Recorded
```

> ⚠️ **Penting:** Jangan mengubah status pembayaran berdasarkan callback dari frontend. Status pembayaran harus berasal dari webhook/server-side verification.

---

## 7. Finance & Accounting

Gunakan transaction/ledger-based system, bukan saldo yang dioverwrite.

### Income
* Membership
* Training package
* Private lesson
* Registration
* Competition
* Merchandise

### Expense
* Salary
* Coach bonus
* THR
* Pool rental
* Pool maintenance
* Operational expenses
* Other expenses

### Financial Reports
* Daily transaction
* Monthly revenue
* Expense
* Net cash flow
* Outstanding invoice
* Payment collection
* Revenue by product/package
* Revenue by location

> 💡 *Catatan:* Untuk tahap awal, sistem bisa menggunakan transaction ledger. Jika nanti membutuhkan accounting yang benar-benar formal, baru dikembangkan menjadi full double-entry accounting dengan accounts, journal entries, dan journal lines. Jangan setengah-setengah menyebut tabel transaksi biasa sebagai double-entry—akuntansi tidak sesederhana mengganti nama tabel. 😄

---

## 8. HR & Payroll

### Employee Management
Mencatat:
* Coach
* Admin/staff
* Employment status
* Salary configuration

### Timesheet
Sumber data:
* Clock-in/out
* Scheduled lessons
* Private lessons
* Competition assignments

### Payroll
**Komponen:**

```text
Basic Salary + Private Lesson Bonus + Competition Bonus + Other Allowance
  - Deduction = Net Salary
```

Payroll menghasilkan financial transaction secara otomatis setelah payroll disetujui.

---

## 9. Inventory & POS

### Inventory
Dua kategori utama:
1. **Club Equipment:** Kickboard, Fin, Snorkel, Training equipment.
2. **Merchandise:** Swimming suit, Goggles, Swim cap, Accessories, Food & beverages.

Inventory mencatat:
* SKU
* Product name
* Category
* Stock
* Minimum stock
* Purchase price
* Selling price

### POS
Digunakan untuk penjualan langsung di lokasi.

```text
Product Selected → Cart → Payment → Transaction Created
  → Stock - Quantity → Revenue Recorded
```

---

## 10. Promotion & Landing Page

### Landing Page
Menampilkan:
* Club information
* Program
* Schedule
* Pricing
* Promo
* Registration form

### Promotion
Admin dapat membuat:
* Promo code
* Discount percentage/fixed amount
* Validity period
* Applicable package
* Usage limit

Promo dapat digunakan pada invoice dan otomatis tercatat sebagai discount.

### New Member Registration Flow

```text
Landing Page → Registration Form → Parent Account → Child Profile
  → Registration Invoice → Payment → Membership Activated
  → Member Assigned to Class
```

---

## 11. Competition Management — Future Module

Disiapkan sebagai modul terpisah agar tidak mengganggu sistem utama.

* **Competition:** Admin dapat membuat kompetisi, tanggal, venue, registration deadline, events/categories.
* **Race Registration:** Member dapat didaftarkan ke berbagai nomor lomba (misalnya 50m Freestyle, 100m Freestyle, dll).
* **Data Kompetisi:** Menyimpan Event, Participant, Seed time, Result, Ranking, Personal best.

---

## 12. Role & Access Control

### Admin
Full operational access: Members, Parents, Packages, Scheduling, Coaches, Attendance, Billing, Finance, Payroll, Inventory, POS, Promotions, Reports, Competition.

### Coach
Hanya akses yang diperlukan untuk coaching: Personal schedule, Assigned classes, Member list kelas, Member attendance, Coach attendance, Member evaluation, Progress history yang relevan.
* *Tidak dapat mengakses:* Finance, Payroll, Salary, Financial reports, Admin-only settings.

### Member / Parent
Akses hanya terhadap data miliknya: Profile, Children, Schedule, Attendance, Membership, Package, Invoice, Payment history, Digital membership card, Progress/evaluation, Competition registration, Promo.

---

## 13. Database Blueprint

Gunakan PostgreSQL/Supabase dengan relasi berbasis UUID.

```text
Authentication:
auth.users ──> profiles

Core:
profiles ──┬── parents ──> members
           └── employees ──> coaches

Membership:
members ──┬── subscriptions
          ├── packages
          ├── invoices
          ├── attendance
          └── evaluations

Scheduling:
locations ──> pools ──> lanes
class_schedules ──┬── pool
                  ├── lane
                  ├── coach
                  └── members

Finance:
invoices ──> payments ──> financial_transactions

HR:
employees ──┬── attendance
            ├── timesheets
            └── payroll

Inventory:
products ──┬── inventory_transactions
           └── pos_transactions

Competition:
competitions ──> race_events ──> race_registrations ──> members
```

---

## 14. Core Tables

Minimal initial schema:
* `profiles`
* `parents`
* `members`
* `employees`
* `coaches`
* `locations`
* `pools`
* `lanes`
* `class_schedules`
* `class_members`
* `member_attendance`
* `packages`
* `subscriptions`
* `invoices`
* `invoice_items`
* `payments`
* `financial_transactions`
* `employee_attendance`
* `timesheets`
* `payroll`
* `payroll_items`
* `products`
* `inventory_transactions`
* `pos_transactions`
* `pos_transaction_items`
* `promotions`
* `evaluations`
* `competitions`
* `race_events`
* `race_registrations`

### Important Design Principle
> **Jangan menyimpan data turunan sebagai source of truth jika bisa dihitung.**
> * `birth_date` → `age` (umur dihitung, tidak disimpan permanen karena berubah).
> * `Invoice` + `Payments` → `Outstanding Amount`
> * `Transactions` → `Revenue`
> * `Attendance` → `Session Usage`
>
> Hitung dari sumber datanya agar tidak terjadi kondisi: *Excel bilang Rp10 juta, dashboard bilang Rp9,7 juta, lalu semua orang menatap satu sama lain.* 💀

---

## 15. End-to-End Business Workflow

### 1. New Member

```text
Landing Page → Registration → Parent Account Created → Child Profile Created
  → Membership/Package Selected → Invoice Generated → Payment
  → Payment Verified → Membership Activated → Class Assignment → Training
```

### 2. Regular Training

```text
Class Schedule → Coach Login → Assigned Member List → Attendance
  → Session Deducted → Coach Evaluation/Notes → Progress History Updated
```

### 3. Monthly Billing

```text
Active Subscription → Invoice Generation → WhatsApp/Email Notification
  → Parent Payment → Gateway Verification → Invoice Paid
  → Financial Transaction
```

### 4. Payroll

```text
Coach Attendance + Teaching Schedule + Private Lessons → Timesheet
  → Payroll Calculation → Admin Approval → Payroll Paid → Expense Recorded
```

### 5. POS

```text
Product → POS Sale → Payment → Stock Deduction → Revenue Transaction
```

---

## 16. System Architecture

```text
                    ┌──────────────────┐
                    │   Landing Page   │
                    └────────┬─────────┘
                             │
              ┌──────────────▼──────────────┐
              │         Next.js App         │
              │                             │
              │ Admin │ Coach │ Parent      │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │                 │
                    │ Auth            │
                    │ PostgreSQL      │
                    │ RLS             │
                    │ Storage         │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
 Payment Gateway       Notifications         Future APIs
 Midtrans/Xendit       WhatsApp/Email        Competition/etc.
```

---

## 17. Recommended Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL |
| **Backend** | Supabase |
| **Authentication** | Supabase Auth |
| **Authorization** | PostgreSQL RLS |
| **Data Fetching** | TanStack Query |
| **Payment** | Midtrans / Xendit |
| **Hosting** | Vercel |
| **File Storage** | Supabase Storage |
| **Notifications** | WhatsApp API / Email provider |

---

## 18. Development Priority

Supaya project tidak berubah menjadi ERP swimming club sebelum punya satu member pun, build bertahap:

### Phase 1 — Core MVP
1. Authentication & RBAC
2. Parent/member management
3. Coach management
4. Package/membership
5. Class scheduling
6. Attendance
7. Basic billing
8. Basic dashboard

### Phase 2 — Financial & Operations
9. Payment gateway
10. Financial transactions
11. Coach timesheet
12. Payroll
13. Reports
14. Notifications

### Phase 3 — Commercial
15. POS
16. Inventory
17. Promotions
18. Landing page + registration

### Phase 4 — Advanced
19. Member progress/evaluation
20. Competition management
21. Advanced analytics
22. Automation/integrations

> **Core Principle:** Satu database, satu source of truth, role-based access, dan setiap transaksi penting punya histori. Dengan struktur ini, sistem bisa berkembang dari aplikasi operasional klub menjadi platform manajemen klub tanpa harus membongkar fondasi database di tengah jalan.
