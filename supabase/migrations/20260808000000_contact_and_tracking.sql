-- UperAI — Contact fields, separate rates, contact click tracking
-- Adds the missing columns needed for the end-to-end editor and creator flows.

-- ============================================================
-- CONTACT FIELDS ON EDITOR PROFILES
-- At least one of whatsapp/instagram must be present (enforced in
-- application code on submit, not as a DB constraint, so admins
-- can still create profiles manually without it).
-- ============================================================
alter table public.editor_profiles
  add column whatsapp text,
  add column instagram_handle text;

-- ============================================================
-- SEPARATE RATES (long-form vs shorts)
-- The old min_rate/max_rate range is kept so the browse page
-- filters still work. rate_long and rate_short are the canonical
-- per-video rates shown on the profile and cards.
-- ============================================================
alter table public.editor_profiles
  add column rate_long numeric(10, 2),
  add column rate_short numeric(10, 2);

-- ============================================================
-- BIO + CITY already exist on public.users — nothing to add.
-- ============================================================

-- ============================================================
-- CONTACT CLICKS
-- Fire-and-forget tracking: one row per click, no user id stored.
-- editor_id + timestamp is the only data we collect.
-- ============================================================
create table public.contact_clicks (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.users(id) on delete cascade,
  clicked_at timestamptz not null default now()
);

create index idx_contact_clicks_editor_id on public.contact_clicks(editor_id, clicked_at desc);

alter table public.contact_clicks enable row level security;

-- Anyone (including anon) can insert a click — no login wall on Contact.
create policy "anyone can log a contact click"
  on public.contact_clicks for insert
  with check (true);

-- Only admins can read the aggregate (editors can't see their own click
-- counts via the public API — add a specific policy later if needed).
create policy "admins can read contact clicks"
  on public.contact_clicks for select
  using (public.is_admin());
