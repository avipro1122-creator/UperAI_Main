'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  useEffect(() => {
    if (!loading && user) {
      router.push(next)
    }
  }, [user, loading, router, next])

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <div className="subtle-panel p-8 rounded-2xl inner-border text-center space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Sign in to UperAI</h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Google sign-in only — no passwords to manage.
          </p>
        </div>

        <GoogleSignInButton next={next} />
      </div>
    </div>
  )
}
