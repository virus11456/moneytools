-- Apply in the user-selected Supabase project. No existing app tables are changed.
begin;

create table public.moneytools_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z]{1,6}(-[A-Z])?$'),
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

alter table public.moneytools_watchlist enable row level security;
alter table public.moneytools_watchlist force row level security;
revoke all on public.moneytools_watchlist from anon, authenticated;
grant select, insert, delete on public.moneytools_watchlist to authenticated;

create policy moneytools_watchlist_read_own
  on public.moneytools_watchlist for select to authenticated
  using ((select auth.uid()) = user_id);
create policy moneytools_watchlist_add_own
  on public.moneytools_watchlist for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy moneytools_watchlist_remove_own
  on public.moneytools_watchlist for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.moneytools_watchlist is
  'Moneytools private watchlists. One row per user and ticker; owner-only access.';

commit;
