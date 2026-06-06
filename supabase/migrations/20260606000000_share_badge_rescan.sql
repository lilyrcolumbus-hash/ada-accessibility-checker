-- Migration 014: real shareable reports, real badges, rescan limit enforcement
-- Run this in Supabase SQL Editor (project mvzolbabbkedmlhqhiwi)
--
-- What this adds:
--   1. profiles.rescans_used — counter so we can enforce "1 re-scan" for Fix My Site
--   2. RPC create_shared_report(scan_id) — inserts row + returns token (wired to Share button)
--   3. RPC upsert_badge(domain, score) — inserts or updates badge + returns badge_token
--   4. RPC increment_rescan() — adds 1 to caller's profiles.rescans_used

-- 1. Track re-scans per user
alter table public.profiles
  add column if not exists rescans_used integer not null default 0;

-- 2. Create-on-demand shared report (Share button calls this with a scan id)
create or replace function public.create_shared_report(scan_id_param uuid)
returns text as $$
declare
  new_token text;
  scan_owner uuid;
begin
  -- Verify caller owns the scan
  select user_id into scan_owner
  from public.scans
  where id = scan_id_param;

  if scan_owner is null then
    raise exception 'scan not found';
  end if;

  if scan_owner <> auth.uid() then
    raise exception 'forbidden';
  end if;

  -- Reuse existing active token if user already shared this scan
  select token into new_token
  from public.shared_reports
  where scan_id = scan_id_param and is_active = true
  limit 1;

  if new_token is not null then
    return new_token;
  end if;

  insert into public.shared_reports (scan_id, user_id)
  values (scan_id_param, auth.uid())
  returning token into new_token;

  return new_token;
end;
$$ language plpgsql security definer;

-- 3. Upsert badge for the caller's domain + return token
create or replace function public.upsert_badge(domain_param text, score_param integer)
returns text as $$
declare
  existing_token text;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  select badge_token into existing_token
  from public.badges
  where user_id = auth.uid() and domain = domain_param
  limit 1;

  if existing_token is not null then
    update public.badges
    set last_scan_score = score_param,
        last_scan_date = now(),
        is_active = true
    where user_id = auth.uid() and domain = domain_param;
    return existing_token;
  end if;

  insert into public.badges (user_id, domain, last_scan_score, last_scan_date)
  values (auth.uid(), domain_param, score_param, now())
  returning badge_token into existing_token;

  return existing_token;
end;
$$ language plpgsql security definer;

-- 4. Atomically enforce the per-plan re-scan limit, then increment.
--    This is the REAL enforcement — the client-side gate is only UX.
--    Reads the caller's plan, locks the profile row (FOR UPDATE) so two concurrent
--    calls can't both pass the check, raises 'rescan_limit_reached' when the
--    allowance is spent, otherwise increments and returns the new count.
--    Allowance per plan MUST stay in sync with src/config/plans.ts (rescansAllowed).
create or replace function public.increment_rescan()
returns integer as $$
declare
  caller_plan text;
  used integer;
  allowed integer;  -- NULL means unlimited
  new_count integer;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  select plan, rescans_used into caller_plan, used
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  allowed := case caller_plan
    when 'fix-my-site' then 1
    else null  -- free + compliance-shield = unlimited
  end;

  if allowed is not null and used >= allowed then
    raise exception 'rescan_limit_reached' using errcode = 'P0001';
  end if;

  update public.profiles
  set rescans_used = used + 1
  where id = auth.uid()
  returning rescans_used into new_count;

  return new_count;
end;
$$ language plpgsql security definer;

-- Grants so authenticated users can call these
grant execute on function public.create_shared_report(uuid) to authenticated;
grant execute on function public.upsert_badge(text, integer) to authenticated;
grant execute on function public.increment_rescan() to authenticated;
