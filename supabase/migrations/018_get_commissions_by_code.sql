-- Per-partner commission lookup, filtered server-side by partner code.
-- get_commissions() (016) returns ALL partners' rows — fine for the
-- owner-only /commissions/ report, but CommissionsPage.tsx uses it to build
-- a per-partner report at /commissions/:code, and filtering client-side
-- means every partner's raw network response includes every OTHER partner's
-- referred_by/amount/commission_amount, visible to anyone who opens devtools.
-- This RPC filters by code inside the database instead, so a partner's
-- response only ever contains their own rows.
create or replace function public.get_commissions_by_code(p_code text)
returns table(
  id uuid,
  referred_by text,
  plan text,
  amount integer,
  commission_amount integer,
  paid boolean,
  paid_at timestamptz,
  created_at timestamptz
)
language sql
security definer
as $$
  select id, referred_by, plan, amount, commission_amount, paid, paid_at, created_at
  from public.purchases
  where referred_by is not null
    and lower(referred_by) = lower(p_code)
  order by created_at desc
  limit 1000;
$$;
