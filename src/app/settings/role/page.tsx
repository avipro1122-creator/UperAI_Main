'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import SwitchRoleButton from '@/components/SwitchRoleButton'

export default function SwitchRolePage() {
  const { activeRole } = useAuth()
  const currentRole = activeRole?.toLowerCase() || 'creator'

  return (
    <div className="max-w-lg mx-auto px-4 py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Switch your role
        </h1>
        <p className="text-sm text-zinc-400 mt-2.5">
          You can change this later in settings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Editor card */}
        <div className="relative">
          {currentRole === 'editor' && (
            <div className="absolute -top-2 left-3 z-10">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Current
              </span>
            </div>
          )}
          <SwitchRoleButton
            targetRole="editor"
            isCurrent={currentRole === 'editor'}
            icon="editor"
          />
        </div>

        {/* Creator card */}
        <div className="relative">
          {currentRole === 'creator' && (
            <div className="absolute -top-2 left-3 z-10">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Current
              </span>
            </div>
          )}
          <SwitchRoleButton
            targetRole="creator"
            isCurrent={currentRole === 'creator'}
            icon="creator"
          />
        </div>
      </div>

      {currentRole === 'editor' && (
        <p className="text-xs text-zinc-500 text-center mt-6 leading-relaxed">
          Switching to Creator will hide your editor profile. It will be restored if you switch back.
        </p>
      )}
    </div>
  )
}
