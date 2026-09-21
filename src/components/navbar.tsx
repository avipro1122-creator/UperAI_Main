'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { LogoMark } from '@/components/Logo'
import LoginModal from '@/components/LoginModal'
import { isAdminEmail } from '@/lib/flags'

export default function Navbar() {
  const { user, loading, activeRole, setActiveRole, loginWithGoogle, logout } = useAuth()
  const isUserAdmin = isAdminEmail(user?.email)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isDropdownOpen])

  // Derive dynamic user avatar with initials fallback
  const userAvatar =
    user?.photoURL ||
    (user as any)?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || user?.name || user?.email || 'User')}`

  const toggleRole = () => {
    const nextRole = activeRole === 'CREATOR' ? 'EDITOR' : 'CREATOR'
    setActiveRole(nextRole)
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-zinc-950/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between text-zinc-100 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_-1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300">
      {/* Brand Logo */}
      <Link
        className="group text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2.5 font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 rounded-xl"
        href="/"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-lime-400/20 blur-md rounded-full group-hover:bg-lime-400/35 transition-colors duration-300" />
          <LogoMark className="relative w-8 h-8 transition-transform duration-300 group-hover:scale-105" />
        </div>
        <span className="tracking-tight text-white group-hover:text-lime-300 transition-colors duration-200">UPERAI</span>
      </Link>

      {/* DESKTOP RIGHT CONTROLS */}
      <div className="hidden md:flex items-center gap-3.5">
        {/* Persistent sticky CTA — always visible, adapts to active role */}
        <Link
          href={activeRole === 'EDITOR' ? '/profile' : '/editors'}
          className="relative inline-flex items-center justify-center px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 text-xs font-black tracking-wide rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(163,230,53,0.25)] hover:shadow-[0_0_25px_rgba(163,230,53,0.45)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {activeRole === 'EDITOR' ? '+ List your work' : 'Browse Editors'}
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        ) : !user ? (
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
                ;(window as any).google.accounts.id.prompt()
              }
              setIsLoginModalOpen(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-zinc-200 hover:text-white transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Log in
          </button>
        ) : (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-lime-400/90 ring-offset-2 ring-offset-zinc-950 focus:outline-none focus-visible:ring-lime-300 transition-all duration-200 hover:scale-105 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
            >
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatar}
                  alt={user.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-[13px] font-bold text-zinc-950 bg-lime-400 w-full h-full flex items-center justify-center">
                  {(user.name || user.email)?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-60 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)] p-3 z-50 space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white truncate text-xs">{user.name || user.email?.split('@')[0] || 'User'}</p>
                    {isUserAdmin && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                        Admin
                      </span>
                    )}
                  </div>
                  {user.email && <p className="text-zinc-400 text-[10px] truncate mt-0.5">{user.email}</p>}
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-lime-400/10 text-lime-400 font-extrabold rounded-md text-[10px] border border-lime-400/25 tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    Active: {activeRole}
                  </span>
                </div>

                <div className="space-y-1">
                  {/* Admin Dashboard Link */}
                  {isUserAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-white/[0.06] rounded-xl font-bold transition-colors duration-150"
                    >
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                  {/* My Profile Link (Unlocked for Editors / Locked Notice for Creators) */}
                  {activeRole === 'EDITOR' ? (
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-3 py-2 text-zinc-100 font-bold hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors duration-150"
                    >
                      👤 My Editor Profile
                    </Link>
                  ) : (
                    <div className="px-3 py-2 text-zinc-500 text-[11px] italic border-b border-white/[0.06]">
                      🔒 Uploading locked in Creator Mode
                    </div>
                  )}

                  <button
                    onClick={toggleRole}
                    className="w-full text-left px-3 py-2.5 rounded-xl font-bold bg-zinc-800/60 hover:bg-zinc-800 border border-white/[0.06] hover:border-lime-400/30 text-lime-400 flex items-center justify-between transition-all duration-200 group"
                  >
                    <span>{activeRole === 'CREATOR' ? 'Switch to Editor' : 'Switch to Creator'}</span>
                    <span className="text-xs transition-transform duration-300 group-hover:rotate-180">🔄</span>
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl font-bold border-t border-white/[0.06] mt-1 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE CONTROLS */}
      <div className="flex md:hidden items-center gap-2">
        {!user ? (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Log in
          </button>
        ) : (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-zinc-900/90 border border-white/10 rounded-xl flex items-center gap-2 hover:border-white/20 transition-all"
          >
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-lime-400/50"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-lime-400 text-zinc-950 text-xs font-black flex items-center justify-center">
                {(user.name || user.email)?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
            {isMobileMenuOpen ? <X className="w-4 h-4 text-zinc-300" /> : <Menu className="w-4 h-4 text-zinc-300" />}
          </button>
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bg-zinc-950/95 backdrop-blur-2xl border-b border-white/10 p-4 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 text-xs animate-in fade-in slide-from-top-2 duration-150">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm">{user.name || user.email?.split('@')[0] || 'User'}</p>
                {isUserAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-[11px]">{user.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-400/10 text-lime-400 font-extrabold text-[10px] rounded-lg border border-lime-400/25 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              {activeRole}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {isUserAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl text-center border border-amber-500/30 active:scale-[0.99] transition-all"
              >
                ⚡ Admin Dashboard
              </Link>
            )}
            <button
              onClick={toggleRole}
              className="w-full py-3 bg-zinc-900/90 border border-white/10 text-lime-400 font-bold rounded-xl text-center active:scale-[0.99] transition-all"
            >
              Switch to {activeRole === 'CREATOR' ? 'Editor Mode' : 'Creator Mode'}
            </button>

            {activeRole === 'EDITOR' ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 bg-zinc-900/90 text-white font-bold rounded-xl text-center border border-white/10 active:scale-[0.99] transition-all"
              >
                👤 My Profile
              </Link>
            ) : (
              <div className="py-2.5 text-center text-zinc-500 text-xs italic">
                🔒 Uploading locked in Creator Mode
              </div>
            )}

            <button
              onClick={logout}
              className="w-full py-3 bg-rose-950/30 text-rose-400 hover:text-rose-300 font-bold rounded-xl text-center border border-rose-500/20 active:scale-[0.99] transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* IN-PAGE LOGIN MODAL */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </nav>
  )
}
