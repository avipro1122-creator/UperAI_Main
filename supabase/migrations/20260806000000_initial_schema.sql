-- UperAI v1 — Initial schema
-- Matches the data model in the build spec. All phases' tables are created
-- now (so we don't re-migrate later), but RLS only allows what each phase
-- actually needs — no business logic for unbuilt phases (e.g. the 10-open-
-- application cap from Phase 2 is enforced in application code, not here).

-- ============================================================
-- USERS
-- (extends auth.users; row is created automatically on sign-in)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('creator', 'editor')), -- null until onboarding sets it
  name text not null default '',
  handle text unique not null,
  avatar_url text,
  bio text,
  city text,
  last_active_at timestamptz not null default now(), -- not in spec's literal column list;
    -- added because Phase 1's "Browse editors" page requires a "recently active" sort
    -- and there's no other column that could drive it.
  created_at timestamptz not null default now()
);

create index idx_users_role on public.users(role);
create index idx_users_last_active_at on public.users(last_active_at desc);

-- ============================================================
-- EDITOR PROFILES
-- ============================================================
create table public.editor_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  headline text,
  software text[] not null default '{}',
  turnaround_days int,
  min_rate numeric(10, 2),
  max_rate numeric(10, 2),
  currency text not null default 'USD',
  open_to_work boolean not null default true
);

-- ============================================================
-- PORTFOLIO ITEMS
-- ============================================================
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.users(id) on delete cascade,
  youtube_url text not null,
  video_id text not null,
  title text,
  role_description text not null,
  duration_seconds int,
  position int not null default 0,
  -- Cached at add-time from the oEmbed fetch, so the profile/browse pages
  -- render a static grid without re-hitting YouTube on every page view.
  thumbnail_url text,
  is_short boolean not null default false,
  is_available boolean not null default true, -- false when oEmbed failed (private/deleted)
  created_at timestamptz not null default now()
);

create index idx_portfolio_items_editor_id on public.portfolio_items(editor_id, position);

-- ============================================================
-- CREATOR PROFILES
-- ============================================================
create table public.creator_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  channel_url text,
  subscriber_count int,
  niche text,
  avg_video_length int
);

-- ============================================================
-- JOBS (Phase 2)
-- ============================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  format text not null check (format in ('long', 'shorts', 'both')),
  budget_min numeric(10, 2) not null,
  budget_max numeric(10, 2) not null,
  currency text not null default 'USD',
  deadline_days int,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index idx_jobs_creator_id on public.jobs(creator_id);
create index idx_jobs_status on public.jobs(status, created_at desc);

-- ============================================================
-- APPLICATIONS (Phase 2)
-- ============================================================
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  editor_id uuid not null references public.users(id) on delete cascade,
  message text,
  quoted_rate numeric(10, 2),
  status text not null default 'sent' check (status in ('sent', 'shortlisted', 'declined', 'hired')),
  created_at timestamptz not null default now(),
  unique (job_id, editor_id)
);

create index idx_applications_job_id on public.applications(job_id);
create index idx_applications_editor_id on public.applications(editor_id);

-- ============================================================
-- MESSAGES (Phase 3)
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_application_id on public.messages(application_id, created_at);

-- ============================================================
-- AUTO-CREATE public.users ROW ON SIGN-IN
-- Role starts null; onboarding sets it. Handle is auto-generated
-- (slug of name + short id suffix) so sign-in never blocks on a
-- uniqueness collision; users can change it later.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_name text;
  clean_slug text;
begin
  base_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'editor'
  );

  clean_slug := trim(both '-' from lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g')));

  if clean_slug = '' or clean_slug is null then
    clean_slug := 'editor';
  end if;

  insert into public.users (id, name, handle, avatar_url)
  values (
    new.id,
    base_name,
    clean_slug || '-' || substr(new.id::text, 1, 6),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.editor_profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;

-- users: public profile info, self-managed
create policy "users are publicly viewable"
  on public.users for select using (true);

create policy "users can update their own row"
  on public.users for update using (auth.uid() = id);

-- editor_profiles: public read, editor manages their own
create policy "editor profiles are publicly viewable"
  on public.editor_profiles for select using (true);

create policy "editors can insert their own editor profile"
  on public.editor_profiles for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.users where id = auth.uid() and role = 'editor')
  );

create policy "editors can update their own editor profile"
  on public.editor_profiles for update using (auth.uid() = user_id);

-- portfolio_items: public read, owner manages
create policy "portfolio items are publicly viewable"
  on public.portfolio_items for select using (true);

create policy "editors can manage their own portfolio items"
  on public.portfolio_items for all
  using (auth.uid() = editor_id)
  with check (auth.uid() = editor_id);

-- creator_profiles: public read, owner manages
create policy "creator profiles are publicly viewable"
  on public.creator_profiles for select using (true);

create policy "creators can insert their own creator profile"
  on public.creator_profiles for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.users where id = auth.uid() and role = 'creator')
  );

create policy "creators can update their own creator profile"
  on public.creator_profiles for update using (auth.uid() = user_id);

-- jobs: open jobs public, owner sees/manages all their own
create policy "open jobs are publicly viewable"
  on public.jobs for select using (status = 'open' or creator_id = auth.uid());

create policy "creators can insert their own jobs"
  on public.jobs for insert
  with check (
    auth.uid() = creator_id
    and exists (select 1 from public.users where id = auth.uid() and role = 'creator')
  );

create policy "creators can update their own jobs"
  on public.jobs for update using (auth.uid() = creator_id);

-- applications: visible to the applying editor and the job's creator
create policy "applicants and job owners can view applications"
  on public.applications for select
  using (
    auth.uid() = editor_id
    or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.creator_id = auth.uid())
  );

create policy "editors can submit applications"
  on public.applications for insert
  with check (
    auth.uid() = editor_id
    and exists (select 1 from public.users where id = auth.uid() and role = 'editor')
  );

create policy "job owners can update application status"
  on public.applications for update
  using (exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.creator_id = auth.uid()));

-- messages: visible to the two participants of the parent application
create policy "application participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = messages.application_id
        and (
          applications.editor_id = auth.uid()
          or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.creator_id = auth.uid())
        )
    )
  );

create policy "application participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.applications
      where applications.id = messages.application_id
        and (
          applications.editor_id = auth.uid()
          or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.creator_id = auth.uid())
        )
    )
  );
