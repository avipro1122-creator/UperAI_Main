// Whether real Supabase credentials are present. Used everywhere that would
// otherwise call createClient() + hit the network — without this guard, a
// deploy with no env vars set crashes middleware (and every page) instead
// of degrading gracefully.
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
