-- Pedagang Handal v1.2: initial product snapshot table
-- Run only in the dedicated Pedagang Handal Supabase project.
-- Do NOT run this in Bravotax/another Supabase project.
-- Requires Supabase Auth (auth.users). A row belongs to exactly one account.

create table if not exists public.product_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint product_snapshots_products_array check (jsonb_typeof(products) = 'array')
);

alter table public.product_snapshots enable row level security;

-- Limit Data API privileges to signed-in users. Row ownership is enforced by RLS below.
revoke all on public.product_snapshots from anon;
grant select, insert, update, delete on public.product_snapshots to authenticated;

-- Idempotent setup: prevent duplicate policy name errors if run again.
drop policy if exists "ph_snapshots_select_own" on public.product_snapshots;
create policy "ph_snapshots_select_own"
on public.product_snapshots for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ph_snapshots_insert_own" on public.product_snapshots;
create policy "ph_snapshots_insert_own"
on public.product_snapshots for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ph_snapshots_update_own" on public.product_snapshots;
create policy "ph_snapshots_update_own"
on public.product_snapshots for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ph_snapshots_delete_own" on public.product_snapshots;
create policy "ph_snapshots_delete_own"
on public.product_snapshots for delete to authenticated
using ((select auth.uid()) = user_id);

-- Optional verification in SQL Editor:
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename = 'product_snapshots';
-- select policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename = 'product_snapshots';