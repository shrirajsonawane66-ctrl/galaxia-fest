-- Galaxia i-Fest — Past performers table
-- Run in the Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.performers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  year integer not null check (year >= 2000 and year <= extract(year from now())::int + 1),
  role text not null check (char_length(role) between 2 and 40),
  image text not null default '',
  status text not null default 'published' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Drafts may be saved without a photo; published cards always need one.
  constraint performers_published_image_check
    check (status = 'draft' or char_length(image) > 0)
);

create index if not exists performers_public_idx
  on public.performers (status, sort_order, year desc);

create index if not exists performers_admin_idx
  on public.performers (year desc, sort_order);

create or replace function public.performers_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists performers_set_updated_at on public.performers;
create trigger performers_set_updated_at
  before update on public.performers
  for each row execute function public.performers_set_updated_at();

-- One statement, so a reorder is atomic.
create or replace function public.reorder_performers(p_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.performers as p
  set sort_order = ordered.position::int,
      updated_at = now()
  from (
    select id, ordinality as position
    from unnest(p_ids) with ordinality as input(id, ordinality)
  ) as ordered
  where p.id = ordered.id;
$$;

alter table public.performers enable row level security;

-- Public can read published performers only.
drop policy if exists "Published performers are public" on public.performers;
create policy "Published performers are public"
  on public.performers for select
  using (status = 'published');

-- Admins (admin_profiles) can read everything.
drop policy if exists "Admins can read all performers" on public.performers;
create policy "Admins can read all performers"
  on public.performers for select
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Admins can write. The API also uses the service-role key.
drop policy if exists "Admins can insert performers" on public.performers;
create policy "Admins can insert performers"
  on public.performers for insert
  with check (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can update performers" on public.performers;
create policy "Admins can update performers"
  on public.performers for update
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can delete performers" on public.performers;
create policy "Admins can delete performers"
  on public.performers for delete
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Placeholder seed data — drafts, so they never appear publicly.
-- TODO: replace with real performers (or edit them in Admin → Performers).
-- ---------------------------------------------------------------------------
insert into public.performers
  (id, name, year, role, image, status, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Performer 01', 2025, 'Artist', '', 'draft', 1),
  ('00000000-0000-4000-8000-000000000002', 'Performer 02', 2025, 'Artist', '', 'draft', 2),
  ('00000000-0000-4000-8000-000000000003', 'Performer 03', 2025, 'Artist', '', 'draft', 3),
  ('00000000-0000-4000-8000-000000000004', 'Performer 04', 2025, 'Artist', '', 'draft', 4),
  ('00000000-0000-4000-8000-000000000005', 'Performer 05', 2025, 'Artist', '', 'draft', 5),
  ('00000000-0000-4000-8000-000000000006', 'Performer 06', 2025, 'Artist', '', 'draft', 6),
  ('00000000-0000-4000-8000-000000000007', 'Performer 07', 2025, 'Artist', '', 'draft', 7),
  ('00000000-0000-4000-8000-000000000008', 'Performer 08', 2025, 'Artist', '', 'draft', 8),
  ('00000000-0000-4000-8000-000000000009', 'Performer 09', 2025, 'Artist', '', 'draft', 9),
  ('00000000-0000-4000-8000-000000000010', 'Performer 10', 2025, 'Artist', '', 'draft', 10),
  ('00000000-0000-4000-8000-000000000011', 'Performer 11', 2025, 'Artist', '', 'draft', 11),
  ('00000000-0000-4000-8000-000000000012', 'Performer 12', 2025, 'Artist', '', 'draft', 12)
on conflict (id) do nothing;
