'use client'

import { useEffect } from 'react'
import { account } from '@/lib/appwrite/client'
import { useAuth } from '@/context/AuthContext'

export default function AuthCallbackPage() {
  const { setUserState, checkSession } = useAuth()

  useEffect(() => {
    async function completeAuthentication() {
      try {
        const userAccount = await account.get()
        if (userAccount) {
          setUserState(userAccount)
        }
        await checkSession()
      } catch (err) {
        console.warn('OAuth callback session verification:', err)
      } finally {
        window.location.href = '/'
      }
    }

    completeAuthentication()
  }, [setUserState, checkSession])

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-400">Completing sign-in and redirecting...</p>
      </div>
    </div>
  )
}
