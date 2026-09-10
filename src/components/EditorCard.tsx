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

const FORMAT_TAG_STYLES: Record<string, string> = {
  Shorts: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  'Long-form': 'bg-neutral-100 text-neutral-800 border-neutral-200',
  'Long-Form': 'bg-neutral-100 text-neutral-800 border-neutral-200',
  Both: 'bg-neutral-100 text-neutral-800 border-neutral-200',
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
  if (!editor) return null

  const currencyKey = (editor.currency || 'INR').toUpperCase()
  const symbol = CURRENCY_SYMBOLS[currencyKey] ?? '₹'
  const rateLabel =
    editor.min_rate != null ? `From ${symbol}${Number(editor.min_rate).toLocaleString()}` : 'Rate not set'
  const hasRate = editor.min_rate != null
  const targetIdOrHandle = editor.id || editor.handle || 'editor'

  // Clean handle: Never show raw email address (@gmail.com, etc.)
  const rawHandle = editor.instagram_handle || editor.handle || editor.name || ''
  const cleanHandle = String(rawHandle).replace(/@.+$/, '').replace(/^@/, '').trim()

  // Video Thumbnail extraction
  const parsedVideo = editor.raw_video_url ? parseVideoUrl(editor.raw_video_url) : null
  const effectiveThumbnail =
    parsedVideo?.thumbnailUrl ||
    (editor.thumbnail_url && !editor.thumbnail_url.includes('unsplash.com') ? editor.thumbnail_url : null) ||
    editor.thumbnail_url ||
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7'

  const isInstagram = Boolean(editor.thumbnail_url?.includes('instagram.com') || (editor.format_tag === 'Shorts' && !effectiveThumbnail?.includes('youtube')))

  const softwareTags = Array.isArray(editor.softwareTags) ? editor.softwareTags.filter(Boolean).slice(0, 2) : []

  const formatTagStyle = (editor.format_tag && FORMAT_TAG_STYLES[editor.format_tag]) || 'bg-neutral-100 text-neutral-800 border-neutral-200'

  return (
    <Link
      href={`/editors/${targetIdOrHandle}`}
      className="group relative block rounded-2xl overflow-hidden bg-white hover:bg-white border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white will-change-transform"
    >
      {/* ── Video Thumbnail ────────────────────────────────── */}
      <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
        {effectiveThumbnail && effectiveThumbnail.startsWith('http') && !effectiveThumbnail.includes('instagram.com') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveThumbnail}
            alt={`${editor.name || 'Editor'} video thumbnail`}
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
            alt={`${editor.name || 'Editor'} video thumbnail`}
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

        {/* Subtle grounding vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-12 h-12 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.6)] translate-y-1 group-hover:translate-y-0 group-hover:scale-105 transition-all duration-300 font-bold">
            <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────── */}
      <div className="p-4 space-y-3 bg-white">
        {/* Avatar + Name + Clean Handle */}
        <div className="flex items-center gap-2.5">
          {editor.avatar_url && !editor.avatar_url.includes('dicebear.com') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={editor.avatar_url}
              alt={editor.name || 'Editor'}
              loading="lazy"
              decoding="async"
              width={36}
              height={36}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 text-neutral-950 font-extrabold text-xs flex items-center justify-center border border-neutral-200 shrink-0 shadow-sm">
              {editor.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900 truncate leading-tight group-hover:text-black transition-colors flex items-center gap-1.5">
              <span>{editor.name || 'Editor'}</span>
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
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
                className="inline-flex text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors items-center gap-1 mt-0.5 cursor-pointer font-medium tracking-tight"
              >
                <span>@{cleanHandle}</span>
              </span>
            )}
          </div>
        </div>

        {/* One-line description / headline */}
        {editor.headline ? (
          <p className="text-xs text-neutral-600 truncate leading-relaxed font-normal">
            {editor.headline}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 truncate leading-relaxed italic">
            Video Editor
          </p>
        )}

        {/* Format tag + rate row */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-neutral-100">
          {editor.format_tag ? (
            <span
              className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${formatTagStyle}`}
            >
              {editor.format_tag}
            </span>
          ) : (
            <span />
          )}

          <p
            className={`text-xs font-black font-mono tracking-tight shrink-0 ${hasRate ? 'text-emerald-600' : 'text-neutral-400'}`}
          >
            {rateLabel}
          </p>
        </div>
      </div>
    </Link>
  )
}
