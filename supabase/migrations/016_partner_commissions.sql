-- Partner commission tracking: added to purchases.referred_by (already existed)
-- so the amount owed to a partner is computed once at sale time (not
-- recalculated later if the commission rate changes) and can be marked paid.
alter table public.purchases
  add column if not exists commission_amount integer,
  add column if not exists paid boolean default false,
  add column if not exists paid_at timestamptz;

-- Allows the commissions report page (anon key) to read commission data via
-- RPC without exposing customer PII (no user_id, email, or Stripe payment
-- ID) — same SECURITY DEFINER pattern as get_leads().
create or replace function public.get_commissions()
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
  order by created_at desc
  limit 1000;
$$;
