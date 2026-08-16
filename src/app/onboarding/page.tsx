'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import RoleSelectionCards from '@/components/RoleSelectionCards'

export default function OnboardingPage() {
  const { activeRole } = useAuth()

  return (
    <div className="max-w-lg mx-auto px-4 py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          What brings you here?
        </h1>
        <p className="text-sm text-zinc-400 mt-2.5">
          You can change this later in settings.
        </p>
      </div>

      <RoleSelectionCards initialRole={activeRole?.toLowerCase()} />
    </div>
  )
}
