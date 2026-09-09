'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isAdminEmail } from '@/lib/flags'

interface UserMenuProps {
  name: string
  email: string
  handle: string
  avatarUrl: string | null
  role: string | null
  isAdmin: boolean
}

export default function UserMenu({ name, email, handle, avatarUrl, role, isAdmin }: UserMenuProps) {
  const isUserAdmin = Boolean(isAdmin || isAdminEmail(email))
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { logout } = useAuth()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Esc
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const [switching, setSwitching] = useState(false)
  async function handleSwitchRole() {
    if (switching) return
    const targetRole = role === 'editor' ? 'creator' : 'editor'
    setSwitching(true)
    try {
      const res = await fetch('/api/switch-role', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      })
      const data = await res.json()
      if (res.ok && data.redirect) {
        setOpen(false)
        router.push(data.redirect)
        router.refresh()
      }
    } finally {
      setSwitching(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Fallback to route handler
      window.location.href = '/api/signout'
    }
  }

  const profileHref = role === 'editor' ? `/editors/${handle}` : '/onboarding/editor'

  const showAvatar = avatarUrl && !imgError

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-zinc-700 hover:border-zinc-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-[13px] font-semibold text-zinc-200 bg-zinc-800 w-full h-full flex items-center justify-center">
            {name?.[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/40 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Identity */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white truncate">{name}</p>
              {isUserAdmin && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center w-full px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              My profile
            </Link>

            {isUserAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center w-full px-4 py-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors font-semibold"
              >
                ⚡ Admin Dashboard
              </Link>
            )}
          </div>

          {/* Switch role */}
          {role && (
            <div className="border-t border-zinc-800 py-1">
              <button
                onClick={handleSwitchRole}
                disabled={switching}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
              >
                {switching ? (
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                ) : (
                  <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                )}
                Switch to {role === 'editor' ? 'Creator' : 'Editor'}
              </button>
              {role === 'editor' && (
                <p className="px-4 pb-1 text-[11px] text-zinc-600 leading-relaxed">
                  Your editor profile will be hidden.
                </p>
              )}
            </div>
          )}

          {/* Sign out */}
          <div className="border-t border-zinc-800 py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors text-left"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
