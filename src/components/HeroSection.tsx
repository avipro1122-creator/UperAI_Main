'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowUpRight, Sparkles, Play, CheckCircle2, ShieldCheck, Eye, Zap } from 'lucide-react'
import { EditorCardData } from '@/components/EditorCard'
import { useOnboarding } from '@/context/OnboardingContext'
import { useAuth } from '@/context/AuthContext'
import { parseVideoUrl } from '@/lib/video-parser'

const VideoPlayerModal = dynamic(() => import('@/components/VideoPlayerModal'), { ssr: false })

interface HeroSectionProps {
  featured: EditorCardData[]
  userRole?: string | null
  userHandle?: string | null
}

const FALLBACK_EDITORS: EditorCardData[] = [
  {
    handle: 'arjun_vfx',
    name: 'Arjun Verma',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    headline: 'High-Retention Shorts & Reels Specialist',
    min_rate: 1500,
    currency: 'INR',
    thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
    format_tag: 'Shorts',
    specialty: 'Shorts / Reels',
  },
  {
    handle: 'rohit_edits',
    name: 'Rohit Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    headline: 'YouTube Long-Form & Storytelling Editor',
    min_rate: 4500,
    currency: 'INR',
    thumbnail_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    format_tag: 'Long-form',
    specialty: 'Long-Form',
  },
  {
    handle: 'priya_visuals',
    name: 'Priya Nair',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    headline: '3D VFX & Motion Graphics Designer',
    min_rate: 3000,
    currency: 'INR',
    thumbnail_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80',
    format_tag: 'Both',
    specialty: 'VFX / 3D',
  },
]

const CARD_VIEW_BADGES = ['48.2k views', '125k views', '92.4k views']

export default function HeroSection({ featured }: HeroSectionProps) {
  const router = useRouter()
  const { user, activeRole, setActiveRole } = useAuth()
  const { openModal } = useOnboarding()
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState<number | null>(null)

  // Auto-looping rotating carousel state
  const [activeIndex, setActiveIndex] = useState(0)
  const [isRotatingPaused, setIsRotatingPaused] = useState(false)

  // Video Audition Modal State for floating hero cards
  const [activeVideoModal, setActiveVideoModal] = useState<{
    isOpen: boolean
    videoId: string | null
    title: string | null
    editorName: string
    specialty: string
    rate: string
  }>({
    isOpen: false,
    videoId: null,
    title: null,
    editorName: '',
    specialty: '',
    rate: '',
  })

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

    updateVisitor(true)

    const interval = setInterval(() => {
      updateVisitor(false)
    }, 8000)

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
  const displayEditors = featured.length >= 2 ? featured.slice(0, 3) : FALLBACK_EDITORS

  // Continuous auto-looping showreel timer (every 3.5s)
  useEffect(() => {
    if (isRotatingPaused || activeVideoModal.isOpen || displayEditors.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayEditors.length)
    }, 3500)

    return () => clearInterval(timer)
  }, [isRotatingPaused, activeVideoModal.isOpen, displayEditors.length])

  const scrollToMarketplace = () => {
    const marketplaceElement = document.getElementById('marketplace-section')
    if (marketplaceElement) {
      marketplaceElement.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = '/editors'
    }
  }

  const handleEditorAction = () => {
    if (user) {
      setActiveRole('EDITOR')
      router.push('/profile')
    } else {
      openModal()
    }
  }

  return (
    <>
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-14 pb-12 sm:pb-24 border-b border-zinc-800/60 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-5 w-96 h-96 ambient-glow-lime pointer-events-none blur-3xl opacity-50" />
        <div className="absolute top-1/3 right-5 w-96 h-96 ambient-glow-purple pointer-events-none blur-3xl opacity-40" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-10 items-center">
          {/* Left Column — Text & CTAs */}
          <div className="lg:col-span-6 xl:col-span-7">
            {/* Live Status Badge & Live Visitor Counter */}
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6 animate-hero-in" style={{ animationDelay: '0ms' }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-semibold text-zinc-300 shadow-inner w-fit backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-lime-400" />
                  Verified Indian Editors • Rates in INR
                </span>
              </div>

              {/* Live Real-Time Visitor Count Badge */}
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-400 px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/10 shadow-inner w-fit backdrop-blur-md transition-all duration-300 hover:border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-zinc-100 font-extrabold tabular-nums font-mono">
                  {displayCount !== null ? displayCount.toLocaleString() : (visitorCount !== null ? visitorCount.toLocaleString() : '28')}
                </span>{' '}
                online now
              </div>
            </div>

            {/* Audience Switcher (Sleek Segmented Tab Control) */}
            <div className="inline-flex p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-4 sm:mb-6 shadow-inner animate-hero-in" style={{ animationDelay: '80ms' }}>
              <button
                type="button"
                onClick={() => setActiveRole('CREATOR')}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                  isCreators
                    ? 'bg-zinc-100 text-zinc-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                For Creators
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('EDITOR')}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                  !isCreators
                    ? 'bg-zinc-100 text-zinc-950 shadow-md scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                For Editors
              </button>
            </div>

            {/* Headline */}
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] animate-hero-in"
              style={{ animationDelay: '160ms' }}
            >
              {isCreators ? (
                <>
                  Stop hiring in<br className="hidden sm:inline" />
                  <span className="text-gradient-lime drop-shadow-[0_2px_28px_rgba(226,249,82,0.18)]">
                    {' '}Instagram DMs.
                  </span>
                </>
              ) : (
                <>
                  Show your work.<br className="hidden sm:inline" />
                  <span className="text-gradient-lime drop-shadow-[0_2px_28px_rgba(226,249,82,0.18)]">
                    {' '}Set your rate.
                  </span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p
              className="text-xs sm:text-base lg:text-lg text-zinc-400 font-normal leading-relaxed mt-3 sm:mt-5 max-w-xl animate-hero-in"
              style={{ animationDelay: '240ms' }}
            >
              {isCreators
                ? "You don't need 40 replies. You need one editor who's actually good."
                : 'Get discovered by high-budget creators and agencies who are actively hiring.'}
            </p>

            {/* Action Buttons: Distinct Primary & Secondary CTAs */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-9 w-full sm:w-auto animate-hero-in"
              style={{ animationDelay: '320ms' }}
            >
              {isCreators ? (
                <>
                  {/* Primary CTA: Find an Editor */}
                  <button
                    type="button"
                    onClick={scrollToMarketplace}
                    className="group w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg shadow-lime-400/20 hover:shadow-lime-400/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-center inline-flex items-center justify-center gap-2"
                  >
                    <span>Find an Editor</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>

                  {/* Secondary CTA: Join as an Editor */}
                  <button
                    type="button"
                    onClick={handleEditorAction}
                    className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-zinc-100 font-semibold rounded-xl transition-all duration-300 text-xs sm:text-sm hover:-translate-y-0.5 active:translate-y-0 text-center inline-flex items-center justify-center gap-2 backdrop-blur-md"
                  >
                    <span>Join as an Editor</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Primary CTA for Editors */}
                  <button
                    type="button"
                    onClick={handleEditorAction}
                    className="group w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-lg shadow-lime-400/20 hover:shadow-lime-400/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-center inline-flex items-center justify-center gap-2"
                  >
                    <span>{user ? 'My Editor Dashboard' : 'Join as an Editor'}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>

                  {/* Secondary CTA for Editors */}
                  <button
                    type="button"
                    onClick={scrollToMarketplace}
                    className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-zinc-100 font-semibold rounded-xl transition-all duration-300 text-xs sm:text-sm hover:-translate-y-0.5 active:translate-y-0 text-center inline-flex items-center justify-center gap-2 backdrop-blur-md"
                  >
                    <span>Browse Directory</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Auto-Looping Rotating 9:16 Showreel Cards */}
          <div
            className="lg:col-span-6 xl:col-span-5 relative mt-4 sm:mt-6 lg:mt-0 animate-hero-in select-none"
            style={{ animationDelay: '200ms' }}
            onMouseEnter={() => setIsRotatingPaused(true)}
            onMouseLeave={() => setIsRotatingPaused(false)}
            onTouchStart={() => setIsRotatingPaused(true)}
            onTouchEnd={() => setIsRotatingPaused(false)}
          >
            <div className="relative w-full max-w-sm mx-auto lg:max-w-none h-[420px] sm:h-[500px] lg:h-[520px] flex items-center justify-center">
              {displayEditors.map((editor, idx) => {
                // Calculate rotational slot: 0 = Front (active), 1 = Back Right, 2 = Back Left
                const slot = (idx - activeIndex + displayEditors.length) % displayEditors.length
                const isFront = slot === 0
                const isBackRight = slot === 1

                const cardStyles = isFront
                  ? 'bottom-2 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-30 w-[240px] sm:w-[275px] scale-100 opacity-100 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(204,255,0,0.18)]'
                  : isBackRight
                  ? 'top-4 right-1 sm:-right-2 z-10 w-[220px] sm:w-[250px] scale-[0.9] opacity-60 hover:opacity-90 hover:scale-95'
                  : 'top-0 left-1 sm:-left-2 z-20 w-[225px] sm:w-[255px] scale-[0.92] opacity-70 hover:opacity-90 hover:scale-95'

                const parsed = parseVideoUrl(editor.raw_video_url)
                const videoId = parsed?.videoId || null
                const thumb = parsed?.thumbnailUrl || editor.thumbnail_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7'
                const rateLabel = editor.min_rate != null ? `From ₹${editor.min_rate.toLocaleString()}` : 'Rates upfront'
                const viewBadge = CARD_VIEW_BADGES[idx % CARD_VIEW_BADGES.length]

                return (
                  <div
                    key={editor.handle || idx}
                    onClick={() => {
                      if (!isFront) {
                        setActiveIndex(idx)
                      }
                    }}
                    className={`absolute transition-all duration-700 ease-out cursor-pointer ${cardStyles}`}
                    title={isFront ? 'Click to play showreel' : `Click to preview ${editor.name}`}
                  >
                    {/* Faint Accent Back-Glow */}
                    <div
                      className={`absolute -inset-1 rounded-3xl bg-lime-400/15 blur-xl transition-opacity pointer-events-none -z-10 ${
                        isFront ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/90 backdrop-blur-xl transition-all duration-300 group">
                      {/* Vertical 9:16 Frame */}
                      <div className="relative w-full aspect-[9/16] bg-zinc-950 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={editor.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />

                        {/* Top Badges: Turnaround / Rating */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-zinc-950/85 border border-white/10 text-lime-300 backdrop-blur-md">
                            {idx === 0 ? '🔥 Top Rated' : idx === 1 ? '⚡ 24h Turnaround' : '✨ Pro Motion'}
                          </span>
                        </div>

                        {/* Center Play Button Overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveVideoModal({
                              isOpen: true,
                              videoId,
                              title: `${editor.name}'s Showreel`,
                              editorName: editor.name,
                              specialty: editor.headline || 'Video Editor',
                              rate: rateLabel,
                            })
                          }}
                          className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
                            isFront ? 'opacity-100 group-hover:scale-110' : 'opacity-70 group-hover:opacity-100'
                          }`}
                          title="Play showreel"
                        >
                          <div
                            className={`rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-lime-400/30 font-bold hover:bg-lime-300 transition-transform ${
                              isFront ? 'w-12 h-12' : 'w-9 h-9'
                            }`}
                          >
                            <Play className={`fill-zinc-950 ml-0.5 ${isFront ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
                          </div>
                        </button>

                        {/* Bottom Card Content over 9:16 video */}
                        <div className="absolute bottom-3 inset-x-3 space-y-1.5 pointer-events-none">
                          <div className="flex items-center gap-2">
                            {/* Avatar */}
                            {editor.avatar_url && !editor.avatar_url.includes('dicebear.com') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={editor.avatar_url}
                                alt={editor.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-lime-400 text-zinc-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {editor.name?.[0] || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1">
                                <span>{editor.name}</span>
                                <CheckCircle2 className="w-3 h-3 text-lime-400 shrink-0" />
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">@{editor.handle}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                            <span className="text-zinc-300 truncate max-w-[110px]">
                              {editor.format_tag || 'Shorts / Reels'}
                            </span>
                            <span className="font-extrabold text-lime-400 font-mono">
                              {rateLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Interactive Rotation Indicator Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-2 sm:mt-4">
              {displayEditors.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-6 bg-lime-400 shadow-[0_0_10px_rgba(204,255,0,0.5)]'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Rotate to showreel ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Audition Modal for Floating Cards */}
      <VideoPlayerModal
        isOpen={activeVideoModal.isOpen}
        onClose={() => setActiveVideoModal((prev) => ({ ...prev, isOpen: false }))}
        videoId={activeVideoModal.videoId}
        title={activeVideoModal.title}
        editorName={activeVideoModal.editorName}
        specialty={activeVideoModal.specialty}
        rate={activeVideoModal.rate}
      />

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2.5 z-40 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        <div className="min-w-0 pr-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Verified Indian Editors</p>
          <p className="text-[11px] font-extrabold text-lime-400 truncate">Rates Upfront in INR</p>
        </div>

        <button
          type="button"
          onClick={scrollToMarketplace}
          className="shrink-0 px-4 py-2 bg-lime-400 active:bg-lime-300 text-zinc-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider whitespace-nowrap"
        >
          Find Editor ↗
        </button>
      </div>
    </>
  )
}


