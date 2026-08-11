import { redirect } from 'next/navigation'
import { createSessionClient, createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import EditorOnboardingForm from '@/components/EditorOnboardingForm'
import { Query } from 'node-appwrite'

export default async function EditorOnboardingPage() {
  if (!isAppwriteConfigured()) redirect('/login')

  let user: any = null
  let profileDoc: any = null
  let editorProfileDoc: any = null

  try {
    const { account, databases } = await createSessionClient()
    user = await account.get()
    if (!user) redirect('/login')

    const userDocs = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [Query.equal('$id', user.$id)]
    )
    profileDoc = userDocs.documents[0]

    const admin = await createAdminClient()
    const epDocs = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      [Query.equal('user_id', user.$id)]
    )
    editorProfileDoc = epDocs.documents[0]
  } catch {
    redirect('/login')
  }

  const existing = editorProfileDoc
    ? {
        name: profileDoc?.name ?? user.name ?? undefined,
        bio: profileDoc?.bio ?? undefined,
        city: profileDoc?.city ?? undefined,
        headline: editorProfileDoc.headline ?? undefined,
        rateLong: editorProfileDoc.rate_long != null ? String(editorProfileDoc.rate_long) : undefined,
        rateShort: editorProfileDoc.rate_short != null ? String(editorProfileDoc.rate_short) : undefined,
        currency: editorProfileDoc.currency ?? 'INR',
        turnaroundDays: editorProfileDoc.turnaround_days != null ? String(editorProfileDoc.turnaround_days) : undefined,
        whatsapp: editorProfileDoc.whatsapp ?? undefined,
        instagramHandle: editorProfileDoc.instagram_handle ?? undefined,
      }
    : {
        name: profileDoc?.name ?? user.name ?? undefined,
      }

  const isEditing = Boolean(editorProfileDoc?.headline)

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          {isEditing ? 'Edit your profile' : 'Build your profile'}
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          {isEditing
            ? 'Changes go live immediately.'
            : "3–6 videos you actually edited, what you did on each, and your rate. That's it."}
        </p>
      </div>
      <EditorOnboardingForm existing={existing} />
    </div>
  )
}
