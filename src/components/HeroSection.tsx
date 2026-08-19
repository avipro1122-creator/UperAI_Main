'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import EditorCard, { EditorCardData } from '@/components/EditorCard'
import { useOnboarding } from '@/context/OnboardingContext'
import { useAuth } from '@/context/AuthContext'

interface HeroSectionProps {
  featured: EditorCardData[]
  userRole?: string | null
  userHandle?: string | null
}

export default function HeroSection({
  featured,
}: HeroSectionProps) {
  const { activeRole, setActiveRole } = useAuth()
  const { openModal } = useOnboarding()
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState<number | null>(null)

  // Real-time site visitor tracker and live presence heartbeat
  useEffect(() => {
    let isMounted = true

    async function updateVisitor(isInitial = false) {
      try {
        const method = isInitial ? 'POST' : 'GET'
        const res = await fetch(`/api/visitor-count?t=${Date.now()}`, {
          method,
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        if (data && typeof data.activeNow === 'number' && isMounted) {
          setVisitorCount(data.activeNow)
        } else if (data && typeof data.count === 'number' && isMounted) {
          setVisitorCount(data.count)
        }
      } catch {
        // Quiet fallback
      }
    }

    // 1. Initial hit with POST to record session
    updateVisitor(true)

    // 2. Periodic live heartbeat every 8 seconds
    const interval = setInterval(() => {
      updateVisitor(false)
    }, 8000)

    // 3. Immediately refresh when tab gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateVisitor(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Smooth count animation when visitor count updates
  useEffect(() => {
    if (visitorCount === null) return

    if (displayCount === null) {
      setDisplayCount(visitorCount)
      return
    }

    const start = displayCount
    const end = visitorCount
    if (start === end) return

    const duration = 600
    const startTime = performance.now()

    let animFrame: number
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * easeOut)
      setDisplayCount(current)

      if (progress < 1) {
        animFrame = requestAnimationFrame(step)
      }
    }

    animFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animFrame)
  }, [visitorCount, displayCount])

  const isCreators = activeRole === 'CREATOR'
  const hasMultipleEditors = featured.length >= 2
  const visibleCards = featured.slice(0, 3)

  const scrollToMarketplace = () => {
    const marketplaceElement = document.getElementById('marketplace-section')
    if (marketplaceElement) {
      marketplaceElement.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = '/editors'
    }
  }

  return (
    <>
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 border-b border-zinc-800/60 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 ambient-glow-lime pointer-events-none blur-3xl opacity-70" />
        <div className="absolute top-1/3 right-10 w-96 h-96 ambient-glow-purple pointer-events-none blur-3xl opacity-60" />

        <div
          className={
            hasMultipleEditors
              ? 'relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center'
              : 'relative z-10 max-w-2xl'
          }
        >
          {/* Left Column — Text & Toggle */}
          <div className={hasMultipleEditors ? 'lg:col-span-6 xl:col-span-7' : ''}>
            {/* Live Status Badge & Live Visitor Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 animate-hero-in" style={{ animationDelay: '0ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs font-semibold text-zinc-300 shadow-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  Verified Indian Editors • Upfront Rates in INR
                </span>
              </div>

              {/* Live Real-Time Visitor Count Badge */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 shadow-sm w-fit transition-all duration-300 hover:border-zinc-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-zinc-200 font-extrabold tabular-nums">
                  {displayCount !== null ? displayCount.toLocaleString() : (visitorCount !== null ? visitorCount.toLocaleString() : '...')}
                </span>{' '}
                Creators & Editors online now
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="block sm:inline-flex items-center p-1 rounded-2xl sm:rounded-full bg-zinc-900/90 border border-zinc-800 mb-8 shadow-inner animate-hero-in" style={{ animationDelay: '80ms' }}>
              <button
                type="button"
                onClick={() => setActiveRole('CREATOR')}
                className={`w-full sm:w-auto px-5 py-2 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                  isCreators
                    ? 'bg-zinc-100 text-zinc-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                FOR CREATORS / CLIENTS
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('EDITOR')}
                className={`w-full sm:w-auto px-5 py-2 mt-1 sm:mt-0 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                  !isCreators
                    ? 'bg-zinc-100 text-zinc-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                FOR EDITORS
              </button>
            </div>

            {/* Headline */}
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-100 leading-[1.1] animate-hero-in"
              style={{ animationDelay: '160ms' }}
            >
              {isCreators ? (
                <>
                  Stop hiring in{' '}
                  <span className="text-gradient-lime drop-shadow-[0_2px_28px_rgba(226,249,82,0.18)]">
                    Instagram DMs.
                  </span>
                </>
              ) : (
                <>
                  Show your work.{' '}
                  <span className="text-gradient-lime drop-shadow-[0_2px_28px_rgba(226,249,82,0.18)]">
                    Set your rate.
                  </span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p
              className="text-base sm:text-xl text-gray-400 font-normal leading-relaxed mt-4 sm:mt-5 max-w-xl animate-hero-in"
              style={{ animationDelay: '240ms' }}
            >
              {isCreators
                ? "You don't need 40 replies. You need one editor who's actually good."
                : 'Get found by creators who are actually hiring.'}
            </p>

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto animate-hero-in"
              style={{ animationDelay: '320ms' }}
            >
              {isCreators ? (
                <>
                  <button
                    type="button"
                    onClick={scrollToMarketplace}
                    className="group w-full sm:w-auto px-6 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg hover:shadow-[0_0_32px_rgba(204,255,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-center inline-flex items-center justify-center gap-1.5"
                  >
                    Browse editors
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <Link
                    href="/editors"
                    className="group w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-gray-100 font-bold rounded-xl transition-all duration-300 text-xs sm:text-sm hover:-translate-y-0.5 active:translate-y-0 text-center inline-flex items-center justify-center gap-1.5"
                  >
                    View All Directory
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="group w-full sm:w-auto px-6 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg hover:shadow-[0_0_32px_rgba(204,255,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-center inline-flex items-center justify-center gap-1.5"
                  >
                    List your work
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/editors"
                    className="group w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-gray-100 font-bold rounded-xl transition-all duration-300 text-xs sm:text-sm hover:-translate-y-0.5 active:translate-y-0 text-center inline-flex items-center justify-center gap-1.5"
                  >
                    View All Directory
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          {hasMultipleEditors && (
            <div
              className="lg:col-span-6 xl:col-span-5 relative mt-6 lg:mt-0 animate-hero-in"
              style={{ animationDelay: '200ms' }}
            >
              <div className="relative w-full max-w-sm mx-auto lg:max-w-none h-[420px] flex items-center justify-center">
                {visibleCards.map((editor, idx) => {
                  const isFirst = idx === 0
                  const isSecond = idx === 1

                  const cardStyles = isFirst
                    ? 'top-2 left-0 sm:-left-2 z-20 w-[270px] sm:w-[290px] animate-float-slow'
                    : isSecond
                    ? 'top-20 right-0 sm:-right-2 z-10 w-[260px] sm:w-[280px] animate-float-delayed opacity-90'
                    : 'bottom-2 left-6 sm:left-8 z-30 w-[260px] sm:w-[280px] animate-float-slow'

                  return (
                    <div
                      key={editor.handle}
                      className={`absolute transition-transform duration-300 ${cardStyles}`}
                    >
                      <div className="shadow-2xl shadow-black/90 rounded-2xl overflow-hidden border border-white/10 bg-[#14161F]/90 backdrop-blur-xl hover:scale-[1.03] hover:border-lime-400/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_20px_rgba(204,255,0,0.08)] transition-all duration-300">
                        <EditorCard editor={editor} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MASAI-STYLE MOBILE STICKY BOTTOM BAR (Visible only on mobile screens < sm) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 p-3 z-40 flex items-center justify-between gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="pl-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Verified Indian Editors</p>
          <p className="text-xs font-black text-lime-400">Rates Upfront in INR</p>
        </div>

        <button
          onClick={scrollToMarketplace}
          className="px-5 py-3 bg-lime-400 active:bg-lime-300 text-black font-black text-xs rounded-xl shadow-lg uppercase tracking-wider whitespace-nowrap"
        >
          EXPLORE NOW ↗
        </button>
      </div>
    </>
  )
}
