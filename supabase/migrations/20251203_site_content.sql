create extension if not exists "pgcrypto";

create table if not exists public.site_content (
  id text primary key,
  section text not null,
  data jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_content_public_idx
  on public.site_content (section, status, sort_order);

create or replace function public.site_content_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.site_content_set_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Public can read published content" on public.site_content;
create policy "Public can read published content"
  on public.site_content for select
  using (status = 'published');

drop policy if exists "Admins can read content" on public.site_content;
create policy "Admins can read content"
  on public.site_content for select
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can insert content" on public.site_content;
create policy "Admins can insert content"
  on public.site_content for insert
  with check (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can update content" on public.site_content;
create policy "Admins can update content"
  on public.site_content for update
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admins can delete content" on public.site_content;
create policy "Admins can delete content"
  on public.site_content for delete
  using (
    exists (
      select 1 from public.admin_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

insert into public.site_content (id, section, data, status, sort_order)
values
  ('settings', 'settings', '{"title":"Galaxia i-Fest","tagline":"WHERE MUSIC MEETS THE COSMOS","description":"Three days. Four stages. Fifty thousand souls under one nebula sky. The largest college music festival returns for its most electrifying edition yet.","theme":"Where Music Meets the Cosmos","aboutTitle":"A festival out of this world.","aboutText1":"Galaxia is not just a festival — it is an interstellar rite of passage. Born on a college campus in 2013 with a single stage and a dream, we have become the most anticipated cultural gathering in the region.","aboutText2":"From bass-shaking headliners and student anthems, to hackathons under the stars, cosplay parades, cinema on the lawn and midnight art installations — every corner of Galaxia is designed to feel like stepping through a wormhole into a universe built by, and for, the next generation.","collegeName":"Western College of Business Management","dateLabel":"17–19 December 2026","venueName":"","venueAddress":"","mapsUrl":"","contactName":"","contactPhone":"","contactEmail":"","bookingInstructions":"","bookingUrl":"","showPrices":false}'::jsonb, 'published', 0),
  ('00000000-0000-4000-9000-000000000001', 'tickets', '{"name":"Regular","description":"General admission — common & back rows","price":499,"benefits":["General entry — all three days","Back rows & standing zone","Access to 4 stages","Food court access"],"capacity":2000,"soldCount":342,"active":true}'::jsonb, 'draft', 1),
  ('00000000-0000-4000-9000-000000000002', 'tickets', '{"name":"Silver","description":"Mid-tier — middle rows, elevated view","price":999,"benefits":["Everything in Regular","Middle rows reserved","Priority entry lane","Exclusive Silver lounge"],"capacity":800,"soldCount":412,"active":true}'::jsonb, 'draft', 2),
  ('00000000-0000-4000-9000-000000000003', 'tickets', '{"name":"Gold Premium","description":"Front rows — closest to stage, premium","price":1999,"benefits":["Everything in Silver","Front rows — closest to stage","Meet & greet lottery","Premium bar + merch kit","Backstage photo zone"],"capacity":300,"soldCount":178,"active":true}'::jsonb, 'draft', 3)
on conflict (id) do nothing;
