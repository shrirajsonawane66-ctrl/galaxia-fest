-- Galaxia i-Fest — Events table
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  heading text not null,
  description text not null check (char_length(description) <= 160),
  date date not null,
  start_time text not null,
  end_time text,
  image_url text,
  image_alt text,
  event_name text not null,
  location text not null,
  category text not null,
  action_label text,
  action_type text not null default 'none' check (action_type in ('link', 'calendar', 'none')),
  action_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_public_idx
  on public.events (status, date, start_time, sort_order);

create index if not exists events_day_category_idx
  on public.events (date, category);

create or replace function public.events_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.events_set_updated_at();

alter table public.events enable row level security;

-- Public can read published events only.
drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select
  using (status = 'published');

-- Admins (admin_profiles) can read everything.
drop policy if exists "Admins can read all events" on public.events;
create policy "Admins can read all events"
  on public.events for select
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Admins can write. The API also uses the service-role key.
drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Sample data (clearly marked "Sample event" in the description)
-- ---------------------------------------------------------------------------
insert into public.events
  (id, slug, heading, description, date, start_time, end_time, image_url, image_alt,
   event_name, location, category, action_label, action_type, action_url, status,
   featured, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'day-1-main-stage-opening', 'Day 1 · Main Stage',
   'Sample event — the gates open with a full cosmic overture and student showcase.',
   '2025-12-19', '10:30', '12:00',
   'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
   'Concert crowd under warm stage lights', 'Opening Ceremony', 'Cosmos Stage', 'Music',
   'Register', 'link', 'https://galaxia-i-fest.in/#passes', 'published', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'day-1-neon-dance-battle', 'Day 1 · Arena',
   'Sample event — crews battle under neon light for the Galaxia dance crown.',
   '2025-12-19', '14:00', '16:30',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
   'Dancers performing on a lit stage', 'Neon Dance Battle', 'Void Arena', 'Dance',
   'Add to calendar', 'calendar', null, 'published', false, 2),
  ('33333333-3333-4333-8333-333333333333', 'day-2-valorant-lan-finals', 'Day 2 · Gaming Dome',
   'Sample event — the campus LAN finals stream live with a ₹25k prize pool.',
   '2025-12-20', '11:00', '17:00',
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
   'Gaming setup with neon keyboard and monitor', 'Valorant LAN Finals', 'Gaming Dome', 'Gaming',
   'Register', 'link', 'https://galaxia-i-fest.in/#passes', 'published', true, 1),
  ('44444444-4444-4444-8444-444444444444', 'day-2-ai-jam-workshop', 'Day 2 · Lab',
   'Sample event — build a tiny generative music app in a hands-on AI jam.',
   '2025-12-20', '13:30', '15:30',
   'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
   'Circuit board and laptop on a workshop desk', 'AI Jam Workshop', 'Innovation Lab', 'Tech',
   'Reserve seat', 'link', 'https://galaxia-i-fest.in/#passes', 'published', false, 2),
  ('55555555-5555-4555-8555-555555555555', 'day-3-cosplay-runway', 'Day 3 · Runway',
   'Sample event — cosplayers take the runway for the Galaxia multiverse finals.',
   '2025-12-21', '12:00', '14:00',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
   'Performer in costume on a stage', 'Cosplay Runway', 'Nebula Runway', 'Workshop',
   'Add to calendar', 'calendar', null, 'published', true, 1),
  ('66666666-6666-4666-8666-666666666666', 'day-3-closing-headliner', 'Day 3 · Main Stage',
   'Sample event — the closing headliner brings the cosmos down for the final night.',
   '2025-12-21', '19:00', '22:30',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
   'Singer performing under blue stage lights', 'Closing Headliner', 'Cosmos Stage', 'Music',
   'Get passes', 'link', 'https://galaxia-i-fest.in/#passes', 'published', false, 2)
on conflict (id) do nothing;
