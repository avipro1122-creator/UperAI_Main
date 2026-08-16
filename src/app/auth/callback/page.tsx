'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase/client'
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  getRedirectResult,
} from 'firebase/auth'

function AuthCallbackContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [statusMessage, setStatusMessage] = useState('Setting up your profile...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processAuthFlow() {
      try {
        // 1. Handle OAuth Redirect Result (Standard Mobile / Web OAuth)
        const redirectResult = await getRedirectResult(auth)
        if (redirectResult?.user) {
          router.push('/')
          return
        }

        // 2. Handle Passwordless Email Link Sign-in (FDL replacement / Universal Links)
        if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
          setStatusMessage('Verifying sign-in link...')
          let email = window.localStorage.getItem('emailForSignIn')
          if (!email) {
            email = window.prompt('Please provide your email for confirmation')
          }
          if (email) {
            await signInWithEmailLink(auth, email, window.location.href)
            window.localStorage.removeItem('emailForSignIn')
            router.push('/')
            return
          }
        }

        // 3. Standard session check fallback
        if (!loading) {
          if (user) {
            router.push('/')
          } else {
            router.push('/login')
          }
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error processing auth callback:', err)
        setError(err.message || 'Failed to complete authentication.')
      }
    }

    processAuthFlow()
  }, [user, loading, router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-lg">
            ✕
          </div>
          <h2 className="text-lg font-bold text-white">Authentication Error</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold rounded-xl transition-all"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-400">{statusMessage}</p>
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
