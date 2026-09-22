-- Galaxia Supabase schema
-- Enable UUID
create extension if not exists "pgcrypto";

-- events
create table if not exists events (
  id text primary key,
  title text not null,
  subtitle text,
  description text,
  date text,
  venue text,
  address text,
  college_name text,
  contact_email text,
  contact_phone text,
  instagram_url text,
  youtube_url text,
  x_url text,
  hero_cta text,
  hero_secondary_cta text,
  about_title text,
  about_text1 text,
  about_text2 text,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- passes
create table if not exists passes (
  id text primary key,
  event_id text references events(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  benefits jsonb default '[]',
  price integer not null,
  capacity integer not null,
  sold_count integer default 0,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- artists
create table if not exists artists (
  id text primary key,
  event_id text references events(id) on delete cascade,
  name text not null,
  bio text,
  genre text,
  role text,
  year text,
  image_url text,
  instagram_url text,
  spotify_url text,
  youtube_url text,
  display_order integer default 0,
  featured boolean default false,
  is_active boolean default true,
  size integer default 96,
  orbit integer default 300,
  duration integer default 60,
  start_angle integer default 0,
  spin numeric default 5,
  label text default '#8B5CF6',
  glow text default 'rgba(139,92,246,0.6)',
  accent text default '#C084FC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- schedule
create table if not exists schedule_items (
  id text primary key,
  event_id text references events(id) on delete cascade,
  time text,
  title text,
  description text,
  venue text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- faqs
create table if not exists faqs (
  id text primary key,
  event_id text references events(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text unique not null,
  event_id text references events(id),
  customer_name text not null,
  email text not null,
  phone text not null,
  college_name text,
  college_id text,
  total integer not null,
  currency text default 'INR',
  payment_status text default 'pending',
  booking_status text default 'confirmed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  pass_id text references passes(id),
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  provider text default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  amount integer,
  currency text default 'INR',
  status text,
  raw jsonb,
  created_at timestamptz default now()
);

-- admin profiles (role)
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now()
);

-- RPC for atomic increment
create or replace function increment_pass_sold(p_pass_id text, p_qty integer)
returns void language plpgsql security definer as $$
begin
  update passes set sold_count = sold_count + p_qty, updated_at = now() where id = p_pass_id;
end;
$$;

-- RLS
alter table events enable row level security;
alter table passes enable row level security;
alter table artists enable row level security;
alter table schedule_items enable row level security;
alter table faqs enable row level security;
alter table bookings enable row level security;
alter table booking_items enable row level security;
alter table payments enable row level security;

-- Public read for event content
create policy "public read events" on events for select using (true);
create policy "public read passes" on passes for select using (true);
create policy "public read artists" on artists for select using (true);
create policy "public read schedule" on schedule_items for select using (true);
create policy "public read faqs" on faqs for select using (true);

-- Bookings: allow insert via service role only; public can read own? For demo, allow service.
-- In production, inserts go through service_role key in API routes, so anon cannot insert directly.
create policy "no anon insert bookings" on bookings for insert with check (false);
create policy "no anon update bookings" on bookings for update using (false);
-- Similarly for others
create policy "no anon insert items" on booking_items for insert with check (false);
create policy "no anon insert payments" on payments for insert with check (false);

-- Admin full access via service_role bypasses RLS, or via admin_profiles check
-- Example admin policy (if using anon + JWT): 
-- create policy "admin all passes" on passes for all using (exists (select 1 from admin_profiles where id = auth.uid() and role='admin'));

-- Storage bucket for artist images
insert into storage.buckets (id, name, public) values ('artist-images','artist-images', true) on conflict (id) do nothing;
create policy "public read artist images" on storage.objects for select using (bucket_id='artist-images');
create policy "admin write artist images" on storage.objects for insert with check (bucket_id='artist-images' and auth.role()='authenticated');
create policy "admin update artist images" on storage.objects for update using (bucket_id='artist-images' and auth.role()='authenticated');
