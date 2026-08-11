import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import SetupNotice from '@/components/SetupNotice'

export default async function AdminPage() {
  if (!isAppwriteConfigured()) return <SetupNotice />

  const { isAdmin } = await requireAdmin()
  if (!isAdmin) notFound()

  const admin = await createAdminClient()
  let profiles: any[] = []
  try {
    const fetched = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles
    )
    profiles = fetched.documents || []
  } catch {
    profiles = []
  }

  async function toggleHidden(formData: FormData) {
    'use server'
    const userId = String(formData.get('user_id') ?? '')
    const nextHidden = formData.get('next_hidden') === 'true'
    if (!userId) return

    const { isAdmin } = await requireAdmin()
    if (!isAdmin) return

    const adminClient = await createAdminClient()
    try {
      await adminClient.databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.editor_profiles,
        userId,
        { is_hidden: nextHidden }
      )
    } catch (err) {
      console.error('Toggle hidden error:', err)
    }
    revalidatePath('/admin')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Admin</h1>
        <p className="text-sm text-zinc-400 mt-2">
          {profiles.length} editor profile{profiles.length === 1 ? '' : 's'}.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="subtle-panel p-12 rounded-2xl text-center">
          <p className="text-sm text-zinc-400">No editor profiles yet.</p>
        </div>
      ) : (
        <div className="subtle-panel rounded-2xl divide-y divide-zinc-800 overflow-hidden">
          {profiles.map((p: any) => (
            <div key={p.$id || p.user_id} className="flex items-center gap-4 p-4">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.full_name || 'Editor'}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 shrink-0" />
              )}

              <div className="min-w-0 flex-1">
                <Link href={`/editors/${p.user_id || p.$id}`} className="text-sm font-semibold text-white hover:underline truncate block">
                  {p.full_name || 'Editor'}
                </Link>
                {p.headline && <p className="text-xs text-zinc-500 truncate">{p.headline}</p>}
              </div>

              {p.is_hidden && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                  Hidden
                </span>
              )}

              <form action={toggleHidden} className="shrink-0">
                <input type="hidden" name="user_id" value={p.$id || p.user_id} />
                <input type="hidden" name="next_hidden" value={(!p.is_hidden).toString()} />
                <button type="submit" className="btn-secondary text-xs px-3 py-1.5">
                  {p.is_hidden ? 'Unhide' : 'Hide'}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
