import { redirect } from 'next/navigation'
import { createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import SwitchRoleButton from '@/components/SwitchRoleButton'
import { Query } from 'node-appwrite'

export const metadata = {
  title: 'Switch role — UperAI',
}

export default async function SwitchRolePage() {
  if (!isAppwriteConfigured()) redirect('/login')

  let currentRole: string | null = null

  try {
    const { account, databases } = await createSessionClient()
    const user = await account.get()

    if (!user) redirect('/login')

    const userDocs = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [Query.equal('$id', user.$id)]
    )
    const profile = userDocs.documents[0]
    currentRole = profile?.role ?? null
  } catch {
    redirect('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Switch your role
        </h1>
        <p className="text-sm text-zinc-400 mt-2.5">
          You can change this later in settings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Editor card */}
        <div className="relative">
          {currentRole === 'editor' && (
            <div className="absolute -top-2 left-3 z-10">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Current
              </span>
            </div>
          )}
          <SwitchRoleButton
            targetRole="editor"
            isCurrent={currentRole === 'editor'}
            icon="editor"
          />
        </div>

        {/* Creator card */}
        <div className="relative">
          {currentRole === 'creator' && (
            <div className="absolute -top-2 left-3 z-10">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Current
              </span>
            </div>
          )}
          <SwitchRoleButton
            targetRole="creator"
            isCurrent={currentRole === 'creator'}
            icon="creator"
          />
        </div>
      </div>

      {currentRole === 'editor' && (
        <p className="text-xs text-zinc-500 text-center mt-6 leading-relaxed">
          Switching to Creator will hide your editor profile. It will be restored if you switch back.
        </p>
      )}
    </div>
  )
}
