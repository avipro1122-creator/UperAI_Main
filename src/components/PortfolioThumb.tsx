'use client'

import { Play, VideoOff, HardDrive } from 'lucide-react'
import { youtubeEmbedUrl } from '@/lib/youtube'
import { parseVideoUrl } from '@/lib/video-parser'
import { resolveThumbnailUrl } from '@/lib/thumbnail-resolver'

export interface PortfolioThumbItem {
  id: string
  video_id: string
  youtube_url?: string
  title: string | null
  thumbnail_url: string | null
  is_short: boolean
  is_available: boolean
  role_description: string
}

interface Props {
  item: PortfolioThumbItem
  isPlaying: boolean
  onPlay: () => void
}

// Thumbnail by default; click swaps to youtube-nocookie or gdrive preview iframe.
export default function PortfolioThumb({ item, isPlaying, onPlay }: Props) {
  const parsed = parseVideoUrl(item.youtube_url || item.video_id)
  const isDrive = parsed?.sourceType === 'drive' || (!item.thumbnail_url && !item.title && parsed?.sourceType !== 'instagram')
  const isInstagram = parsed?.sourceType === 'instagram'
  const aspectClass = (item.is_short || parsed?.isShortsUrl || isInstagram) ? 'aspect-[9/16]' : 'aspect-video'

  if (!item.is_available) {
    return (
      <div className="space-y-2">
        <div className={`${aspectClass} rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-600`}>
          <VideoOff className="w-5 h-5" />
          <span className="text-[11px]">Unavailable</span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{item.role_description}</p>
      </div>
    )
  }

  const embedSrc = parsed?.embedUrl || (isDrive
    ? `https://drive.google.com/file/d/${item.video_id}/preview`
    : youtubeEmbedUrl(item.video_id))

  return (
    <div className="space-y-2">
      <div className={`${aspectClass} rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group shadow-sm`}>
        {isPlaying ? (
          <iframe
            src={embedSrc}
            title={item.title ?? 'Video player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="w-full h-full block relative"
            aria-label={`Play ${item.title ?? 'video'}`}
          >
            {(() => {
              const displayThumb = resolveThumbnailUrl(item.thumbnail_url) || resolveThumbnailUrl(item.youtube_url) || item.thumbnail_url
              return displayThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayThumb}
                  alt={item.title ?? 'Video thumbnail'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    {isDrive ? <HardDrive className="w-5 h-5 text-sky-400" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {isDrive ? 'Google Drive Video' : 'Click to Play Video'}
                  </span>
                </div>
              )
            })()}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 text-zinc-950 ml-0.5" fill="currentColor" />
              </div>
            </div>
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 leading-snug">{item.role_description}</p>
    </div>
  )
}
