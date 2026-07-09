-- Allows the outreach dashboard (anon key) to read leads via RPC.
-- SECURITY DEFINER runs as postgres, bypassing RLS — same pattern as get_shared_report().
create or replace function public.get_leads()
returns table(id uuid, email text, created_at timestamptz)
language sql
security definer
as $$
  select id, email, created_at
  from public.leads
  order by created_at desc
  limit 500;
$$;
