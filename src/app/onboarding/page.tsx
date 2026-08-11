import { redirect } from 'next/navigation'
import { createSessionClient, createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import RoleSelectionCards from '@/components/RoleSelectionCards'
import { Query } from 'node-appwrite'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { loop?: string }
}) {
  if (!isAppwriteConfigured()) redirect('/login')

  let user: any = null
  let profile: any = null

  try {
    const { account, databases } = await createSessionClient()
    user = await account.get()
    if (!user) redirect('/login')

    const userDocs = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [Query.equal('$id', user.$id)]
    )
    profile = userDocs.documents[0]
  } catch {
    redirect('/login')
  }

  if (!searchParams?.loop && profile) {
    if (profile.role === 'creator') redirect('/editors')
    if (profile.role === 'editor') {
      const admin = await createAdminClient()
      const itemsRes = await admin.databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.portfolio_items,
        [Query.equal('editor_id', user.$id)]
      )

      if (itemsRes.documents.length > 0) {
        redirect(`/editors/${profile.handle || user.$id}`)
      } else {
        redirect('/onboarding/editor')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          What brings you here?
        </h1>
        <p className="text-sm text-zinc-400 mt-2.5">
          You can change this later in settings.
        </p>
      </div>

      <RoleSelectionCards initialRole={profile?.role} />
    </div>
  )
}
