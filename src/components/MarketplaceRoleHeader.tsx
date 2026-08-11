'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function MarketplaceRoleHeader() {
  const { activeRole } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center border-b border-zinc-800/60 text-xs">
      <p className="text-zinc-400">
        Viewing Marketplace as: <span className="text-lime-400 font-bold">{activeRole}</span>
      </p>

      {activeRole === 'CREATOR' ? (
        <span className="text-zinc-500 italic">
          Creators can browse all profiles and send briefs directly.
        </span>
      ) : (
        <Link className="font-bold text-lime-400 hover:underline transition-all" href="/onboarding">
          + List Your Work or Update Profile
        </Link>
      )}
    </div>
  )
}
