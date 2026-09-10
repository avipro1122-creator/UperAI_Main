'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-parser'
import { resolveThumbnailUrl, isInstagramUrl } from '@/lib/thumbnail-resolver'

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

  // User-provided link resolution (Google Drive, direct image, YouTube, Instagram)
  const parsedVideo = editor.raw_video_url ? parseVideoUrl(editor.raw_video_url) : null

  // Dynamic Instagram cover extraction state
  const [instaThumbnail, setInstaThumbnail] = useState<string | null>(null)
  const [isLoadingInsta, setIsLoadingInsta] = useState(false)

  useEffect(() => {
    const rawLink =
      (isInstagramUrl(editor.raw_video_url) ? editor.raw_video_url : null) ||
      (isInstagramUrl(editor.thumbnail_url) ? editor.thumbnail_url : null)

    if (!rawLink) {
      setInstaThumbnail(null)
      return
    }

    let isMounted = true
    setIsLoadingInsta(true)

    fetch(`/api/get-reel-thumbnail?url=${encodeURIComponent(rawLink)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.thumbnailUrl) {
          setInstaThumbnail(data.thumbnailUrl)
        }
      })
      .catch(() => {
        // Fallback placeholder handled on render
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingInsta(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [editor.raw_video_url, editor.thumbnail_url])

  // Resolve direct thumbnail using link resolver utility (Drive, YouTube, direct image, Vimeo)
  const resolvedDirectThumbnail =
    resolveThumbnailUrl(editor.thumbnail_url) ||
    resolveThumbnailUrl(editor.raw_video_url)

  const fallbackThumbnail =
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'

  const finalThumbnail =
    instaThumbnail ||
    resolvedDirectThumbnail ||
    parsedVideo?.thumbnailUrl ||
    fallbackThumbnail

  const softwareTags = Array.isArray(editor.softwareTags) ? editor.softwareTags.filter(Boolean).slice(0, 2) : []

  const formatTagStyle = (editor.format_tag && FORMAT_TAG_STYLES[editor.format_tag]) || 'bg-neutral-100 text-neutral-800 border-neutral-200'

  return (
    <Link
      href={`/editors/${targetIdOrHandle}`}
      className="group relative block rounded-2xl overflow-hidden bg-white hover:bg-white border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white will-change-transform"
    >
      {/* ── Video Thumbnail ────────────────────────────────── */}
      <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalThumbnail}
          alt={`${editor.name || 'Editor'} video thumbnail`}
          loading="lazy"
          decoding="async"
          width={380}
          height={214}
          onError={(e) => {
            e.currentTarget.src = fallbackThumbnail
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
            isLoadingInsta ? 'animate-pulse opacity-75' : 'opacity-100'
          }`}
        />

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
