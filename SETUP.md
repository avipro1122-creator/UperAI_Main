# Setup — get Phase 1 running

Code is done; these are the accounts/config only you can create.

## 1. Supabase project

1. Create a project at https://supabase.com/dashboard.
2. In the SQL editor, run the migrations in order (paste each whole file and run it once):
   - `supabase/migrations/20260806000000_initial_schema.sql`
   - `supabase/migrations/20260807000000_admin_role.sql`
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this one server-only — never commit it or expose it to the browser)
4. Copy `.env.example` to `.env.local` and fill those in, plus `ADMIN_EMAILS` (comma-separated — whichever of your own emails should get the admin role on next login).

## 2. Google OAuth client (for Google sign-in)

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a project, then **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized redirect URIs** — add the callback URL Supabase gives you. It's shown on the Google provider setup screen in the next step, and looks like:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Save, then copy the generated **Client ID** and **Client Secret**.

## 3. Enable Google in Supabase Auth

1. In the Supabase dashboard: **Authentication → Providers → Google** → toggle it on.
2. Paste the Client ID and Client Secret from step 2. Save.
3. Under **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` for local dev (change to your production URL after deploying)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and later your production `.../auth/callback`)

## 4. Run it

```
npm install
npm run dev
```

Visit `http://localhost:3000`, click **List your work**, sign in with Google, pick **editor**, and add your own 3–6 videos as the first real profile — per the build spec, do this before showing it to anyone else.

## 5. Deploy (when ready)

Push to Vercel, set the env vars from `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`) in the Vercel project settings, then update Supabase's **Site URL** / **Redirect URLs** (Authentication → URL Configuration) to your production domain, e.g.:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/auth/callback` (keep the `localhost:3000` one too if you still test locally)

Without this step, Google sign-in works locally but fails (or redirects to the wrong domain) in production.
