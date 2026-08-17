'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Instagram, Video, ExternalLink } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getEditorPortfolioItems } from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/client'
import { collection, addDoc } from 'firebase/firestore'

function getGoogleDriveEmbedUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/)
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null
}

function getAspectClass(media: any): string {
  if (media.type === 'youtube') return media.isVertical ? 'aspect-[9/16]' : 'aspect-video'
  if (media.type === 'vimeo') return 'aspect-video'
  return 'aspect-[9/16]'
}

function ShowreelPlayer({ media }: { media: any }) {
  const containerClass = `relative w-full ${getAspectClass(media)} rounded-xl overflow-hidden bg-black/60 border border-white/10`

  if (media.type === 'instagram') {
    return (
      <div className="space-y-2">
        <div className={`${containerClass} max-h-[480px]`}>
          <iframe
            src={`https://www.instagram.com/reel/${media.id}/embed/`}
            className="w-full h-full border-0"
            scrolling="no"
            allowTransparency
            title="Instagram Reel Preview"
          />
        </div>
        <a
          href={media.rawUrl || media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 hover:opacity-90 text-white font-black text-[11px] text-center rounded-xl uppercase tracking-wider transition-all shadow-md"
        >
          Open Reel on Instagram ↗
        </a>
      </div>
    )
  }

  if (media.type === 'unknown') {
    return (
      <div className={`${containerClass} flex flex-col items-center justify-center p-4 text-center space-y-2`}>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">External Portfolio Link</span>
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-xl transition-all shadow-md"
        >
          Open Portfolio Website ↗
        </a>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {media.type === 'drive' && (
        <iframe
          src={media.embedUrl}
          loading="lazy"
          title="Google Drive Video Preview"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full rounded-xl border-0"
        />
      )}

      {media.type === 'youtube' && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${media.id}?rel=0&modestbranding=1`}
          loading="lazy"
          title="YouTube Video Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full rounded-xl border-0"
        />
      )}

      {media.type === 'vimeo' && (
        <iframe
          src={media.embedUrl}
          loading="lazy"
          title="Vimeo Video Preview"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-xl border-0"
        />
      )}

      {media.type === 'direct' && (
        <video
          src={media.directUrl || media.url}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-cover rounded-xl"
        />
      )}

      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open original link in a new tab"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-sm border border-white/15 text-white/80 hover:text-lime-400 hover:border-lime-400/40 flex items-center justify-center transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

interface EditorProfileClientProps {
  initialEditor: any
  initialPortfolioItems: any[]
}

export default function EditorProfileClient({
  initialEditor,
  initialPortfolioItems,
}: EditorProfileClientProps) {
  const { user, loginWithGoogle } = useAuth()
  const [editor] = useState<any>(initialEditor)
  const [portfolioItems, setPortfolioItems] = useState<any[]>(initialPortfolioItems || [])
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function refreshItems() {
      if (editor && (!initialPortfolioItems || initialPortfolioItems.length === 0)) {
        const items = await getEditorPortfolioItems(editor.user_id || editor.id)
        if (items && items.length > 0) {
          setPortfolioItems(items)
        }
      }
    }
    refreshItems()
  }, [editor, initialPortfolioItems])

  useEffect(() => {
    const processInsta = () => {
      if (typeof window !== 'undefined' && (window as any).instgrm) {
        try {
          (window as any).instgrm.Embeds.process()
        } catch (e) {
          console.log('Insta embed process error:', e)
        }
      }
    }

    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script')
      script.id = 'instagram-embed-script'
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => setTimeout(processInsta, 100)
      document.body.appendChild(script)
    } else {
      setTimeout(processInsta, 100)
    }
  }, [editor, portfolioItems])

  const formatTurnaround = (val?: string | number | null) => {
    if (!val) return '2 Days'
    const str = String(val).trim()
    const numMatch = str.match(/\d+/)
    if (numMatch) {
      const num = numMatch[0]
      return `${num} ${Number(num) === 1 ? 'Day' : 'Days'}`
    }
    if (/hour/i.test(str)) return str
    return str.replace(/ays?/i, 'Days').replace(/days?/i, 'Days')
  }

  if (!editor) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center space-y-4">
        <p className="text-zinc-400 text-sm font-bold">Editor profile not found.</p>
        <Link className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-lime-400 rounded-xl" href="/">
          ← Back to Marketplace
        </Link>
      </div>
    )
  }

  const rawDigits = (editor.whatsapp_number || editor.whatsapp || '').toString().replace(/\D/g, '')
  const rawPhone = rawDigits.length >= 10 ? rawDigits : '919016047119'
  const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : `+${rawPhone}`
  const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone

  const whatsappMessage = encodeURIComponent(
    `Hi ${editor.full_name || 'Editor'}, I saw your portfolio on UperAI and would like to discuss a video project with you.`
  )
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${whatsappMessage}` : '#'

  const handleCopyNumber = () => {
    if (!rawPhone) return
    navigator.clipboard.writeText(displayPhone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTrackLead = async () => {
    try {
      if (editor) {
        await addDoc(collection(db, 'contact_clicks'), {
          editor_id: editor.user_id || editor.id || 'unknown',
          editor_name: editor.full_name || editor.name || 'Editor',
          creator_id: user?.uid || user?.$id || 'guest',
          creator_name: user?.displayName || user?.name || 'Guest User',
          timestamp: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.log('Lead event logged')
    }
  }

  const parseVideoMedia = (url?: string) => {
    if (!url || typeof url !== 'string') return null
    const cleanUrl = url.trim()
    if (!cleanUrl) return null

    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    if (ytMatch && ytMatch[1]) {
      const isShorts = /youtube\.com\/shorts\//i.test(cleanUrl)
      return { type: 'youtube', id: ytMatch[1], url: cleanUrl, isVertical: isShorts }
    }

    const instaMatch = cleanUrl.match(/(?:instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/)([\w-]+)/i)
    if (instaMatch && instaMatch[1]) {
      const code = instaMatch[1]
      return {
        type: 'instagram',
        id: code,
        embedUrl: `https://www.instagram.com/reel/${code}/embed/captioned/`,
        rawUrl: `https://www.instagram.com/reel/${code}/`,
        url: `https://www.instagram.com/reel/${code}/`,
      }
    }

    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i)
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        id: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        url: cleanUrl,
      }
    }

    const driveEmbedUrl = getGoogleDriveEmbedUrl(cleanUrl)
    if (driveEmbedUrl) {
      return { type: 'drive', embedUrl: driveEmbedUrl, url: cleanUrl }
    }

    if (/dropbox\.com\/s\//i.test(cleanUrl)) {
      const directUrl = cleanUrl
        .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
        .replace(/[?&]dl=0/, '')
      return { type: 'direct', id: directUrl, directUrl, url: cleanUrl }
    }

    if (/\.(mp4|webm|mov|mkv|m4v|avi)(\?.*)?$/i.test(cleanUrl)) {
      return { type: 'direct', id: cleanUrl, directUrl: cleanUrl, url: cleanUrl }
    }

    if (/appwrite\.io\/v1\/storage/i.test(cleanUrl) || /cloud\.appwrite\.io\/v1\/storage/i.test(cleanUrl)) {
      return { type: 'direct', id: cleanUrl, directUrl: cleanUrl, url: cleanUrl }
    }

    return { type: 'unknown', url: cleanUrl }
  }

  const rawShowreelUrls = [
    editor?.youtube_url1,
    editor?.youtube_url,
    editor?.youtube_url2,
    editor?.youtube_url3,
    editor?.showreel_url,
    editor?.video_url,
    editor?.video_url1,
    editor?.video_url2,
    editor?.video_url3,
    ...(Array.isArray(portfolioItems) ? portfolioItems.map((pi: any) => pi?.youtube_url || pi?.video_url || pi?.url) : []),
  ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)

  const uniqueShowreelUrls = Array.from(new Set(rawShowreelUrls))
  const parsedVideos = uniqueShowreelUrls
    .map(parseVideoMedia)
    .filter((item): item is NonNullable<ReturnType<typeof parseVideoMedia>> => item !== null)

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Link className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all" href="/">
          ← Back to Marketplace
        </Link>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-600 to-lime-500 rounded-3xl p-8 text-black shadow-2xl space-y-2">
          <span className="bg-black text-lime-400 text-[10px] font-black uppercase px-3 py-1 rounded-full">
            {editor?.specialty_tag || 'VIDEO EDITOR'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">HELLO!! I'M {editor?.full_name?.toUpperCase() || 'EDITOR'}</h1>
          <p className="font-bold text-sm opacity-90">Verified Indian Video Editor • High Impact Showreels</p>
        </div>

        {/* Featured Work Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-lime-400 font-display">Featured Work & Showreels ({parsedVideos.length})</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
            {parsedVideos.length > 0 ? (
              parsedVideos.map((media: any, index: number) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Showreel #{index + 1}</span>
                    <span className="text-[10px] font-bold text-lime-400 bg-lime-950 border border-lime-800/50 px-2 py-0.5 rounded-full uppercase">
                      {media.type}
                    </span>
                  </div>

                  <ShowreelPlayer media={media} />
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-zinc-500 text-xs bg-zinc-900 border border-zinc-800 rounded-2xl">
                No showreels linked yet.
              </div>
            )}
          </div>
        </div>

        {/* Selected Work & Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">SPECIALTY</p>
            <p className="text-base text-white mt-1">{editor.specialty_tag || 'Gaming Videos'}</p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">BASE RATE</p>
            <p className="text-xl text-yellow-300 font-black mt-1">₹{Number(editor.base_rate || 1500).toLocaleString()} / Video</p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">TURNAROUND</p>
            <p className="text-base text-white mt-1">{formatTurnaround(editor.turnaround_time)}</p>
          </div>
        </div>

        {/* Contact CTA Block (Gated Behind Login) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <h3 className="text-2xl font-black font-display">LET'S CREATE SOMETHING GREAT!</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {user
              ? 'Have a project in mind? Connect directly with this editor.'
              : 'Sign in to access direct WhatsApp contacts and hire verified editors.'}
          </p>

          {user ? (
            <button
              onClick={() => {
                setIsContactModalOpen(true)
                handleTrackLead()
              }}
              className="inline-block px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              CONTACT ME ON WHATSAPP →
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2 px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              LOG IN TO CONTACT ON WHATSAPP 🔒
            </button>
          )}
        </div>
      </main>

      {/* CONTACT DETAILS POP-UP MODAL */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-6 relative shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all text-xs font-bold"
            >
              ✕
            </button>

            <div className="space-y-1 text-center">
              <span className="text-[10px] font-bold text-lime-400 bg-lime-950 border border-lime-800/50 px-2.5 py-1 rounded-full uppercase">
                DIRECT CONTACT UNLOCKED
              </span>
              <h3 className="text-xl font-black text-white pt-2">{editor.full_name}</h3>
              <p className="text-zinc-400 text-xs">Reach out directly via phone or WhatsApp</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">WhatsApp / Phone Number</p>
                <p className="text-base font-black text-white">{displayPhone}</p>
              </div>
              <button
                onClick={handleCopyNumber}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-lime-400 text-xs font-bold rounded-xl transition-all border border-zinc-700"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs text-center rounded-xl uppercase tracking-wider shadow-lg transition-all"
              >
                Open Chat on WhatsApp 💬
              </a>

              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl transition-all"
              >
                Stay on UperAI Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
