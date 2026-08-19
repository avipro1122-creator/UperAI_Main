'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Search,
  SlidersHorizontal,
  X,
  Play,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Filter,
  IndianRupee,
  RotateCcw,
} from 'lucide-react'
import EditorCard, { EditorCardData } from '@/components/EditorCard'

const VideoPlayerModal = dynamic(() => import('@/components/VideoPlayerModal'), { ssr: false })

export interface MarketplaceFeedProps {
  editors: EditorCardData[]
  isServerError?: boolean
}

type NicheFilter = 'all' | 'shorts' | 'long' | 'gaming' | 'vfx'

export default function MarketplaceFeed({
  editors = [],
  isServerError = false,
}: MarketplaceFeedProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNiche, setSelectedNiche] = useState<NicheFilter>('all')
  const [maxRate, setMaxRate] = useState<number>(15000)

  // Video Audition Modal State
  const [videoModal, setVideoModal] = useState<{
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

  // Filter Logic
  const filteredEditors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return editors.filter((editor) => {
      // 1. Text Search Filter
      if (q) {
        const matchName = editor.name.toLowerCase().includes(q)
        const matchHeadline = editor.headline ? editor.headline.toLowerCase().includes(q) : false
        const matchHandle = editor.handle.toLowerCase().includes(q)
        const matchSpecialty = editor.specialty ? editor.specialty.toLowerCase().includes(q) : false
        const matchSoftware = (editor.softwareTags || []).some((tag) => tag.toLowerCase().includes(q))
        const matchInstagram = editor.instagram_handle ? editor.instagram_handle.toLowerCase().includes(q) : false

        if (
          !matchName &&
          !matchHeadline &&
          !matchHandle &&
          !matchSpecialty &&
          !matchSoftware &&
          !matchInstagram
        ) {
          return false
        }
      }

      // 2. Niche Format Filter
      if (selectedNiche !== 'all') {
        const spec = (editor.specialty || editor.headline || '').toLowerCase()
        const format = (editor.format_tag || '').toLowerCase()
        const software = (editor.softwareTags || []).map((s) => s.toLowerCase()).join(' ')

        if (selectedNiche === 'shorts') {
          const isShorts =
            format.includes('short') ||
            format.includes('both') ||
            spec.includes('short') ||
            spec.includes('reel') ||
            spec.includes('tiktok')
          if (!isShorts) return false
        } else if (selectedNiche === 'long') {
          const isLong =
            format.includes('long') ||
            format.includes('both') ||
            spec.includes('long') ||
            spec.includes('youtube') ||
            spec.includes('documentary')
          if (!isLong) return false
        } else if (selectedNiche === 'gaming') {
          const isGaming = spec.includes('gaming') || software.includes('gaming') || spec.includes('stream')
          if (!isGaming) return false
        } else if (selectedNiche === 'vfx') {
          const isVfx =
            spec.includes('vfx') ||
            spec.includes('motion') ||
            spec.includes('3d') ||
            software.includes('after effects') ||
            software.includes('blender')
          if (!isVfx) return false
        }
      }

      // 3. Price Filter
      if (editor.min_rate != null && editor.min_rate > maxRate) {
        return false
      }

      return true
    })
  }, [editors, searchQuery, selectedNiche, maxRate])

  const hasActiveFilters = searchQuery.trim() !== '' || selectedNiche !== 'all' || maxRate < 15000

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedNiche('all')
    setMaxRate(15000)
  }

  return (
    <section id="marketplace-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-10 w-96 h-96 ambient-glow-lime opacity-30 pointer-events-none blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 ambient-glow-purple opacity-30 pointer-events-none blur-3xl" />

      {/* ── SECTION HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-zinc-300 mb-2 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>Editor Directory</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Explore Verified <span className="text-gradient-lime">Indian Editors</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Filter by format, audition real video edits, and connect directly with transparent INR rates.
          </p>
        </div>

        <Link
          href="/editors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-lime-300 transition-colors bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-xl w-fit shrink-0"
        >
          <span>View All Directory ({editors.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── UNIFIED FILTER & SEARCH BAR (Sticky Glassmorphic Container) ─────────── */}
      <div className="sticky top-16 z-30 mb-10 p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4">
        {/* Top Row: Search Input + Niche Chips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          {/* Search Input (5 Cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by software, style, or editor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Niche Pills (7 Cols) */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'shorts', label: 'Short-Form / Reels' },
              { id: 'long', label: 'Long-Form' },
              { id: 'gaming', label: 'Gaming' },
              { id: 'vfx', label: 'VFX' },
            ].map((niche) => {
              const isActive = selectedNiche === niche.id
              return (
                <button
                  key={niche.id}
                  onClick={() => setSelectedNiche(niche.id as NicheFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20 scale-[1.02]'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {niche.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom Row: Price Slider + Results Counter + Reset */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Price Range Slider */}
          <div className="flex items-center gap-3 w-full sm:max-w-md bg-zinc-900/80 border border-zinc-800/80 px-3.5 py-2 rounded-xl">
            <div className="flex items-center gap-1 text-xs font-bold text-zinc-300 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-lime-400" />
              <span>Budget:</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">₹500</span>
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-full accent-lime-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
              <span className="text-[11px] text-zinc-500 font-mono">₹15k+</span>
            </div>
            <span className="text-xs font-extrabold text-lime-400 font-mono shrink-0 px-2 py-0.5 rounded-lg bg-lime-400/10 border border-lime-400/20">
              {maxRate >= 15000 ? '₹15,000+' : `≤ ₹${maxRate.toLocaleString()}`}
            </span>
          </div>

          {/* Results Counter & Reset Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold text-zinc-400">
            <span>
              Showing <strong className="text-white">{filteredEditors.length}</strong> {filteredEditors.length === 1 ? 'editor' : 'editors'}
            </span>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors p-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── EDITOR GRID OR SERVER STATE ─────────────────────────────────────────── */}
      {isServerError ? (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center mx-auto text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-amber-200">
            Brief Maintenance in Progress
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            We are currently refreshing our server catalog. Please check back in a couple of minutes.
          </p>
        </div>
      ) : filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <EditorCard key={editor.handle || editor.id} editor={editor} />
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-white">
              No matching editors found
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any video editors matching your current search &amp; filter criteria.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── VIDEO PLAYER MODAL ─────────────────────────────────────────────────── */}
      <VideoPlayerModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal((prev) => ({ ...prev, isOpen: false }))}
        videoId={videoModal.videoId}
        title={videoModal.title}
        editorName={videoModal.editorName}
        specialty={videoModal.specialty}
        rate={videoModal.rate}
      />
    </section>
  )
}
