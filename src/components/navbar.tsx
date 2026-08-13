'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Video, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, loading, activeRole, setActiveRole, loginWithGoogle, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    user?.prefs?.avatar ||
    user?.user_metadata?.avatar_url ||
    user?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || user?.email || 'User')}`

  const toggleRole = () => {
    const nextRole = activeRole === 'CREATOR' ? 'EDITOR' : 'CREATOR'
    setActiveRole(nextRole)
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-[#0E1017] border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between text-gray-100 sticky top-0 z-50">
      {/* Brand Logo */}
      <Link className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2 font-display" href="/">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 shadow-sm transition-transform hover:scale-105">
          <Video className="w-4 h-4 text-zinc-950" />
        </div>
        <span>UPERAI</span>
      </Link>



      {/* DESKTOP RIGHT CONTROLS */}
      <div className="hidden md:flex items-center gap-4">
        {/* Persistent sticky CTA — always visible, adapts to active role */}
        <Link
          href={activeRole === 'EDITOR' ? '/profile' : '/editors'}
          className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black text-xs font-extrabold rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {activeRole === 'EDITOR' ? '+ List your work' : 'Browse Editors'}
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        ) : !user ? (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold transition-all text-white"
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
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-lime-400 focus:outline-none transition-transform hover:scale-105"
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
                <span className="text-[13px] font-bold text-black bg-lime-400 w-full h-full flex items-center justify-center">
                  {(user.name || user.email)?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2 text-xs animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="font-bold text-white truncate">{user.name || user.email?.split('@')[0] || 'User'}</p>
                  {user.email && <p className="text-zinc-400 text-[10px] truncate">{user.email}</p>}
                  <span className="inline-block mt-1 px-2 py-0.5 bg-lime-950 text-lime-400 font-bold rounded text-[9px] border border-lime-500/20">
                    Active: {activeRole}
                  </span>
                </div>

                <div className="space-y-1">
                  {/* My Profile Link (Unlocked for Editors / Locked Notice for Creators) */}
                  {activeRole === 'EDITOR' ? (
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-3 py-2 text-white font-bold hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      👤 My Editor Profile
                    </Link>
                  ) : (
                    <div className="px-3 py-2 text-zinc-500 text-[11px] italic border-b border-zinc-800/50">
                      🔒 Uploading locked in Creator Mode
                    </div>
                  )}

                  <button
                    onClick={toggleRole}
                    className="w-full text-left px-3 py-2.5 rounded-xl font-bold bg-zinc-800/80 hover:bg-zinc-800 text-lime-400 flex items-center justify-between transition-all"
                  >
                    <span>{activeRole === 'CREATOR' ? 'Switch to Editor' : 'Switch to Creator'}</span>
                    <span className="text-xs">🔄</span>
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/30 rounded-xl font-bold border-t border-zinc-800 mt-1 transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-400 text-black font-extrabold text-xs rounded-lg"
          >
            Log in
          </button>
        ) : (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2"
          >
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-lime-400 text-black text-xs font-black flex items-center justify-center">
                {(user.name || user.email)?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
            {isMobileMenuOpen ? <X className="w-4 h-4 text-zinc-400" /> : <Menu className="w-4 h-4 text-zinc-400" />}
          </button>
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-zinc-950 border-b border-zinc-800 p-4 space-y-4 shadow-2xl z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div>
              <p className="font-bold text-white text-sm">{user.name || user.email?.split('@')[0] || 'User'}</p>
              <p className="text-zinc-400 text-[11px]">{user.email}</p>
            </div>
            <span className="px-2 py-1 bg-lime-950 text-lime-400 font-extrabold text-[10px] rounded border border-lime-500/20">
              {activeRole}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={toggleRole}
              className="w-full py-3 bg-zinc-900 border border-zinc-800 text-lime-400 font-bold rounded-xl text-center"
            >
              Switch to {activeRole === 'CREATOR' ? 'Editor Mode' : 'Creator Mode'}
            </button>

            {activeRole === 'EDITOR' ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 bg-zinc-900 text-white font-bold rounded-xl text-center border border-zinc-800"
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
              className="w-full py-3 bg-red-950/40 text-red-400 font-bold rounded-xl text-center border border-red-900/30"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
