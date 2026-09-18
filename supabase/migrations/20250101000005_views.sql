create view cash_ledger_with_balance with (security_invoker = true) as
select
  *,
  sum(case when direction = 'in' then amount else -amount end)
    over (order by entry_date, id) as running_balance
from cash_ledger;

grant select on cash_ledger_with_balance to authenticated;

create view report_revenue with (security_invoker = true) as
select date_trunc('month', paid_at) as month, sum(amount) as revenue
from invoices
where status = 'paid'
group by 1
order by 1;

create view report_outstanding with (security_invoker = true) as
select count(*) as outstanding_count, coalesce(sum(amount), 0) as outstanding_amount
from invoices
where status = 'outstanding';

create view report_cash_flow with (security_invoker = true) as
select
  date_trunc('month', entry_date) as month,
  sum(case when direction = 'in' then amount else 0 end) as cash_in,
  sum(case when direction = 'out' then amount else 0 end) as cash_out,
  sum(case when direction = 'in' then amount else -amount end) as net
from cash_ledger
group by 1
order by 1;

create view report_revenue_by_program with (security_invoker = true) as
select mp.name as package_name, sum(i.amount) as revenue
from invoices i
join subscriptions s on s.id = i.subscription_id
join membership_packages mp on mp.id = s.package_id
where i.status = 'paid'
group by mp.name
order by revenue desc;

create view report_payroll_cost with (security_invoker = true) as
select date_trunc('month', period_start) as month, sum(total_amount) as payroll_cost
from payroll_runs
where status = 'posted'
group by 1
order by 1;

create view report_member_counts with (security_invoker = true) as
select
  count(*) filter (where is_active) as active_children,
  count(*) filter (where not is_active) as inactive_children
from children;

grant select on
  report_revenue,
  report_outstanding,
  report_cash_flow,
  report_revenue_by_program,
  report_payroll_cost,
  report_member_counts
to authenticated;
