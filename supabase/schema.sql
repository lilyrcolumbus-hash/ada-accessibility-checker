-- SiteSafe Database Schema
-- Run this in Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  plan text not null default 'free',
  stripe_customer_id text,
  rescans_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Scans table
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  url text not null,
  domain text not null,
  score integer not null,
  total_issues integer not null default 0,
  critical_count integer not null default 0,
  serious_count integer not null default 0,
  moderate_count integer not null default 0,
  minor_count integer not null default 0,
  results jsonb not null default '{}',
  scan_duration_ms integer,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scans_domain on public.scans(domain);

-- 3. Purchases table (one-time payments)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null,
  stripe_payment_id text,
  amount integer,
  referred_by text, -- partner ref code, set on both first purchase and each subscription renewal
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

create policy "Users can view own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- 4. Shared reports table
create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  is_active boolean default true,
  views integer default 0,
  created_at timestamptz not null default now()
);

alter table public.shared_reports enable row level security;

create policy "Users can manage own shared reports"
  on public.shared_reports for all
  using (auth.uid() = user_id);

create policy "Anyone can view active shared reports"
  on public.shared_reports for select
  using (is_active = true);

-- 5. Badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  domain text not null,
  last_scan_score integer,
  last_scan_date timestamptz,
  is_active boolean default true,
  badge_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.badges enable row level security;

create policy "Users can manage own badges"
  on public.badges for all
  using (auth.uid() = user_id);

create policy "Anyone can verify badges"
  on public.badges for select
  using (is_active = true);

-- 6. Scan usage table (rate limiting)
create table if not exists public.scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address text,
  scan_count integer not null default 1,
  period_start timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now()
);

alter table public.scan_usage enable row level security;

create policy "Users can view own usage"
  on public.scan_usage for select
  using (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function: get shared report by token
create or replace function public.get_shared_report(report_token text)
returns jsonb as $$
declare
  report_data jsonb;
begin
  select jsonb_build_object(
    'scan', jsonb_build_object(
      'url', s.url,
      'domain', s.domain,
      'score', s.score,
      'total_issues', s.total_issues,
      'critical_count', s.critical_count,
      'serious_count', s.serious_count,
      'moderate_count', s.moderate_count,
      'minor_count', s.minor_count,
      'results', s.results,
      'created_at', s.created_at
    ),
    'shared_at', sr.created_at,
    'views', sr.views
  )
  into report_data
  from public.shared_reports sr
  join public.scans s on s.id = sr.scan_id
  where sr.token = report_token and sr.is_active = true;

  -- Increment views
  update public.shared_reports
  set views = views + 1
  where token = report_token;

  return report_data;
end;
$$ language plpgsql security definer;

-- Function: verify badge
create or replace function public.verify_badge(badge_token_param text)
returns jsonb as $$
declare
  badge_data jsonb;
begin
  select jsonb_build_object(
    'domain', b.domain,
    'score', b.last_scan_score,
    'last_scan_date', b.last_scan_date,
    'is_active', b.is_active
  )
  into badge_data
  from public.badges b
  where b.badge_token = badge_token_param and b.is_active = true;

  return badge_data;
end;
$$ language plpgsql security definer;

-- Function: create a shareable report row for a scan owned by the caller, return token
create or replace function public.create_shared_report(scan_id_param uuid)
returns text as $$
declare
  new_token text;
  scan_owner uuid;
begin
  select user_id into scan_owner from public.scans where id = scan_id_param;
  if scan_owner is null then raise exception 'scan not found'; end if;
  if scan_owner <> auth.uid() then raise exception 'forbidden'; end if;

  select token into new_token
  from public.shared_reports
  where scan_id = scan_id_param and is_active = true
  limit 1;
  if new_token is not null then return new_token; end if;

  insert into public.shared_reports (scan_id, user_id)
  values (scan_id_param, auth.uid())
  returning token into new_token;
  return new_token;
end;
$$ language plpgsql security definer;

-- Function: upsert a badge for caller's domain, return badge_token
create or replace function public.upsert_badge(domain_param text, score_param integer)
returns text as $$
declare
  existing_token text;
begin
  if auth.uid() is null then raise exception 'must be authenticated'; end if;

  select badge_token into existing_token
  from public.badges
  where user_id = auth.uid() and domain = domain_param
  limit 1;

  if existing_token is not null then
    update public.badges
    set last_scan_score = score_param, last_scan_date = now(), is_active = true
    where user_id = auth.uid() and domain = domain_param;
    return existing_token;
  end if;

  insert into public.badges (user_id, domain, last_scan_score, last_scan_date)
  values (auth.uid(), domain_param, score_param, now())
  returning badge_token into existing_token;
  return existing_token;
end;
$$ language plpgsql security definer;

-- Function: atomically enforce the per-plan re-scan limit, then increment.
-- This is the REAL enforcement of the re-scan limit — the client gate is only UX.
-- Reads the caller's plan, locks the row (FOR UPDATE) so concurrent calls can't
-- both pass the check, raises 'rescan_limit_reached' when the allowance is spent,
-- otherwise increments rescans_used and returns the new value.
-- Allowance per plan MUST stay in sync with src/config/plans.ts (rescansAllowed).
create or replace function public.increment_rescan()
returns integer as $$
declare
  caller_plan text;
  used integer;
  allowed integer;  -- NULL means unlimited
  new_count integer;
begin
  if auth.uid() is null then raise exception 'must be authenticated'; end if;

  select plan, rescans_used into caller_plan, used
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then raise exception 'profile not found'; end if;

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

grant execute on function public.create_shared_report(uuid) to authenticated;
grant execute on function public.upsert_badge(text, integer) to authenticated;
grant execute on function public.increment_rescan() to authenticated;

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Subscription lifecycle handled by Stripe webhook (checkout.session.completed, invoice.paid, customer.subscription.deleted)

-- Leads (email capture for marketing)
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  created_at timestamptz default now()
);

-- Allow anonymous inserts for lead capture (no auth required)
alter table public.leads enable row level security;
create policy "Anyone can submit a lead" on public.leads for insert with check (true);
create policy "Only service role can read leads" on public.leads for select using (false);
