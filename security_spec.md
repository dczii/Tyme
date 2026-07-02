# Security Specification for Tyme Workspace

This document defines the security invariants, malicious attack payloads, and test
procedures for verifying high-stakes data access control. Tyme is a client-only
Next.js app talking directly to Supabase PostgreSQL with the public anon key, so
**every invariant below must be enforced inside the database** by Row Level
Security policies and CHECK constraints, applied via the Supabase Dashboard SQL
Editor (reference SQL in section 4). Client-side filters (`.eq('user_id', ...)`)
are convenience only — an attacker can issue arbitrary PostgREST queries with
the anon key.

## 1. Data Invariants

- Each profile row `profiles.id` can only be read, created, updated, or deleted by
  the authenticated owner (`id = auth.uid()`).
- `projects`, `tags`, and `entries` rows are sandboxed by `user_id = auth.uid()`
  for every operation (SELECT / INSERT / UPDATE / DELETE), enforced by RLS
  `USING` and `WITH CHECK` clauses. Upserts that collide with another user's
  primary key are rejected because the UPDATE path cannot see the victim's row
  and the INSERT path fails the `WITH CHECK`.
- The anonymous (`anon`) role has no policies and its table privileges are
  revoked: unauthenticated requests can never touch user data.
- Every document ID must match `^[A-Za-z0-9_-]{1,128}$` to avoid ID poisoning.
- `workday_target_hours` must be between 1 and 24; `hourly_rate` between 0 and
  100000; `logo_style` one of the approved values.
- Time entries must have a non-empty description (≤ 2000 chars), a positive
  bounded duration (≤ 1440 minutes), and at most 50 tags.
- All free-text fields are length-bounded to block storage-exhaustion payloads.
- Realtime (`postgres_changes`) delivers only rows the subscriber's JWT can
  SELECT, so RLS also gates the live stream.

## 2. The "Dirty Dozen" Payloads (Vulnerability Attacks Rejected)

Run these with `curl` against the PostgREST endpoint (`/rest/v1/...`) using the
anon key plus (where noted) a valid JWT for `user_A`.

1. **Identity Spoofing — External Profile Read/Write**
   - Attack: As `user_A`, `GET /rest/v1/profiles?id=eq.<user_B_uuid>` or `PATCH` it.
   - Expected: empty result set / `0 rows` (RLS filters the row out).

2. **Poison Document ID**
   - Attack: Insert a project whose `id` is 1,000 characters or contains binary/`%00` bytes.
   - Expected: rejected by `projects_id_format` CHECK constraint.

3. **Spoofed Ownership on Insert**
   - Attack: As `user_A`, insert a project with `user_id = <user_B_uuid>`.
   - Expected: rejected by the `WITH CHECK (user_id = auth.uid())` policy.

4. **Orphan / Cross-Tenant Upsert**
   - Attack: As `user_A`, upsert an entry using an `id` that belongs to `user_B`
     (`POST /rest/v1/entries` with `Prefer: resolution=merge-duplicates`).
   - Expected: rejected — the UPDATE path sees no row, the INSERT path violates
     the primary key or `WITH CHECK`.

5. **Blanket Query — Listing all users' rows**
   - Attack: `GET /rest/v1/entries?select=*` with no filter (anon key + `user_A` JWT).
   - Expected: only `user_A`'s rows are returned, never another tenant's.

6. **Target Hours Exploitation**
   - Attack: Update `workday_target_hours` to `999` or `-5`.
   - Expected: rejected by `profiles_target_hours_range` CHECK constraint.

7. **Injecting Oversized Fields**
   - Attack: Create a time entry with a 100,000-character description to trigger
     storage exhaustion.
   - Expected: rejected by `entries_description_bounds` CHECK constraint.

8. **Tampering with Tags on other workspaces**
   - Attack: As `user_A`, `DELETE /rest/v1/tags?id=eq.<user_B_tag>`.
   - Expected: `0 rows` deleted (RLS hides the row).

9. **Mismatched Time values**
   - Attack: Submit an entry with `duration_minutes = -30` or `= 100000`.
   - Expected: rejected by `entries_duration_bounds` CHECK constraint.

10. **Ownership Transfer on Update**
    - Attack: As `user_A`, `PATCH` an owned entry setting `user_id = <user_B_uuid>`.
    - Expected: rejected by the UPDATE policy's `WITH CHECK`.

11. **Realtime Eavesdropping**
    - Attack: Subscribe to `postgres_changes` on `entries` with a filter for
      `user_id=eq.<user_B_uuid>` while authenticated as `user_A`.
    - Expected: no events delivered — Realtime authorization applies RLS.

12. **Anonymous Access Breach**
    - Attack: Read or write any table with only the anon key (no user JWT).
    - Expected: `permission denied` / empty results — no anon policies exist and
      anon table grants are revoked.

## 3. Application-Layer Hardening (this repo)

- **HTTP security headers** (`next.config.ts`): CSP restricting script/connect
  origins, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, HSTS, and a minimal `Permissions-Policy`.
- **CSV export** neutralizes spreadsheet formula injection (`=`, `+`, `-`, `@`
  prefixes) in `src/utils.ts`.
- **JSON-LD** output escapes `<` so structured data can never break out of its
  `<script>` tag (`src/app/layout.tsx`).
- **Row IDs** are generated with `crypto.randomUUID()`, not `Math.random()`.
- **Secrets**: only the anon key ships to the browser; the service-role key is
  read from the environment by the offline migration script and must never be
  committed or exposed with `NEXT_PUBLIC_`. `.env*` is gitignored.
- **Auth**: Supabase Auth (Google OAuth + email/password). Enable email
  confirmation and leaked-password protection in the Supabase dashboard
  (Auth → Providers → Email) so unverified or breached credentials are rejected.

## 4. Reference Policy SQL (apply in Supabase Dashboard → SQL Editor)

Owner-only RLS for `profiles` (keyed by `id`) — repeat the same four policies
for `projects`, `tags`, and `entries` using `user_id = (select auth.uid())`:

```sql
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));
```

Data-invariant CHECK constraints (add as `NOT VALID` if legacy rows exist):

```sql
alter table public.profiles add constraint profiles_target_hours_range
  check (workday_target_hours >= 1 and workday_target_hours <= 24);
alter table public.profiles add constraint profiles_hourly_rate_range
  check (hourly_rate >= 0 and hourly_rate <= 100000);
alter table public.entries add constraint entries_id_format
  check (id ~ '^[A-Za-z0-9_-]{1,128}$');
alter table public.entries add constraint entries_description_bounds
  check (char_length(btrim(description)) between 1 and 2000);
alter table public.entries add constraint entries_duration_bounds
  check (duration_minutes > 0 and duration_minutes <= 1440);
alter table public.entries add constraint entries_tags_bounds
  check (coalesce(array_length(tags, 1), 0) <= 50);
-- equivalent id-format and text-length bounds on projects and tags
```
