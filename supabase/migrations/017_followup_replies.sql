-- Follow-up sequence + reply tracking, built on the existing universal
-- contact registry (outreach_contacted) so it works for any outreach
-- campaign that already logs contacts there (business, agency, future).
alter table public.outreach_contacted
  add column if not exists followup_1_sent_at timestamptz,
  add column if not exists followup_2_sent_at timestamptz,
  add column if not exists replied boolean default false,
  add column if not exists reply_classification text,
  add column if not exists unsubscribed boolean default false;

-- Narrow, purpose-built RPCs for the n8n workflows to call via the anon key
-- instead of handing a third-party cloud platform the full service_role key.
-- Each function can only do exactly what its name says — nothing else.

create or replace function public.get_followup_candidates(stage int)
returns table(id bigint, email text, name text, website text, contacted_at date)
language sql
security definer
as $$
  select id, email, name, website, contacted_at
  from public.outreach_contacted
  where not coalesce(replied, false)
    and not coalesce(unsubscribed, false)
    and (
      (stage = 1 and followup_1_sent_at is null and contacted_at <= current_date - 3)
      or
      (stage = 2 and followup_1_sent_at is not null and followup_2_sent_at is null
       and followup_1_sent_at <= now() - interval '4 days')
    )
  order by contacted_at asc
  limit 200;
$$;

create or replace function public.mark_followup_sent(contact_id bigint, stage int)
returns void
language sql
security definer
as $$
  update public.outreach_contacted
  set followup_1_sent_at = case when stage = 1 then now() else followup_1_sent_at end,
      followup_2_sent_at = case when stage = 2 then now() else followup_2_sent_at end
  where id = contact_id;
$$;

create or replace function public.mark_reply_received(contact_email text, classification text)
returns void
language sql
security definer
as $$
  update public.outreach_contacted
  set replied = true,
      reply_classification = classification,
      unsubscribed = case when classification = 'unsubscribe' then true else unsubscribed end
  where email = lower(contact_email);
$$;
