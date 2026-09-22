import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getJakartaDateString, getJakartaDayRangeIso } from "@/lib/format";

export interface DashboardData {
  totalRevenue: number;
  outstandingCount: number;
  outstandingAmount: number;
  totalPayrollCost: number;
  activeChildren: number;
  inactiveChildren: number;
  cashBalance: number;
  activePromoCount: number;
  todaysClasses: {
    id: string;
    startTime: string;
    endTime: string;
    coachName: string;
    locationName: string;
    classTypeName: string;
    bookedCount: number;
    capacity: number;
  }[];
  expiringSubscriptions: {
    id: string;
    childName: string;
    packageName: string;
    endDate: string;
  }[];
  overdueInvoices: {
    id: string;
    childName: string;
    amount: number;
    dueDate: string;
  }[];
  recentCashEntries: {
    id: string;
    entryDate: string;
    category: string;
    direction: "in" | "out";
    amount: number;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createServerSupabaseClient();
  const today = getJakartaDateString();
  const { start: todayStart, end: todayEnd } = getJakartaDayRangeIso();
  const in7Days = getJakartaDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [
    { data: revenue },
    { data: outstanding },
    { data: payrollCost },
    { data: memberCounts },
    { data: cashEntries },
    { count: promoCount },
    { data: todaysClasses },
    { data: expiringSubs },
    { data: overdueInvoices },
  ] = await Promise.all([
    supabase.from("report_revenue").select("revenue"),
    supabase.from("report_outstanding").select("outstanding_count, outstanding_amount").maybeSingle(),
    supabase.from("report_payroll_cost").select("payroll_cost"),
    supabase.from("report_member_counts").select("active_children, inactive_children").maybeSingle(),
    supabase
      .from("cash_ledger_with_balance")
      .select("id, entry_date, category, direction, amount, running_balance")
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("promo")
      .select("id", { count: "exact", head: true })
      .lte("active_from", new Date().toISOString())
      .or(`active_until.is.null,active_until.gte.${new Date().toISOString()}`),
    supabase
      .from("classes")
      .select("id, start_time, end_time, capacity, profiles(full_name), locations(name), class_types(name), bookings(id)")
      .gte("start_time", todayStart)
      .lt("start_time", todayEnd)
      .order("start_time"),
    supabase
      .from("subscriptions")
      .select("id, end_date, children(full_name), membership_packages(name)")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7Days)
      .order("end_date"),
    supabase
      .from("invoices")
      .select("id, amount, due_date, children(full_name)")
      .eq("status", "outstanding")
      .lt("due_date", today)
      .order("due_date")
      .limit(20),
  ]);

  const totalRevenue = (revenue ?? []).reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalPayrollCost = (payrollCost ?? []).reduce((sum, r) => sum + Number(r.payroll_cost), 0);

  return {
    totalRevenue,
    outstandingCount: outstanding?.outstanding_count ?? 0,
    outstandingAmount: Number(outstanding?.outstanding_amount ?? 0),
    totalPayrollCost,
    activeChildren: memberCounts?.active_children ?? 0,
    inactiveChildren: memberCounts?.inactive_children ?? 0,
    cashBalance: Number(cashEntries?.[0]?.running_balance ?? 0),
    activePromoCount: promoCount ?? 0,
    todaysClasses: (todaysClasses ?? []).map((c) => {
      const row = c as unknown as {
        id: string;
        start_time: string;
        end_time: string;
        capacity: number;
        profiles: { full_name: string } | null;
        locations: { name: string } | null;
        class_types: { name: string } | null;
        bookings: { id: string }[];
      };
      return {
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        coachName: row.profiles?.full_name ?? "-",
        locationName: row.locations?.name ?? "-",
        classTypeName: row.class_types?.name ?? "-",
        bookedCount: row.bookings?.length ?? 0,
        capacity: row.capacity,
      };
    }),
    expiringSubscriptions: (expiringSubs ?? []).map((s) => {
      const row = s as unknown as {
        id: string;
        end_date: string;
        children: { full_name: string } | null;
        membership_packages: { name: string } | null;
      };
      return {
        id: row.id,
        childName: row.children?.full_name ?? "-",
        packageName: row.membership_packages?.name ?? "-",
        endDate: row.end_date,
      };
    }),
    overdueInvoices: (overdueInvoices ?? []).map((i) => {
      const row = i as unknown as {
        id: string;
        amount: number;
        due_date: string;
        children: { full_name: string } | null;
      };
      return {
        id: row.id,
        childName: row.children?.full_name ?? "-",
        amount: Number(row.amount),
        dueDate: row.due_date,
      };
    }),
    recentCashEntries: (cashEntries ?? []).map((e) => ({
      id: e.id,
      entryDate: e.entry_date,
      category: e.category,
      direction: e.direction,
      amount: Number(e.amount),
    })),
  };
}
