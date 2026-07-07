---
name: tyme-data-layer
description: Supabase auth, database schema, RLS and CHECK constraints, realtime subscription pattern, and Google People API integration for Tyme. Use when touching src/lib/supabase.ts or providers.tsx, adding/altering tables or columns, debugging login/OAuth/redirect issues, working with RLS, realtime sync, Google Contacts, or the profiles/projects/tags/entries tables.
---

# Tyme Data Layer (Supabase)

Everything lives in [src/lib/supabase.ts](src/lib/supabase.ts). No other file imports `@supabase/supabase-js`. Keep it that way — components go through `TymeProvider` handlers.

## Client + environment

```ts
export const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
```
- Both env vars are **required at module load** — the file throws at import time if missing. A blank white screen with "Missing NEXT_PUBLIC_SUPABASE_URL..." in console means `.env` isn't loaded (restart `npm run dev` after editing `.env`).
- `.env` is gitignored (`.env*` except `.env.example`). `GEMINI_API_KEY` also sits in `.env` but is **unused** (AI Studio leftover).
- Anon key in the browser is by design; **RLS is the security boundary**. Never put the service-role key anywhere client-reachable.

## Database schema (Postgres, snake_case)

There is no SQL/migrations directory in the repo — the schema lives in the Supabase dashboard, and **[security_spec.md](security_spec.md) is the authoritative spec** (rewritten v2.3.2): RLS policies with `USING`/`WITH CHECK` on `auth.uid()`, anon-role privileges revoked, id pattern `^[A-Za-z0-9_-]{1,128}$`, `workday_target_hours` 1–24, `hourly_rate` 0–100000, description ≤2000 chars, duration ≤1440 min, ≤50 tags, all free text length-bounded. Apply its reference SQL via the dashboard SQL editor. Tables as the code sees them:

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id (uuid, PK = auth.users.id)`, `email NOT NULL`, `name NOT NULL`, `picture`, `workday_target_hours` (default 8), `logo_style` ('classic'\|'minimalist'\|'hourglass'), `hourly_rate` (default 1) | One row per user; realtime filter `id=eq.{uid}` |
| `projects` | `id (text, PK)`, `user_id (uuid)`, `name`, `client`, `color` | `proj-{uuid}` ids; `deleteProjectFromFS` exists |
| `tags` | `id (text, PK)`, `user_id`, `name` | `tag-{uuid}` ids |
| `entries` | `id (text, PK)`, `user_id`, `description`, `project_id (text, '' when none)`, `tags (text[] of tag NAMES)`, `date (YYYY-MM-DD string)`, `start_time (HH:MM)`, `end_time (HH:MM)`, `duration_minutes (int)` | `entry-{uuid}` ids (legacy `entry-{ts}-{rand}` rows persist) |

Camel↔snake mapping is done by hand in each subscribe/save function. If you add a column: add it to the table, the fetch mapper, the save mapper, the TS type, the profile subscription callback in providers.tsx (if user-settable), AND the constraints in security_spec.md.

**Client-side mirrors of the DB constraints:** `saveUserProfileToFS` clamps `workday_target_hours` to 1–24 and `hourly_rate` to 0–100000 and length-slices email/name/picture — so bad values fail fast locally instead of erroring on save. Keep the clamps in sync with the CHECK constraints. Realtime requires the tables be in the `supabase_realtime` publication; RLS also gates the `postgres_changes` stream (subscribers only receive rows their JWT can SELECT).

## The profiles upsert trap (do not "simplify")

`saveUserProfileToFS` does **select → then update OR insert**, not a single `upsert`, because `email`/`name` are NOT NULL: a partial-update upsert would fail the INSERT arm of the upsert with a constraint violation (this was a real bug, fixed in commit 8d9c5cc). Partial saves like `{logoStyle: 'hourglass'}` must keep working.

Other tables use plain `.upsert(..., { onConflict: 'id' })` — safe because every save sends the full row.

## Realtime subscription pattern

`createRealtimeSubscription(channelName, table, userId, fetchFn, onUpdate)`:
1. Initial `fetchFn()` → `onUpdate(rows)`.
2. Channel `.on('postgres_changes', {event:'*', schema:'public', table, filter: 'user_id=eq.{uid}'})` → **re-fetch the ENTIRE table** and call `onUpdate` again. (Matches old Firestore `onSnapshot` semantics; simple, not incremental.)
3. Returns an unsubscribe closure (`supabase.removeChannel`). `providers.tsx` calls all four unsubscribers on user change/unmount.

Channel names: `profile-${uid}`, `projects-${uid}`, `tags-${uid}`, `entries-${uid}`. The profiles subscription is hand-rolled (same shape) because its filter column is `id` not `user_id`.

Consequences: every write costs a full-table refetch per subscribed table; there's no pagination — fine at personal-tracker scale, revisit before multi-tenant/team features.

## Auth flows

**Google OAuth (redirect-based)** — `googleSignIn()`:
- `signInWithOAuth({provider:'google', options:{redirectTo: \`${origin}/calendar\`, scopes: 'userinfo.profile userinfo.email contacts.readonly'}})`.
- The browser leaves the page; nothing after the call runs. On return, `onAuthStateChange` fires in `initAuth` (subscribed by TymeProvider).
- **Supabase dashboard requirement:** every deployment origin AND `{origin}/calendar` must be listed in Auth → URL Configuration → Redirect URLs, or the callback is rejected. This is the #1 cause of "login works locally but not on Vercel".

**Email/password** — `signUpWithEmail(fullName, email, password)` stores the name in `user_metadata.full_name` (providers.tsx reads it to seed the profile); `emailRedirectTo: ${origin}/login`. If email confirmation is ON in the dashboard, `data.session` is null → LoginScreen shows the "check your inbox" banner. `signInWithEmail` → `signInWithPassword`; success flows through `onAuthStateChange` like OAuth.

**Session → app state**: `initAuth` caches `session.provider_token` (Google access token, only present right after OAuth) in a module-level variable for the People API; on auth success TymeProvider builds `UserProfile` from `user_metadata` (dicebear avatar fallback), seeds the profile row, and opens the four subscriptions. Logout: `supabase.auth.signOut()`, clear token cache, clear all state + the 5 `tyme_timer_*` localStorage keys.

## Google Contacts (People API)

`fetchGoogleContacts()` GETs `people/me/connections?personFields=names,emailAddresses,photos&pageSize=100` with `Bearer {cachedProviderToken}`. Returns `[]` (with a console.warn) when there's no token — i.e. **always empty for email/password users and for OAuth sessions restored from storage** (Supabase only supplies `provider_token` on the initial OAuth callback; it is not persisted). Contacts land in `useTyme().contacts` and are currently only passed to SettingsView (accepted as prop, minimal use).

## Error handling convention

`handleSupabaseError(err, OperationType.X, table)` logs a JSON diagnostic and **re-throws** `new Error(JSON.stringify(errInfo))`. Callers in providers.tsx mostly let it bubble; `handleDeleteEntry` catches and shows a sonner toast. Note: inside it, `supabase.auth.getUser()` is called without await and the result is discarded — authInfo is always null (harmless dead code).

## Networking constraint: the CSP allowlist

`next.config.ts` ships a Content-Security-Policy whose `connect-src` allows only `'self'`, `https://*.supabase.co`, `wss://*.supabase.co`, `https://people.googleapis.com`, and Vercel Analytics. **Any new external API call must be added there** or it will be silently blocked in production while working in dev tooling.

## Firebase migration script (deleted)

The one-time Firestore→Supabase migration script was removed in v2.3.2 (commit `de7d2d7`), along with its `tsx` devDependency. If it's ever needed again, recover it from git history: `git show de7d2d7~1:scripts/migrate-firebase-to-supabase.ts`. It mapped users by email and required the service-role key.
