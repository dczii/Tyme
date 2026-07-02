-- ============================================================================
-- Tyme — Database security hardening (Row Level Security + data invariants)
-- ============================================================================
-- The Tyme client talks to Supabase directly with the public anon key, so the
-- ONLY real access control is what this file enforces inside Postgres. The
-- client-side .eq('user_id', ...) filters are convenience, not security.
--
-- Apply with the Supabase CLI (`supabase db push`) or paste into the
-- Dashboard → SQL Editor and run. The script is idempotent: it can be re-run
-- safely against a database where the tables and older policies already exist.
--
-- Invariants enforced here (see security_spec.md):
--   * A user can only read/write rows they own (auth.uid()).
--   * Anonymous (anon) role has no access to any user data table.
--   * Document IDs match ^[A-Za-z0-9_-]{1,128}$ (no ID poisoning).
--   * workday_target_hours is between 1 and 24; hourly_rate is 0..100000.
--   * Time entries have a non-empty bounded description and a positive
--     bounded duration (max 24h per entry).
--   * Text fields are length-bounded to prevent storage-exhaustion payloads.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables (no-ops when they already exist; documents the expected schema)
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  picture text,
  workday_target_hours numeric not null default 8,
  logo_style text not null default 'classic',
  hourly_rate numeric not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  client text not null default '',
  color text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  project_id text not null default '',
  tags text[] not null default '{}',
  date text not null,
  start_time text not null,
  end_time text not null,
  duration_minutes integer not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists tags_user_id_idx on public.tags (user_id);
create index if not exists entries_user_id_idx on public.entries (user_id);

-- ----------------------------------------------------------------------------
-- 2. Row Level Security — deny by default, owner-only policies
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.entries enable row level security;

-- Belt and braces: even if a policy were ever added for anon, revoke the
-- table privileges the Supabase default grants give the anonymous role.
revoke all on public.profiles from anon;
revoke all on public.projects from anon;
revoke all on public.tags from anon;
revoke all on public.entries from anon;

-- profiles: a user manages exactly one row, keyed by their auth uid.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

-- projects / tags / entries: sandboxed by user_id ownership. WITH CHECK stops
-- both spoofed inserts (user_id != auth.uid()) and ownership transfers on
-- update; USING stops reads, updates, and deletes of other users' rows —
-- including upserts that collide with someone else's primary key.
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 3. Data invariants (CHECK constraints)
-- ----------------------------------------------------------------------------
-- Added as NOT VALID so applying this to a database with legacy rows never
-- fails; every NEW insert/update is still validated. Run
--   alter table <t> validate constraint <name>;
-- afterwards if you want existing rows verified too. Each ADD is wrapped so
-- re-running the script is a no-op instead of a duplicate-constraint error.

do $$
begin
  -- profiles
  begin
    alter table public.profiles add constraint profiles_target_hours_range
      check (workday_target_hours >= 1 and workday_target_hours <= 24) not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.profiles add constraint profiles_hourly_rate_range
      check (hourly_rate >= 0 and hourly_rate <= 100000) not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.profiles add constraint profiles_logo_style_allowed
      check (logo_style in ('classic', 'minimalist', 'hourglass')) not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.profiles add constraint profiles_text_bounds
      check (
        char_length(email) <= 320
        and char_length(name) between 1 and 200
        and (picture is null or char_length(picture) <= 2048)
      ) not valid;
  exception when duplicate_object then null; end;

  -- projects
  begin
    alter table public.projects add constraint projects_id_format
      check (id ~ '^[A-Za-z0-9_-]{1,128}$') not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.projects add constraint projects_text_bounds
      check (
        char_length(name) between 1 and 200
        and char_length(client) <= 200
        and char_length(color) <= 64
      ) not valid;
  exception when duplicate_object then null; end;

  -- tags
  begin
    alter table public.tags add constraint tags_id_format
      check (id ~ '^[A-Za-z0-9_-]{1,128}$') not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.tags add constraint tags_name_bounds
      check (char_length(name) between 1 and 100) not valid;
  exception when duplicate_object then null; end;

  -- entries
  begin
    alter table public.entries add constraint entries_id_format
      check (id ~ '^[A-Za-z0-9_-]{1,128}$') not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.entries add constraint entries_description_bounds
      check (char_length(btrim(description)) between 1 and 2000) not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.entries add constraint entries_duration_bounds
      check (duration_minutes > 0 and duration_minutes <= 1440) not valid;
  exception when duplicate_object then null; end;
  begin
    alter table public.entries add constraint entries_tags_bounds
      check (coalesce(array_length(tags, 1), 0) <= 50) not valid;
  exception when duplicate_object then null; end;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Realtime
-- ----------------------------------------------------------------------------
-- The client subscribes to postgres_changes on these tables. With RLS enabled,
-- Supabase Realtime only delivers rows the subscriber's JWT is allowed to
-- SELECT, so the policies above also gate the realtime stream. Ensure the
-- tables are part of the realtime publication (no-op if already added):

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.projects;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.tags;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.entries;
  exception when duplicate_object then null; end;
end $$;
