'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clapperboard, Tv2, Loader2 } from 'lucide-react'

interface SwitchRoleButtonProps {
  targetRole: 'editor' | 'creator'
  isCurrent: boolean
  /** Visual icon variant */
  icon: 'editor' | 'creator'
}

export default function SwitchRoleButton({ targetRole, isCurrent, icon }: SwitchRoleButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSwitch() {
    if (isCurrent || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/switch-role', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }
      // Hard-navigate so the server layout re-fetches the new role
      router.push(data.redirect)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const isEditor = icon === 'editor'
  const label = isEditor ? "I'm an editor" : "I'm a creator"
  const description = isEditor
    ? 'Show real work, set your rate, get found by creators.'
    : "Find an editor who's actually good, and see what they charge."

  const iconBg = isEditor
    ? 'bg-violet-500/15 border-violet-500/25'
    : 'bg-sky-500/15 border-sky-500/25'
  const iconColor = isEditor ? 'text-violet-400' : 'text-sky-400'

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isCurrent || loading}
      aria-disabled={isCurrent}
      className={[
        'subtle-card w-full p-6 rounded-2xl text-left space-y-3 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
        isCurrent
          ? 'opacity-50 cursor-default'
          : 'hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 cursor-pointer',
      ].join(' ')}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg}`}>
        {loading ? (
          <Loader2 className={`w-5 h-5 animate-spin ${iconColor}`} />
        ) : isEditor ? (
          <Clapperboard className={`w-5 h-5 ${iconColor}`} />
        ) : (
          <Tv2 className={`w-5 h-5 ${iconColor}`} />
        )}
      </div>
      <div>
        <p className="font-display font-bold text-white text-base">{label}</p>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
      {error && <p className="text-xs text-red-400 pt-1">{error}</p>}
    </button>
  )
}
