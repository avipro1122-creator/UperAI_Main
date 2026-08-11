import { redirect } from 'next/navigation'
import { createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured } from '@/lib/appwrite/config'
import { safeRedirectPath } from '@/lib/safe-redirect'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import SetupNotice from '@/components/SetupNotice'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; message?: string; type?: string }
}) {
  if (!isAppwriteConfigured()) return <SetupNotice />

  const next = safeRedirectPath(searchParams.next)

  try {
    const { account } = await createSessionClient()
    const user = await account.get()

    if (user) {
      redirect(next ?? '/')
    }
  } catch {
    // User is not authenticated
  }

  const isProviderDisabled = searchParams.error?.includes('provider_disabled') || searchParams.error?.includes('412')

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <div className="subtle-panel p-8 rounded-2xl inner-border text-center space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Sign in to UperAI</h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Google sign-in only — no passwords to manage.
          </p>
        </div>

        {searchParams.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left space-y-1">
            <p className="text-xs font-semibold text-red-400">
              {isProviderDisabled
                ? 'Google OAuth Provider is disabled in your Appwrite Console.'
                : 'Authentication failed. Please check your Appwrite & Google OAuth credentials.'}
            </p>
            {(searchParams.error || searchParams.message) && (
              <p className="text-[11px] font-mono text-zinc-400 break-all">
                Details: {searchParams.error} {searchParams.message ? `- ${searchParams.message}` : ''}
              </p>
            )}
          </div>
        )}

        <GoogleSignInButton next={next ?? undefined} />
      </div>
    </div>
  )
}
