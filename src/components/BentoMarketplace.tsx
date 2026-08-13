'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Send,
  Sliders,
  Filter,
} from 'lucide-react'
import VideoPlayerModal from '@/components/VideoPlayerModal'

export interface BentoEditorItem {
  id: string
  name: string
  avatar: string
  specialty: string
  category: 'shorts' | 'long' | 'vfx'
  headline: string
  rate: number
  rateLabel: string
  turnaround: string
  badgeText?: string
  videoId: string
  previewImg: string
  softwareTags: string[]
}

interface BentoMarketplaceProps {
  dbEditors?: BentoEditorItem[]
  isServerError?: boolean
}

export default function BentoMarketplace({ dbEditors = [], isServerError = false }: BentoMarketplaceProps) {
  // Global Filters State
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'shorts' | 'long' | 'vfx'>('all')
  const [maxRate, setMaxRate] = useState<number>(15000)

  // Preview & Audition Modal State
  const [selectedEditor, setSelectedEditor] = useState<BentoEditorItem | null>(null)
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<{
    title: string
    video_url: string
    role_explanation?: string
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleOpenPreview = (editor: BentoEditorItem) => {
    setSelectedEditor(editor)
    setSelectedPortfolioItem({
      title: editor.headline || `${editor.name}'s Portfolio`,
      video_url: `https://www.youtube.com/watch?v=${editor.videoId}`,
      role_explanation: editor.specialty,
    })
    setIsPreviewOpen(true)
    setVideoModalData({
      isOpen: true,
      videoId: editor.videoId,
      title: editor.headline || `${editor.name}'s Edit Preview`,
      editorName: editor.name,
      specialty: editor.specialty,
      rate: editor.rateLabel,
    })
  }

  const [videoModalData, setVideoModalData] = useState<{
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

  const [briefModalData, setBriefModalData] = useState<{
    isOpen: boolean
    editorName: string
    specialty: string
    rate: string
  }>({
    isOpen: false,
    editorName: '',
    specialty: '',
    rate: '',
  })

  const [briefSubmitting, setBriefSubmitting] = useState(false)
  const [briefSuccessMsg, setBriefSuccessMsg] = useState<string | null>(null)
  const [briefErrorMsg, setBriefErrorMsg] = useState<string | null>(null)

  // Brief Form Fields
  const [briefChannelUrl, setBriefChannelUrl] = useState('')
  const [briefNotes, setBriefNotes] = useState('')
  const [briefFormat, setBriefFormat] = useState('Shorts / Reels (Vertical 9:16)')

  // Filter Logic over dynamic database editors
  const filteredEditors = useMemo(() => {
    return dbEditors.filter((editor) => {
      // Format Filter
      if (selectedFormat !== 'all' && editor.category !== selectedFormat) {
        return false
      }
      // Rate Filter
      if (editor.rate > maxRate) {
        return false
      }
      return true
    })
  }, [dbEditors, selectedFormat, maxRate])

  const openBriefModal = (name: string, specialty: string, rate: string) => {
    setBriefErrorMsg(null)
    setBriefSuccessMsg(null)
    setBriefChannelUrl('')
    setBriefNotes('')
    setBriefModalData({
      isOpen: true,
      editorName: name,
      specialty,
      rate,
    })
  }

  const handleSendBriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBriefErrorMsg(null)

    if (!briefChannelUrl.trim()) {
      return setBriefErrorMsg('Please enter a valid channel URL.')
    }
    try {
      new URL(briefChannelUrl.trim())
    } catch {
      return setBriefErrorMsg('Please enter a valid URL (e.g. https://youtube.com/@yourchannel)')
    }

    if (briefNotes.trim().length < 20) {
      return setBriefErrorMsg('Project notes must be at least 20 characters long.')
    }

    setBriefSubmitting(true)

    try {
      const res = await fetch('/api/send-brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          editorName: briefModalData.editorName,
          channelUrl: briefChannelUrl.trim(),
          format: briefFormat,
          notes: briefNotes.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send brief.')
      }

      setBriefSuccessMsg(data.message)
    } catch (err: any) {
      setBriefErrorMsg(err.message || 'Error submitting project brief.')
    } finally {
      setBriefSubmitting(false)
    }
  }

  const featuredEditor = dbEditors.find((e) => e.videoId)

  return (
    <section id="marketplace-section" className="w-full bg-[#f8fafc] text-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section Header */}
        <div className="pb-2 border-b border-zinc-200">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Indian editors. Rates upfront.
          </h2>
        </div>

        {/* HIDE ALL CARDS IF ZERO EDITORS OR SHOW SOFT MAINTENANCE NOTICE */}
        {isServerError ? (
          <div className="p-12 rounded-3xl bg-amber-950/10 border border-amber-800/30 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
              ⚡
            </div>
            <h3 className="font-display text-xl font-bold text-zinc-900">
              Brief Backend Maintenance
            </h3>
            <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
              We are currently undergoing brief backend maintenance. Please refresh in a few minutes.
            </p>
          </div>
        ) : filteredEditors.length === 0 ? (
          /* EMPTY STATE WHEN NO EDITORS IN DB */
          <div className="p-12 rounded-3xl bg-white border border-zinc-200 text-center space-y-4 shadow-sm">
            <h3 className="font-display text-2xl font-bold text-zinc-900">
              No Listed Editors Yet
            </h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
              Be the first editor to list your portfolio, YouTube videos, and rates on UperAI!
            </p>
            <Link className="inline-block px-8 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl transition-all shadow-lg text-xs uppercase tracking-wider" href="/profile">
              + List Your Work & Be The First ↗
            </Link>
          </div>
        ) : (
          <>
            {/* ── TOP BANNER SECTION (4 BENTO FEATURE CARDS) ────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: Format Filter */}
              <div className="p-6 rounded-3xl bg-[#E2F952] border border-lime-300 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold tracking-widest text-zinc-900 uppercase flex items-center justify-between">
                    01. Filter by Format <Filter className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-zinc-950">
                    Choose Niche
                  </h3>
                  <p className="text-xs text-zinc-800 leading-relaxed">
                    Filter vertical 9:16 Shorts vs 16:9 Long-form or VFX edits.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    onClick={() => setSelectedFormat('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      selectedFormat === 'all'
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-white/80 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFormat('shorts')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      selectedFormat === 'shorts'
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-white/80 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    Shorts (9:16)
                  </button>
                  <button
                    onClick={() => setSelectedFormat('long')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      selectedFormat === 'long'
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-white/80 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    Long-Form (16:9)
                  </button>
                </div>
              </div>

              {/* Card 2: Audition Player */}
              {featuredEditor && featuredEditor.videoId ? (
                <div className="p-6 rounded-3xl bg-[#D0E8FF] border border-sky-300 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold tracking-widest text-zinc-900 uppercase flex items-center justify-between">
                      02. Audition Editors <Play className="w-3.5 h-3.5 fill-zinc-900" />
                    </span>
                    <h3 className="font-display text-xl font-extrabold text-zinc-950">
                      Play Real Work
                    </h3>
                    <p className="text-xs text-zinc-800 leading-relaxed">
                      Audition real video edits right in the player.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPreview(featuredEditor)}
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 border border-sky-200 hover:bg-white transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{featuredEditor.name}</p>
                      <span className="text-[10px] text-sky-700 font-semibold">Click to play video</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-zinc-100 border border-zinc-200 flex flex-col justify-center text-center">
                  <p className="text-xs text-zinc-500">Audition player active when videos are linked.</p>
                </div>
              )}

              {/* Card 3: Lock Rates Slider */}
              <div className="p-6 rounded-3xl bg-[#FFD6EC] border border-pink-300 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold tracking-widest text-zinc-900 uppercase flex items-center justify-between">
                    03. Lock Rates <Sliders className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-zinc-950">
                    Max Price Filter
                  </h3>
                  <p className="text-xs text-zinc-800 leading-relaxed">
                    Filter editors under your budget.
                  </p>
                </div>
                <div className="space-y-2 bg-white/90 p-3 rounded-2xl border border-pink-200">
                  <div className="flex items-center justify-between text-xs font-extrabold text-zinc-900">
                    <span>Max Budget:</span>
                    <span className="text-pink-600 font-black">₹{maxRate.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="15000"
                    step="500"
                    value={maxRate}
                    onChange={(e) => setMaxRate(Number(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Card 4: Featured Real Editor */}
              {featuredEditor ? (
                <div className="relative p-6 rounded-3xl bg-zinc-950 text-white overflow-hidden flex flex-col justify-between space-y-4 shadow-xl">
                  {featuredEditor.previewImg && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay"
                      style={{ backgroundImage: `url('${featuredEditor.previewImg}')` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-400 text-zinc-950 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> Featured Editor
                    </span>
                    <h3 className="font-display text-lg font-bold text-white leading-tight">
                      {featuredEditor.name}
                    </h3>
                  </div>

                  <div className="relative z-10 pt-4 flex items-center justify-between">
                    {featuredEditor.videoId && (
                      <button
                        onClick={() =>
                          setVideoModalData({
                            isOpen: true,
                            videoId: featuredEditor.videoId,
                            title: `${featuredEditor.name}'s Reel`,
                            editorName: featuredEditor.name,
                            specialty: featuredEditor.specialty,
                            rate: featuredEditor.rateLabel,
                          })
                        }
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all"
                      >
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedFormat('all')}
                      className="px-4 py-2 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-lime-400 transition-colors inline-flex items-center gap-1.5 shadow-md ml-auto"
                    >
                      All Editors ({filteredEditors.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

            </div>
          </>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      <VideoPlayerModal
        isOpen={isPreviewOpen || videoModalData.isOpen}
        videoId={videoModalData.videoId}
        title={videoModalData.title}
        editorName={selectedEditor?.name || videoModalData.editorName}
        specialty={selectedEditor?.specialty || videoModalData.specialty}
        rate={selectedEditor?.rateLabel || videoModalData.rate}
        editor={
          selectedEditor
            ? {
                full_name: selectedEditor.name,
                specialty_tag: selectedEditor.specialty,
                base_rate: selectedEditor.rate,
                turnaround_time: selectedEditor.turnaround,
              }
            : undefined
        }
        portfolioItem={selectedPortfolioItem || undefined}
        onClose={() => {
          setIsPreviewOpen(false)
          setVideoModalData({ ...videoModalData, isOpen: false })
        }}
        onOpenBrief={() =>
          openBriefModal(
            selectedEditor?.name || videoModalData.editorName,
            selectedEditor?.specialty || videoModalData.specialty,
            selectedEditor?.rateLabel || videoModalData.rate
          )
        }
      />

      {briefModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200">
            <button
              onClick={() => setBriefModalData({ ...briefModalData, isOpen: false })}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {briefSuccessMsg ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-zinc-900">
                  Brief Sent to {briefModalData.editorName}!
                </h3>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                  {briefSuccessMsg}
                </p>
                <button
                  onClick={() => setBriefModalData({ ...briefModalData, isOpen: false })}
                  className="mt-4 px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendBriefSubmit} className="space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-lime-100 text-lime-800 mb-2">
                    Send Project Brief
                  </span>
                  <h3 className="font-display text-2xl font-extrabold text-zinc-900">
                    Hire {briefModalData.editorName}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Specialty: <span className="font-semibold text-zinc-700">{briefModalData.specialty}</span> • Rate: <span className="font-semibold text-zinc-700">{briefModalData.rate}</span>
                  </p>
                </div>

                {briefErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {briefErrorMsg}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Format Needed
                    </label>
                    <select
                      value={briefFormat}
                      onChange={(e) => setBriefFormat(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    >
                      <option>Shorts / Reels (Vertical 9:16)</option>
                      <option>YouTube Video (Horizontal 16:9)</option>
                      <option>Full Channel Retainer (Both)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Your Channel / Reference Link *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://youtube.com/@yourchannel"
                      value={briefChannelUrl}
                      onChange={(e) => setBriefChannelUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Project Notes (Min 20 characters) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe your raw footage length, deadline, editing style, and expectations..."
                      value={briefNotes}
                      onChange={(e) => setBriefNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={briefSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 hover:from-lime-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-lime-400/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {briefSubmitting ? 'Sending...' : `Send Brief to ${briefModalData.editorName}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
