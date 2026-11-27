-- Galaxia i-Fest — extend the existing events table for the 2026 Events system.
-- Run in the Supabase SQL editor or via `supabase db push`.
-- This EXTENDS public.events; no duplicate table is created. Existing fields,
-- rows and API routes keep working.

create extension if not exists "pgcrypto";

alter table public.events
  add column if not exists day integer check (day in (1, 2)),
  add column if not exists theme text,
  add column if not exists starts_at timestamptz,
  add column if not exists rules text[] not null default '{}',
  add column if not exists whatsapp_url text,
  add column if not exists is_published boolean;

-- TBA events genuinely have no date/time. Allow the legacy card columns to be
-- empty while keeping every existing value and route intact.
do $$
declare
  col text;
begin
  foreach col in array array['date', 'start_time', 'heading', 'description',
                             'event_name', 'location', 'category',
                             'title', 'venue', 'start_at']
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'events' and column_name = col
    ) then
      execute format('alter table public.events alter column %I drop not null', col);
    end if;
  end loop;
end $$;

-- Keep the new publish flag in sync with the existing status field.
update public.events
   set is_published = (status = 'published')
 where is_published is null;

-- Backfill the new fields from existing rows where possible.
update public.events
   set day = case
       when date = '2025-12-19' then 1
       when date = '2025-12-20' then 2
       when date = '2025-12-21' then 2
       else day
     end
 where day is null and date is not null;

update public.events
   set starts_at = (date || 'T' || start_time || ':00')::timestamp at time zone 'Asia/Kolkata'
 where starts_at is null
   and date is not null and start_time is not null
   and date ~ '^\d{4}-\d{2}-\d{2}$'
   and start_time ~ '^\d{2}:\d{2}$';

-- The six original sample events are demos, not festival programme entries.
-- They stay in the table (fields/routes unchanged) but are hidden publicly.
update public.events
   set status = 'draft', is_published = false
 where id in (
   '11111111-1111-4111-8111-111111111111',
   '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333',
   '44444444-4444-4444-8444-444444444444',
   '55555555-5555-4555-8555-555555555555',
   '66666666-6666-4666-8666-666666666666'
 );

create index if not exists events_day_order_idx
  on public.events (day, sort_order, title);
create index if not exists events_published_day_idx
  on public.events (is_published, day, sort_order);

-- Anon clients may read published events only. Admin writes still go through
-- the service-role API, which enforces requireAdmin() on every route.
drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select
  using (status = 'published' and is_published);
