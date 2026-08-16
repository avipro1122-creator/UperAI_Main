'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Instagram, Video } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-parser'

export type FormatTag = 'Shorts' | 'Long-form' | 'Both'

export interface EditorCardData {
  id?: string
  handle: string
  name: string
  avatar_url: string | null
  headline: string | null
  min_rate: number | null
  currency: string
  thumbnail_url: string | null
  format_tag: FormatTag | null
  instagram_handle?: string | null
  specialty?: string | null
  softwareTags?: string[]
  raw_video_url?: string | null
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
}

const FORMAT_TAG_STYLES: Record<FormatTag, string> = {
  Shorts: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Long-form': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Both: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

function isDirectVideoUrl(url: string): boolean {
  return (
    /\.(mp4|webm|mov|mkv|m4v|avi)(\?.*)?$/i.test(url) ||
    /dropbox\.com\/s\//i.test(url) ||
    /appwrite\.io\/v1\/storage/i.test(url) ||
    /cloud\.appwrite\.io\/v1\/storage/i.test(url)
  )
}

function VideoFrameCapture({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = video.duration > 0 ? video.duration * (0.3 + Math.random() * 0.4) : 0
    })

    video.addEventListener('seeked', () => {
      if (cancelled) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (!ctx) { setFailed(true); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        if (!cancelled) setFrameUrl(dataUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })

    video.addEventListener('error', () => { if (!cancelled) setFailed(true) })
    video.src = src

    return () => { cancelled = true; video.src = '' }
  }, [src])

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
          <Play className="w-4 h-4 fill-zinc-600 text-zinc-600 ml-0.5" />
        </div>
        <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">Portfolio Video</span>
      </div>
    )
  }

  if (!frameUrl) {
    return <div className="w-full h-full bg-zinc-900 animate-pulse" />
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={frameUrl} alt={alt} className={className} />
}

export default function EditorCard({ editor }: { editor: EditorCardData }) {
  const symbol = CURRENCY_SYMBOLS[editor.currency] ?? editor.currency + ' '
  const rateLabel =
    editor.min_rate != null ? `From ${symbol}${editor.min_rate}` : 'Rate not set'
  const hasRate = editor.min_rate != null
  const targetIdOrHandle = editor.id || editor.handle

  // Clean handle: Never show raw email address (@gmail.com, etc.)
  const rawHandle = editor.instagram_handle || editor.handle || ''
  const cleanHandle = rawHandle.replace(/@.+$/, '').replace(/^@/, '').trim()

  // Video Thumbnail extraction (Highest priority: real submitted video thumbnail)
  const parsedVideo = parseVideoUrl(editor.raw_video_url)
  const effectiveThumbnail =
    parsedVideo?.thumbnailUrl ||
    (editor.thumbnail_url && !editor.thumbnail_url.includes('unsplash.com') ? editor.thumbnail_url : null) ||
    editor.thumbnail_url

  const isInstagram = editor.thumbnail_url?.includes('instagram.com') || (editor.format_tag === 'Shorts' && !effectiveThumbnail?.includes('youtube'))

  const softwareTags = (editor.softwareTags || []).filter(Boolean).slice(0, 2)

  return (
    <Link
      href={`/editors/${targetIdOrHandle}`}
      className="group block rounded-2xl overflow-hidden glass-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50 will-change-transform"
    >
      {/* ── Video Thumbnail ────────────────────────────────── */}
      <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
        {effectiveThumbnail && effectiveThumbnail.startsWith('http') && !effectiveThumbnail.includes('instagram.com') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveThumbnail}
            alt={`${editor.name} video thumbnail`}
            loading="lazy"
            decoding="async"
            width={380}
            height={214}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7'
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : editor.raw_video_url && isDirectVideoUrl(editor.raw_video_url) ? (
          <VideoFrameCapture
            src={editor.raw_video_url}
            alt={`${editor.name} video thumbnail`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : isInstagram ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-purple-950 via-zinc-900 to-pink-950 p-4 space-y-1.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-950/80 border border-pink-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Instagram className="w-3 h-3" /> Instagram Reel
            </span>
            <span className="text-xs text-zinc-300 font-bold">Featured Video</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
              <Play className="w-4 h-4 fill-zinc-600 text-zinc-600 ml-0.5" />
            </div>
            <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">Video Portfolio</span>
          </div>
        )}

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-11 h-11 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-lime-400/20 translate-y-1 group-hover:translate-y-0 transition-transform duration-300 font-bold">
            <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────── */}
      <div className="p-3.5 space-y-2.5">
        {/* Avatar + Name + Clean Handle (No Email) */}
        <div className="flex items-center gap-2.5">
          {editor.avatar_url && !editor.avatar_url.includes('dicebear.com') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={editor.avatar_url}
              alt={editor.name}
              loading="lazy"
              decoding="async"
              width={32}
              height={32}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              className="w-8 h-8 rounded-full object-cover border border-zinc-700/80 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 text-black font-extrabold text-xs flex items-center justify-center border border-lime-300 shrink-0 shadow-sm">
              {editor.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-100 truncate leading-tight group-hover:text-lime-300 transition-colors">
              {editor.name}
            </p>
            {cleanHandle && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (editor.instagram_handle) {
                    const inst = editor.instagram_handle.replace(/^@/, '')
                    window.open(`https://instagram.com/${inst}`, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="inline-flex text-xs text-zinc-400 hover:text-lime-400 transition-colors items-center gap-1 mt-0.5 cursor-pointer font-medium"
              >
                <span>@{cleanHandle}</span>
              </span>
            )}
          </div>
        </div>

        {/* One-line description / headline */}
        {editor.headline ? (
          <p className="text-xs text-gray-400 truncate leading-relaxed font-normal">
            {editor.headline}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 truncate leading-relaxed italic">
            Video Editor
          </p>
        )}

        {/* Niche + software badges */}
        {(editor.specialty || softwareTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {editor.specialty && (
              <span className="inline-flex items-center max-w-[140px] truncate text-[10px] font-semibold px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-300 border border-lime-400/20">
                {editor.specialty}
              </span>
            )}
            {softwareTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Format tag + rate row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
          {editor.format_tag ? (
            <span
              className={`inline-flex items-center text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${FORMAT_TAG_STYLES[editor.format_tag]}`}
            >
              {editor.format_tag}
            </span>
          ) : (
            <span />
          )}

          <p
            className={`text-xs font-extrabold shrink-0 ${hasRate ? 'text-lime-400' : 'text-zinc-600'}`}
          >
            {rateLabel}
          </p>
        </div>
      </div>
    </Link>
  )
}
