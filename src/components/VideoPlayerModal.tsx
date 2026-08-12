'use client'

import { X, Send, Sparkles } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-parser'

export interface PreviewModalEditor {
  full_name?: string
  name?: string
  specialty_tag?: string
  specialty?: string
  base_rate?: number | string
  rate?: string
  turnaround_time?: string
  turnaround?: string
  format?: string
  city_location?: string
  videoId?: string
  youtubeUrl?: string
}

export interface PreviewModalPortfolioItem {
  title?: string
  role_explanation?: string
  role_description?: string
  video_url?: string
  youtube_url?: string
  video_id?: string
}

export interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenBrief?: () => void
  videoId?: string | null
  title?: string | null
  editorName?: string
  specialty?: string
  rate?: string
  turnaroundTime?: string | null
  roleExplanation?: string | null
  editor?: PreviewModalEditor
  portfolioItem?: PreviewModalPortfolioItem
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  onOpenBrief,
  videoId,
  title,
  editorName,
  specialty,
  rate,
  turnaroundTime,
  roleExplanation,
  editor,
  portfolioItem,
}: VideoPlayerModalProps) {
  const targetVideoId = editor?.videoId || videoId || portfolioItem?.video_id
  const targetVideoUrl = editor?.youtubeUrl || portfolioItem?.video_url || portfolioItem?.youtube_url || targetVideoId || ''
  
  const parsed = parseVideoUrl(targetVideoUrl)
  
  const embedSrc = parsed
    ? (parsed.sourceType === 'youtube' ? `${parsed.embedUrl}?autoplay=1` : parsed.embedUrl)
    : (targetVideoId ? `https://www.youtube.com/embed/${targetVideoId}?autoplay=1` : '')

  if (!isOpen) return null

  const fullName = editor?.full_name || editor?.name || editorName || 'Editor'
  const clipTitle = portfolioItem?.title || title || `${fullName}'s Edit Preview`
  const specialtyTag = editor?.specialty_tag || editor?.specialty || specialty || 'Video Editing Specialist'
  const baseRateLabel =
    editor?.base_rate != null
      ? `₹${Number(editor.base_rate).toLocaleString()} / Video`
      : rate || 'Rates upfront'
  const turnaroundLabel = editor?.turnaround_time || editor?.turnaround || turnaroundTime || null
  const clipExplanation =
    portfolioItem?.role_explanation || portfolioItem?.role_description || roleExplanation || null

  const isVertical = parsed?.isShortsUrl || parsed?.sourceType === 'instagram'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-full max-w-5xl bg-zinc-950 text-white rounded-t-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col lg:flex-row max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors"
          title="Close player"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Column */}
        <div className="flex-1 bg-black flex flex-col justify-center min-h-[260px] sm:min-h-[360px] p-2">
          <div className={`relative w-full ${isVertical ? 'aspect-[9/16] max-h-[75vh] mx-auto' : 'aspect-video'}`}>
            <iframe
              src={embedSrc}
              title={clipTitle}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Sidebar Info & CTA */}
        <div className="w-full lg:w-[340px] p-6 bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-lime-400/20 text-lime-400 border border-lime-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Style Audition
            </span>

            <div>
              <h3 className="font-display text-xl font-bold text-white leading-tight">
                {clipTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5">
                Edited by <span className="font-semibold text-zinc-200">{fullName}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Specialty</span>
                <span className="font-semibold text-zinc-200">{specialtyTag}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Base Rate</span>
                <span className="font-bold text-lime-400">{baseRateLabel}</span>
              </div>
              {turnaroundLabel && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Turnaround</span>
                  <span className="font-medium text-zinc-300">{turnaroundLabel}</span>
                </div>
              )}
              {clipExplanation && (
                <div className="pt-2.5 border-t border-zinc-800 text-xs text-zinc-300 italic leading-relaxed">
                  "{clipExplanation}"
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                onClose()
                if (onOpenBrief) onOpenBrief()
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 hover:from-lime-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-400/10"
            >
              <Send className="w-4 h-4" /> Send Brief for This Style
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const PreviewModal = VideoPlayerModal
