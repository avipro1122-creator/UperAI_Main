'use client'

import React from 'react'
import { VideoOff, ExternalLink } from 'lucide-react'
import { formatGoogleDrivePreviewUrl } from '@/lib/gdrive'
import { parseVideoUrl } from '@/lib/video-parser'

export interface ProfileVideoPlayerProps {
  videoUrl?: string | null
  className?: string
  title?: string
}

export default function ProfileVideoPlayer({
  videoUrl,
  className = '',
  title = 'Video Player',
}: ProfileVideoPlayerProps) {
  // 1. Try Google Drive preview URL conversion
  const drivePreviewUrl = formatGoogleDrivePreviewUrl(videoUrl)

  if (drivePreviewUrl) {
    return (
      <div
        className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl group ${className}`}
      >
        <iframe
          src={drivePreviewUrl}
          title={title}
          className="w-full h-full border-0 rounded-xl"
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Drive"
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    )
  }

  // 2. Fallback player for other video sources (YouTube, Vimeo, Instagram, direct video)
  const parsed = parseVideoUrl(videoUrl)

  if (parsed?.sourceType === 'youtube') {
    return (
      <div
        className={`relative w-full ${parsed.isShortsUrl ? 'aspect-[9/16] max-h-[500px] mx-auto' : 'aspect-video'} rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl ${className}`}
      >
        <iframe
          src={`${parsed.embedUrl}?rel=0&modestbranding=1`}
          title={title}
          className="w-full h-full border-0 rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }

  if (parsed?.sourceType === 'vimeo') {
    return (
      <div
        className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl ${className}`}
      >
        <iframe
          src={parsed.embedUrl}
          title={title}
          className="w-full h-full border-0 rounded-xl"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }

  if (parsed?.sourceType === 'instagram') {
    return (
      <div
        className={`relative w-full aspect-[9/16] max-h-[500px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl ${className}`}
      >
        <iframe
          src={parsed.embedUrl}
          title={title}
          className="w-full h-full border-0 rounded-xl"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          loading="lazy"
        />
      </div>
    )
  }

  if (videoUrl && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(videoUrl)) {
    return (
      <div
        className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl ${className}`}
      >
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
    )
  }

  // 3. Graceful empty/invalid fallback state
  return (
    <div
      className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800 flex flex-col items-center justify-center p-6 text-center text-zinc-500 shadow-inner ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-2 shadow-sm">
        <VideoOff className="w-6 h-6" />
      </div>
      <p className="text-xs font-semibold text-zinc-300">No video preview available</p>
      <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
        {videoUrl ? 'The video link could not be loaded directly.' : 'No showreel or video has been linked to this profile yet.'}
      </p>
    </div>
  )
}

export { ProfileVideoPlayer }
