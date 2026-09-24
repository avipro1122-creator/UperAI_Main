'use client'

import { X, Send, Sparkles, ExternalLink } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-parser'
import ProfileVideoPlayer from '@/components/ProfileVideoPlayer'
import { formatGoogleDrivePreviewUrl } from '@/lib/gdrive'

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
  editorHandle?: string | null
  editor?: PreviewModalEditor
  portfolioItem?: PreviewModalPortfolioItem
}

function GoogleDriveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
      <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.55h27.5z" fill="#00AC47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.9 10.2z" fill="#EA4335"/>
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.85 0H34.45c-1.65 0-3.2.4-4.55 1.2z" fill="#00832D"/>
      <path d="m59.8 49-13.75-24H18.7L32.45 49z" fill="#2684FC"/>
      <path d="m73.4 49-13.6-24H32.45l13.75 24z" fill="#FFBA00"/>
    </svg>
  )
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
  editorHandle,
  editor,
  portfolioItem,
}: VideoPlayerModalProps) {
  const targetVideoId = editor?.videoId || videoId || portfolioItem?.video_id
  const targetVideoUrl = editor?.youtubeUrl || portfolioItem?.video_url || portfolioItem?.youtube_url || targetVideoId || ''
  
  const parsed = parseVideoUrl(targetVideoUrl)
  const isDrive = parsed?.sourceType === 'drive' || /drive\.google\.com|docs\.google\.com/i.test(targetVideoUrl)
  
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
        <div className="flex-1 bg-zinc-950 flex flex-col justify-center min-h-[260px] sm:min-h-[360px] p-4">
          {isDrive && formatGoogleDrivePreviewUrl(targetVideoUrl) ? (
            <ProfileVideoPlayer videoUrl={targetVideoUrl} title={clipTitle} />
          ) : isDrive ? (
            <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto py-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center p-3.5 shadow-2xl">
                <GoogleDriveIcon className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/50 text-[11px] font-bold text-blue-400 uppercase tracking-wide">
                  <GoogleDriveIcon className="w-3.5 h-3.5" />
                  Google Drive Portfolio
                </span>
                <h4 className="text-xl font-black text-white">{fullName}&apos;s Shared Works</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Access high-resolution project files, client edits, raw footage, and full showreels shared on Google Drive.
                </p>
              </div>
              <a
                href={targetVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl transition-all shadow-xl hover:shadow-blue-500/25 active:scale-95 group"
              >
                <GoogleDriveIcon className="w-4 h-4" />
                <span>Click to View Drive Portfolio</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <span className="text-[11px] text-zinc-500">
                Opens directly in Google Drive with instant access to all folders & files
              </span>
            </div>
          ) : (
            <div className={`relative w-full ${isVertical ? 'aspect-[9/16] max-h-[75vh] mx-auto' : 'aspect-video'}`}>
              <iframe
                src={embedSrc}
                title={clipTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
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
            {editorHandle && (
              <a
                href={`/editors/${editorHandle}`}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 border border-zinc-700/80"
              >
                <span>View Full Profile</span>
                <span className="text-lime-400">↗</span>
              </a>
            )}
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
