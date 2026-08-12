'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { account } from '@/lib/appwrite/client'
import { useAuth } from '@/context/AuthContext'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUserState, setActiveRole, checkSession } = useAuth()

  useEffect(() => {
    async function handleAuthRedirect() {
      const userId = searchParams.get('userId')
      const secret = searchParams.get('secret')

      try {
        if (userId && secret) {
          await account.createSession({ userId, secret })
        }
        await checkSession()
        const userAccount = await account.get()
        if (userAccount) {
          setUserState(userAccount)

          // Check if user has already selected a role in preferences
          const savedRole = userAccount.prefs?.role
          if (savedRole) {
            setActiveRole(savedRole)
            localStorage.setItem('uperai_role', savedRole)
            window.location.href = '/'
          } else {
            // First time login -> Send to Role Selection Screen
            window.location.href = '/select-role'
          }
        } else {
          router.push('/?error=no_user')
        }
      } catch (err) {
        console.error('Callback error:', err)
        router.push('/select-role') // Fallback to role selection
      }
    }

    handleAuthRedirect()
  }, [router, searchParams, setActiveRole, setUserState, checkSession])

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-400">Setting up your profile...</p>
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
