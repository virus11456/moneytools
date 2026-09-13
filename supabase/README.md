# Moneytools cloud watchlist — setup pending

The live app still uses browser-local favorites. This migration is preparation,
not evidence that authentication or cross-device synchronization is enabled.

## Deployment prerequisites

1. The owner selects a Supabase project. On 2026-09-13 the dashboard blocked a
   new free project because both active free project slots were occupied.
   Do not pause, delete, upgrade, or repurpose an existing project without the
   owner's selection.
2. Apply `migrations/202609130001_moneytools_watchlist.sql` once. It creates only
   the dedicated Moneytools table. It does not change existing tables or Auth
   configuration. When sharing a project, Auth identities and provider settings
   are shared: table separation alone does not isolate authentication.
3. Before email-link login is enabled, verify the project's SMTP setup. Supabase's
   default mail service is restricted to project team addresses; a general login
   requires a configured delivery provider. Preserve existing app redirect URLs
   and Site URL when adding the Moneytools callback URL.
4. Configure only the public Supabase URL and publishable key in the frontend.
   Never include a service-role/secret key in browser code or Git.

## Integration contract

- Logged out: preserve `moneytools.saved-symbols.v1` on the current browser.
- Logged in: read the current user's rows, and insert/delete individual ticker
  rows; never replace the whole list from a possibly stale device snapshot.
- Import browser favorites only after the user clicks an explicit merge button.
  Ignore duplicate `(user_id, symbol)` inserts; preserve existing cloud favorites.
- On account switch or logout, immediately clear the previous user's cloud state.
  Ignore outstanding responses belonging to the previous session.
- Refresh cloud favorites on focus/visibility and provide a manual refresh.
- Show pending/error states and do not claim a failed write was saved.
- Validate owner isolation with two authenticated identities plus an anonymous
  request before exposing login. Test cross-device merge and removal, logout,
  expired links, offline errors, and the existing local-only experience.

Official references:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-passwordless
