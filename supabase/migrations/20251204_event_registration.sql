alter table public.events
  add column if not exists registration_status text not null default 'coming_soon',
  add column if not exists registration_url text,
  add column if not exists rules text,
  add column if not exists participation_type text not null default 'individual',
  add column if not exists requirements text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_registration_status_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_registration_status_check
      check (registration_status in ('open', 'closed', 'coming_soon'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_participation_type_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_participation_type_check
      check (participation_type in ('individual', 'team'));
  end if;
end $$;

create index if not exists events_registration_status_idx
  on public.events (registration_status)
  where status = 'published';
