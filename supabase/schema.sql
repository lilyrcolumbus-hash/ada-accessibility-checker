-- SiteSafe Database Schema
-- Run this in Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  plan text not null default 'free',
  stripe_customer_id text,
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
