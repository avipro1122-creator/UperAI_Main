'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/client'
import { doc, setDoc } from 'firebase/firestore'

export default function SelectRolePage() {
  const router = useRouter()
  const { user, setActiveRole } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSelectRole = async (selectedRole: 'CREATOR' | 'EDITOR') => {
    setLoading(true)
    try {
      if (user) {
        const uid = user.uid || user.$id
        if (uid) {
          await setDoc(
            doc(db, 'users', uid),
            {
              uid,
              email: user.email || '',
              displayName: user.displayName || user.name || '',
              role: selectedRole,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          )
        }
      }

      setActiveRole(selectedRole)
      localStorage.setItem('uperai_role', selectedRole)

      if (selectedRole === 'EDITOR') {
        router.push('/profile')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Failed to set role preference:', err)
      setActiveRole(selectedRole)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-md">
        <span className="text-xs font-bold text-lime-400 bg-lime-950/80 border border-lime-800/50 px-3 py-1 rounded-full uppercase tracking-wider">
          WELCOME TO UPERAI
        </span>
        <h1 className="text-3xl sm:text-4xl font-black">How will you use UperAI?</h1>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Select your primary goal. You can easily switch modes later from your profile menu.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Creator Card */}
        <button
          disabled={loading}
          onClick={() => handleSelectRole('CREATOR')}
          className="group relative bg-zinc-900 border-2 border-zinc-800 hover:border-lime-400 rounded-3xl p-6 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-6 focus:outline-none"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-lime-950/80 border border-lime-800/50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-lime-400 group-hover:text-black transition-colors">
              🎬
            </div>
            <h2 className="text-xl font-black text-white group-hover:text-lime-400 transition-colors">
              I am a Creator
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Browse top Indian video editors, compare upfront rates in INR, view showreels, and hire directly.
            </p>
          </div>

          <div className="pt-2 flex items-center text-xs font-bold text-lime-400 group-hover:translate-x-1 transition-transform">
            Continue as Creator →
          </div>
        </button>

        {/* Editor Card */}
        <button
          disabled={loading}
          onClick={() => handleSelectRole('EDITOR')}
          className="group relative bg-zinc-900 border-2 border-zinc-800 hover:border-lime-400 rounded-3xl p-6 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-6 focus:outline-none"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-lime-950/80 border border-lime-800/50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-lime-400 group-hover:text-black transition-colors">
              ✂️
            </div>
            <h2 className="text-xl font-black text-white group-hover:text-lime-400 transition-colors">
              I am an Editor
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              List your portfolio, display upfront pricing, feature YouTube work, and get client inquiries directly.
            </p>
          </div>

          <div className="pt-2 flex items-center text-xs font-bold text-lime-400 group-hover:translate-x-1 transition-transform">
            Continue as Editor →
          </div>
        </button>
      </div>
    </div>
  )
}
