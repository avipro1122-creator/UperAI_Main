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

  // Real-time site visitor tracker from Appwrite
  useEffect(() => {
    async function trackVisitor() {
      try {
        const res = await fetch('/api/visitor-count', { method: 'POST' })
        const data = await res.json()
        if (data.count) {
          setVisitorCount(data.count)
        }
      } catch {
        setVisitorCount(1)
      }
    }
    trackVisitor()
  }, [])

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs font-semibold text-zinc-300 shadow-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  Verified Indian Editors • Upfront Rates in INR
                </span>
              </div>

              {/* Live Visitor Count Badge */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 shadow-sm w-fit">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-zinc-200 font-extrabold">
                  {visitorCount !== null ? `${visitorCount.toLocaleString()}+` : '...'}
                </span>{' '}
                Creators & Editors visited
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="block sm:inline-flex items-center p-1 rounded-2xl sm:rounded-full bg-zinc-900/90 border border-zinc-800 mb-8 shadow-inner">
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
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              {isCreators ? (
                <>
                  Stop hiring in <span className="text-gradient-lime">Instagram DMs.</span>
                </>
              ) : (
                <>
                  Show your work. <span className="text-gradient-lime">Set your rate.</span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-zinc-300 font-normal leading-relaxed mt-4 sm:mt-5 max-w-xl">
              {isCreators
                ? "You don't need 40 replies. You need one editor who's actually good."
                : 'Get found by creators who are actually hiring.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto">
              {isCreators ? (
                <>
                  <button
                    type="button"
                    onClick={scrollToMarketplace}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl transition-all text-xs sm:text-sm shadow-lg text-center inline-flex items-center justify-center gap-1.5"
                  >
                    Browse editors <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/editors"
                    className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl transition-all text-xs sm:text-sm text-center"
                  >
                    View All Directory
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="w-full sm:w-auto px-6 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-xl transition-all text-xs sm:text-sm shadow-lg text-center inline-flex items-center justify-center gap-1.5"
                  >
                    List your work <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/editors"
                    className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl transition-all text-xs sm:text-sm text-center"
                  >
                    View All Directory
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          {hasMultipleEditors && (
            <div className="lg:col-span-6 xl:col-span-5 relative mt-6 lg:mt-0">
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
                      <div className="shadow-2xl shadow-black/90 rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-950/95 backdrop-blur-xl hover:scale-[1.03] hover:border-lime-400/40 transition-all duration-300">
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
