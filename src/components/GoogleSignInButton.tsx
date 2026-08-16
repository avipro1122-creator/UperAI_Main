'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function GoogleSignInButton({
  label = 'Continue with Google',
  next,
}: {
  label?: string
  next?: string
}) {
  const { loginWithGoogle } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await loginWithGoogle()
      if (next) {
        router.push(next)
      } else {
        router.push('/select-role')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="btn-primary text-sm px-6 py-3 flex items-center justify-center gap-2.5 w-full disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.19 3.56-8.84z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.04 1.15-3.1 0-5.73-2.09-6.67-4.9H1.32v3.11C3.29 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.33 14.33A7.19 7.19 0 0 1 4.96 12c0-.81.14-1.6.37-2.33V6.56H1.32A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.32 5.44l4.01-3.11z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.56l4.01 3.11C6.27 6.86 8.9 4.77 12 4.77z"
          />
        </svg>
        {loading ? 'Signing in…' : label}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
