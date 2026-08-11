# UperAI — Build Spec (v1)

A platform where YouTube/Instagram creators and video editors find each other, see real work, and agree on a rate — instead of doing it in Instagram DMs.

Build in the phase order given. Do not build later phases early.

## Core principle
The product's job is to answer two questions faster than a DM can:
- Creator: "Is this editor actually good, and what will they charge?"
- Editor: "Is this creator real, and will they pay?"
Everything that doesn't answer one of those is cut from v1.

## Stack
- Next.js (App Router)
- Supabase (Postgres + Auth + Storage)
- Tailwind
- Deploy on Vercel
- Auth: Google sign-in only for v1. No password flows.

## Data model
users: id, role ('creator'|'editor'), name, handle, avatar_url, bio, city, created_at
editor_profiles: user_id, headline, software (text[]), turnaround_days, min_rate, max_rate, currency, open_to_work (bool)
portfolio_items: id, editor_id, youtube_url, video_id, title, role_description, duration_seconds, position (int)
creator_profiles: user_id, channel_url, subscriber_count, niche, avg_video_length
jobs: id, creator_id, title, description, format ('long'|'shorts'|'both'), budget_min, budget_max, currency, deadline_days, status ('open'|'closed'), created_at
applications: id, job_id, editor_id, message, quoted_rate, status ('sent'|'shortlisted'|'declined'|'hired'), created_at
messages: id, application_id, sender_id, body, created_at

(The initial migration in `supabase/migrations/` creates all of these tables now, plus a `users.last_active_at` column not in the list above — added to support the Phase 1 "recently active" sort, since no other column could drive it. Phase 2/3 tables exist in the schema but have no UI yet.)

## PHASE 1 — Editor profiles with playable work  (STATUS: built)
This is the whole product if nothing else ships.

Editor onboarding:
1. Sign in with Google
2. Pick role: editor
3. Add 3–6 YouTube URLs of work they edited
4. For each: one line on what they actually did
5. Set rate range, software, turnaround

YouTube handling — parse the video ID from watch/youtu.be/shorts/embed URLs, fetch title+thumbnail via the free oEmbed endpoint, show a thumbnail grid (not raw iframes), click-to-play swaps to a youtube-nocookie.com iframe (one at a time), shorts render 9:16 / long-form 16:9, failed oEmbed shows "unavailable".

Browse editors page — filter by format/software/rate/turnaround, sort by recently active, card shows name/headline/rate range/3 thumbnails. No fake ratings or badges.

**Not yet done, per the Build loop below:** put a real editor profile in first, then watch 2 real people use it before touching Phase 2.

## PHASE 2 — Jobs and applications  (STATUS: not started)
Creator posts a job (niche+channel, format, videos/month, REQUIRED budget range, deadline, description). Editor applies with message + quoted rate (portfolio auto-attaches, no re-upload), capped at 10 open applications per editor. Creator's inbox lists applicants with quoted rate visible, shortlist/decline, shortlisting opens a message thread.

## PHASE 3 — Messaging  (STATUS: not started)
Threaded messages scoped to an application, Supabase realtime, one email notification on first message only, no file transfer.

## Explicitly NOT in v1
Escrow/payments/invoices/commissions, ratings & reviews, contracts, AI matching, mobile app.

## Copy rules
No invented statistics. Real small numbers shown small ("14 editors listed"). Empty states are invitations ("No jobs open right now — post the first one"). Buttons say what happens ("Post job", "Send application", "Shortlist").

## Build loop
For each phase: build it → put your own editing work in as the first profile → get 2 real people to use it while you watch, without helping them → fix only what made them stuck → next phase.

**Do not start Phase 2 until 5 real editor profiles exist with real videos.**
