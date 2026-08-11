-- UperAI — Admin role
-- Adds an is_admin flag (granted only by trusted server code, never via the
-- public API) and a moderation flag on editor_profiles, plus the RLS
-- policies needed to let admins act on rows they don't own.

-- ============================================================
-- COLUMNS
-- ============================================================
alter table public.users
  add column is_admin boolean not null default false;

-- Soft-hide for the admin view — "hide/unhide", never a hard delete.
alter table public.editor_profiles
  add column is_hidden boolean not null default false;

-- ============================================================
-- LOCK DOWN is_admin
-- RLS is row-level, not column-level, so the existing "owners can update
-- their own row" policy would otherwise let any signed-in user PATCH their
-- own is_admin to true via the public REST API. Revoking column privilege
-- blocks that for every request that goes through the anon/authenticated
-- roles (i.e. everything except server code using the service role key),
-- regardless of which RLS policy would otherwise have allowed the row.
-- The ADMIN_EMAILS bootstrap in src/app/auth/callback/route.ts is the only
-- place that ever sets this column, and it uses the service role client.
-- ============================================================
revoke select (is_admin), update (is_admin)
  on public.users
  from anon, authenticated;

-- SECURITY DEFINER so it can read is_admin (now hidden from anon/authenticated
-- by the revoke above) without recursing through RLS. Used by policies below
-- and called from the app as supabase.rpc('is_admin').
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.users where id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- GUARD editor_profiles.is_hidden
-- This is an admin moderation flag. The row-level "owner can update their
-- own profile" policy still needs to exist so editors can edit their own
-- headline/rate/etc, so it can't be used to keep them from also flipping
-- is_hidden back off — RLS can't scope a policy to specific columns. A
-- trigger can: it silently ignores any change to is_hidden made by a
-- non-admin instead of touching the rest of the row.
-- ============================================================
create or replace function public.guard_editor_profiles_is_hidden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_hidden is distinct from old.is_hidden and not public.is_admin() then
    new.is_hidden := old.is_hidden;
  end if;
  return new;
end;
$$;

create trigger editor_profiles_guard_is_hidden
  before update on public.editor_profiles
  for each row execute function public.guard_editor_profiles_is_hidden();

-- ============================================================
-- RLS: admins can update/delete rows they don't own; nobody else can.
-- ============================================================

-- users
drop policy if exists "users can update their own row" on public.users;
create policy "owners and admins can update users"
  on public.users for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "admins can delete users"
  on public.users for delete using (public.is_admin());

-- editor_profiles
drop policy if exists "editors can update their own editor profile" on public.editor_profiles;
create policy "owners and admins can update editor profiles"
  on public.editor_profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "admins can delete editor profiles"
  on public.editor_profiles for delete using (public.is_admin());

-- portfolio_items (owner policy already covers all actions on own rows;
-- add the admin-on-others'-rows case for update/delete)
create policy "admins can update portfolio items"
  on public.portfolio_items for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete portfolio items"
  on public.portfolio_items for delete using (public.is_admin());

-- creator_profiles
drop policy if exists "creators can update their own creator profile" on public.creator_profiles;
create policy "owners and admins can update creator profiles"
  on public.creator_profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "admins can delete creator profiles"
  on public.creator_profiles for delete using (public.is_admin());

-- jobs
drop policy if exists "creators can update their own jobs" on public.jobs;
create policy "owners and admins can update jobs"
  on public.jobs for update
  using (auth.uid() = creator_id or public.is_admin())
  with check (auth.uid() = creator_id or public.is_admin());

create policy "admins can delete jobs"
  on public.jobs for delete using (public.is_admin());

-- applications
drop policy if exists "job owners can update application status" on public.applications;
create policy "job owners and admins can update applications"
  on public.applications for update
  using (
    public.is_admin()
    or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.creator_id = auth.uid())
  );

create policy "admins can delete applications"
  on public.applications for delete using (public.is_admin());

-- messages (no update policy exists — messages aren't editable by anyone;
-- admins can still remove one for moderation)
create policy "admins can delete messages"
  on public.messages for delete using (public.is_admin());
