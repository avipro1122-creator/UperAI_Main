'use client'

import { useState } from 'react'
import { Clapperboard, Tv2, Loader2, AlertCircle } from 'lucide-react'

interface RoleSelectionCardsProps {
  initialRole?: string | null
}

export default function RoleSelectionCards({ initialRole }: RoleSelectionCardsProps) {
  const [loadingRole, setLoadingRole] = useState<'editor' | 'creator' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSelectRole = async (targetRole: 'editor' | 'creator') => {
    if (loadingRole) return
    setErrorMsg(null)
    setLoadingRole(targetRole)

    // 8-second safety fallback timeout so the UI NEVER spins indefinitely
    const safetyTimeoutId = setTimeout(() => {
      setLoadingRole(null)
      setErrorMsg('Navigation took too long to complete. Please click again to retry.')
    }, 8000)

    try {
      const controller = new AbortController()
      const fetchTimeoutId = setTimeout(() => controller.abort(), 6000)

      const res = await fetch('/api/switch-role', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
        signal: controller.signal,
      })
      clearTimeout(fetchTimeoutId)

      const rawText = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(rawText)
      } catch {
        clearTimeout(safetyTimeoutId)
        setLoadingRole(null)
        throw new Error('Server returned an invalid response format. Please try again.')
      }

      if (!res.ok) {
        clearTimeout(safetyTimeoutId)
        setLoadingRole(null)
        throw new Error(data.error || `Server returned error status ${res.status}. Please try again.`)
      }

      // Hard navigation ensures fresh session and clears server component cache.
      const destination = data.redirect || (targetRole === 'editor' ? '/onboarding/editor' : '/editors')
      window.location.href = destination
    } catch (err: any) {
      clearTimeout(safetyTimeoutId)
      setLoadingRole(null)
      if (err.name === 'AbortError') {
        setErrorMsg('Network request timed out. Please check your connection and try again.')
      } else {
        setErrorMsg(err.message || 'An error occurred while setting your role. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Editor Card */}
        <button
          type="button"
          onClick={() => handleSelectRole('editor')}
          disabled={!!loadingRole}
          className={`subtle-card group w-full p-6 rounded-2xl text-left space-y-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 cursor-pointer ${
            loadingRole === 'editor'
              ? 'border-violet-500 bg-violet-950/20 opacity-90'
              : loadingRole === 'creator'
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              {loadingRole === 'editor' ? (
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              ) : (
                <Clapperboard className="w-5 h-5 text-violet-400" />
              )}
            </div>
            {loadingRole === 'editor' && (
              <span className="text-[11px] font-semibold text-violet-400 animate-pulse">
                Setting up...
              </span>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-white text-base">I&apos;m an editor</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Show real work, set your rate, get found by creators.
            </p>
          </div>
        </button>

        {/* Creator Card */}
        <button
          type="button"
          onClick={() => handleSelectRole('creator')}
          disabled={!!loadingRole}
          className={`subtle-card group w-full p-6 rounded-2xl text-left space-y-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 cursor-pointer ${
            loadingRole === 'creator'
              ? 'border-sky-500 bg-sky-950/20 opacity-90'
              : loadingRole === 'editor'
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              {loadingRole === 'creator' ? (
                <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
              ) : (
                <Tv2 className="w-5 h-5 text-sky-400" />
              )}
            </div>
            {loadingRole === 'creator' && (
              <span className="text-[11px] font-semibold text-sky-400 animate-pulse">
                Setting up...
              </span>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-white text-base">I&apos;m a creator / client</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Find an editor who&apos;s actually good, and see what they charge.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
