grant select, insert, update, delete on
  profiles,
  locations,
  class_types,
  children,
  classes,
  bookings,
  membership_packages,
  subscriptions,
  invoices,
  cash_ledger,
  payroll_runs,
  promo
to authenticated;

revoke all on auth_credentials from authenticated, anon;
