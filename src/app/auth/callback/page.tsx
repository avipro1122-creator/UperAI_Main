'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { account } from '@/lib/appwrite/client'
import { useAuth } from '@/context/AuthContext'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { checkSession } = useAuth()

  useEffect(() => {
    async function completeAuthentication() {
      const userId = searchParams.get('userId')
      const secret = searchParams.get('secret')

      if (!userId || !secret) {
        console.error('[OAuth Callback] Missing userId or secret in URL query parameters.')
        router.push('/login?error=missing_oauth_params')
        return
      }

      try {
        console.log('[OAuth Callback] Converting OAuth token to session for userId:', userId)
        const session = await account.createSession({ userId, secret })
        console.log('[OAuth Callback] Session created successfully:', session)
        await checkSession()
        window.location.href = '/'
      } catch (err: any) {
        console.error('[OAuth Callback] Error creating session from OAuth token:', err)
        router.push('/login?error=session_creation_failed')
      }
    }

    completeAuthentication()
  }, [searchParams, router, checkSession])

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-400">Completing sign-in and redirecting...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-zinc-400">Loading authentication...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
