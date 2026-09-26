'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Instagram, Video, ExternalLink, Loader2, Sparkles, Globe, Maximize2, X, Laptop, Smartphone, Star } from 'lucide-react'
import TestimonialsSection from '@/components/TestimonialsSection'
import { useAuth } from '@/context/AuthContext'
import { getEditorPortfolioItems } from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/client'
import { collection, addDoc } from 'firebase/firestore'
import PaywallModal from '@/components/PaywallModal'
import ProfileVideoPlayer from '@/components/ProfileVideoPlayer'
import { formatGoogleDrivePreviewUrl } from '@/lib/gdrive'
import { getUserRating, submitEditorRating } from '@/lib/firebase/ratings'

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

function parseDriveMedia(url: string): { type: 'drive'; isFolder: boolean; id: string; embedUrl: string | null; url: string } | null {
  if (!/drive\.google\.com|docs\.google\.com/i.test(url)) return null

  const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`

  if (url.includes('16CSkbkvGddJODiCZ6tECVCxSH8bKkAaY') || url.includes('1IydmaQ1n0zznXmI8Vfy3EmyzdO3Hyrsa')) {
    return {
      type: 'drive',
      isFolder: false,
      id: '1IydmaQ1n0zznXmI8Vfy3EmyzdO3Hyrsa',
      embedUrl: 'https://drive.google.com/file/d/1IydmaQ1n0zznXmI8Vfy3EmyzdO3Hyrsa/preview',
      url: cleanUrl,
    }
  }

  // Check for Drive Folder
  const folderMatch = cleanUrl.match(/(?:drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?folders\/|folderview\?id=))([a-zA-Z0-9_-]+)/i)
  if (folderMatch && folderMatch[1]) {
    return {
      type: 'drive',
      isFolder: true,
      id: folderMatch[1],
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`,
      url: cleanUrl,
    }
  }

  // Check for Drive File
  const fileMatch = cleanUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=))([a-zA-Z0-9_-]+)/i)
  if (fileMatch && fileMatch[1]) {
    return {
      type: 'drive',
      isFolder: false,
      id: fileMatch[1],
      embedUrl: `https://drive.google.com/file/d/${fileMatch[1]}/preview`,
      url: cleanUrl,
    }
  }

  return {
    type: 'drive',
    isFolder: true,
    id: '',
    embedUrl: null,
    url: cleanUrl,
  }
}

function getAspectClass(media: any): string {
  if (media.type === 'youtube') return media.isVertical ? 'aspect-[9/16]' : 'aspect-video'
  if (media.type === 'vimeo') return 'aspect-video'
  if (media.type === 'drive') return media.isFolder ? 'aspect-auto' : 'aspect-video'
  if (media.type === 'website' || media.type === 'unknown') return 'aspect-[16/10] min-h-[340px]'
  return 'aspect-[9/16]'
}

function DrivePreview({ media }: { media: any }) {
  const driveUrl = media.rawUrl || media.url
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl" suppressHydrationWarning>
      {/* Drive Icon with glow */}
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center p-3.5 shadow-xl">
        <GoogleDriveIcon className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/50 text-[11px] font-bold text-blue-400 uppercase tracking-wide">
          <GoogleDriveIcon className="w-3.5 h-3.5" />
          Google Drive Portfolio
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Editor&apos;s Google Drive Portfolio
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Google Drive requires your Google account to view. Click below to open directly in Google Drive in one click:
        </p>
      </div>

      <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-blue-500/30 active:scale-95 group"
      >
        <GoogleDriveIcon className="w-5 h-5" />
        <span>Open Drive Portfolio (1-Click) ↗</span>
      </a>

      <span className="text-[11px] text-zinc-500">
        Opens in a new tab for instant Google account selection
      </span>
    </div>
  )
}

function WebsitePreview({ media }: { media: any }) {
  if (/drive\.google\.com|docs\.google\.com/i.test(media.url || '')) {
    return <DrivePreview media={media} />
  }

  const hostname = (() => {
    try {
      return new URL(media.url).hostname.replace(/^www\./, '')
    } catch {
      return media.url
    }
  })()

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center space-y-5 shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center p-3.5 shadow-xl">
        <Globe className="w-9 h-9 text-lime-400" />
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-950/80 border border-lime-800/50 text-[11px] font-bold text-lime-400 uppercase tracking-wide">
          <Globe className="w-3.5 h-3.5" />
          {hostname}
        </div>
        <h3 className="text-xl font-black text-white">
          External Portfolio Website
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-mono truncate max-w-sm">
          {media.url}
        </p>
      </div>

      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-lime-400/25 active:scale-95 group"
      >
        <span>Open Portfolio Website (1-Click)</span>
        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </a>

      <span className="text-[11px] text-zinc-500">
        Opens external portfolio in a new tab
      </span>
    </div>
  )
}

function ShowreelPlayer({ media }: { media: any }) {
  const containerClass = `relative w-full ${getAspectClass(media)} rounded-xl overflow-hidden bg-black/60 border border-white/10`

  if (media.type === 'drive' || /drive\.google\.com|docs\.google\.com/i.test(media.url || '')) {
    const targetUrl = media.url || media.rawUrl || (media.id ? `https://drive.google.com/file/d/${media.id}/view` : '')
    if (!media.isFolder && formatGoogleDrivePreviewUrl(targetUrl)) {
      return <ProfileVideoPlayer videoUrl={targetUrl} />
    }
    return <DrivePreview media={media} />
  }

  if (media.type === 'website' || media.type === 'unknown') {
    return <WebsitePreview media={media} />
  }

  if (media.type === 'instagram') {
    return (
      <div className="space-y-2">
        <div className={`${containerClass} max-h-[480px]`}>
          <iframe
            src={`https://www.instagram.com/reel/${media.id}/embed/`}
            className="w-full h-full border-0"
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
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

  return (
    <div className={containerClass}>

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
  const { user, rawUser, loginWithGoogle } = useAuth()
  const [editor] = useState<any>(initialEditor)
  const [portfolioItems, setPortfolioItems] = useState<any[]>(initialPortfolioItems || [])
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false)
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null)
  const [unlockRemaining, setUnlockRemaining] = useState<number | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Rating States & Logic
  const editorTargetId = editor?.user_id || editor?.id || editor?.handle || ''
  const isSelfProfile = Boolean(
    user?.uid && (user.uid === editor?.user_id || user.uid === editor?.id)
  )
  const [ratingAvg, setRatingAvg] = useState<number | null>(
    editor?.rating_avg != null ? Number(editor.rating_avg) : null
  )
  const [ratingCount, setRatingCount] = useState<number>(
    editor?.rating_count != null ? Number(editor.rating_count) : 0
  )
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [hasRated, setHasRated] = useState<boolean>(false)
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false)
  const [ratingMessage, setRatingMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Fetch user's existing rating on load
  useEffect(() => {
    async function loadUserRating() {
      if (!user?.uid || !editorTargetId) return
      try {
        const existing = await getUserRating(editorTargetId, user.uid)
        if (existing) {
          setSelectedRating(existing.rating)
          setHasRated(true)
        }
      } catch (err) {
        console.error('Failed to load user rating:', err)
      }
    }
    loadUserRating()
  }, [user?.uid, editorTargetId])

  const handleRatingSubmit = async () => {
    if (!user) {
      await loginWithGoogle()
      return
    }

    if (user.uid === editor?.user_id || user.uid === editor?.id) {
      setRatingMessage({ type: 'error', text: 'You cannot rate your own editor profile.' })
      return
    }

    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setRatingMessage({ type: 'error', text: 'Please select a rating between 1 and 5 stars.' })
      return
    }

    setIsSubmittingRating(true)
    setRatingMessage(null)

    try {
      const res = await submitEditorRating(
        editorTargetId,
        selectedRating
      )
      setRatingAvg(res.rating_avg)
      setRatingCount(res.rating_count)
      setHasRated(true)
      setRatingMessage({
        type: 'success',
        text: res.isUpdate
          ? `Your rating has been updated to ${selectedRating} stars!`
          : `Thank you! Your ${selectedRating}-star rating has been recorded.`,
      })
    } catch (err: any) {
      console.error('Failed to submit rating:', err)
      setRatingMessage({
        type: 'error',
        text: err?.message || 'Failed to submit rating. Please try again.',
      })
    } finally {
      setIsSubmittingRating(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (!val) {
      if (editor?.turnaround_days) {
        const d = Number(editor.turnaround_days)
        return `${d} ${d === 1 ? 'Day' : 'Days'}`
      }
      return '24-48 Hours'
    }
    const str = String(val).trim()
    if (!str) return '24-48 Hours'

    // If it already specifies hours (e.g., "24 Hours", "24-48 Hours", "48 Hours", "24h")
    if (/hour|hr|h\b/i.test(str)) {
      return str
    }

    // If it specifies days (e.g., "2 Days", "1-2 Days", "3-4 Days", "1 Day")
    if (/day/i.test(str)) {
      return str
    }

    // If it specifies weeks (e.g., "1 Week")
    if (/week/i.test(str)) {
      return str
    }

    // If it's a pure number (e.g. 2, "2", 1)
    if (/^\d+$/.test(str)) {
      const num = Number(str)
      return `${num} ${num === 1 ? 'Day' : 'Days'}`
    }

    return str
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

  const rawDigits = (unlockedPhone || editor.whatsapp_number || editor.whatsapp || '').toString().replace(/\D/g, '')
  const rawPhone = rawDigits.length >= 10 ? rawDigits : '919016047119'
  const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : `+${rawPhone}`
  const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone

  const rawInsta = (editor.instagram_handle || editor.instagram || '').toString().trim().replace(/^@/, '')
  const cleanInstagram = rawInsta && !rawInsta.includes('@') ? rawInsta : null
  const instagramUrl = cleanInstagram ? `https://instagram.com/${cleanInstagram}` : null

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

  const handleContactClick = async () => {
    if (!user) {
      loginWithGoogle()
      return
    }

    setIsUnlocking(true)
    try {
      const token = (user as any)?.token || (await (user as any)?.getIdToken?.()) || ''
      const googleSub =
        rawUser?.providerData?.find((p) => p.providerId === 'google.com')?.uid ||
        (rawUser as any)?.reloadUserInfo?.localId ||
        user?.uid ||
        ''

      const res = await fetch('/api/contacts/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-uid': user.uid,
          ...(googleSub ? { 'x-google-sub': googleSub } : {}),
        },
        body: JSON.stringify({
          editorId: editor.user_id || editor.id || editor.handle,
          userId: user.uid,
          googleSub,
        }),
      })

      const data = await res.json()

      if (
        res.status === 403 ||
        res.status === 402 ||
        data.reason === 'subscription_required' ||
        data.error === 'PAYWALL_REQUIRED'
      ) {
        setIsPaywallModalOpen(true)
        return
      }

      if (data.success && data.phone) {
        setUnlockedPhone(data.phone)
        if (typeof data.freeRemaining === 'number') {
          setUnlockRemaining(data.freeRemaining)
        }
        setIsContactModalOpen(true)
        handleTrackLead()
      } else {
        setIsPaywallModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to unlock contact:', err)
      setIsPaywallModalOpen(true)
    } finally {
      setIsUnlocking(false)
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

    if (/drive\.google\.com|docs\.google\.com/i.test(cleanUrl)) {
      const driveMedia = parseDriveMedia(cleanUrl)
      if (driveMedia) return driveMedia
      return {
        type: 'drive',
        isFolder: /\/folders\/|folderview/i.test(cleanUrl),
        id: '',
        embedUrl: null,
        url: cleanUrl,
      }
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

    let finalUrl = cleanUrl
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }
    return { type: 'website', url: finalUrl }
  }

  const rawShowreelUrls = [
    editor?.videoUrl,
    editor?.video_url,
    editor?.video_url1,
    editor?.video_url2,
    editor?.video_url3,
    editor?.raw_video_url,
    editor?.youtube_url1,
    editor?.youtube_url,
    editor?.youtube_url2,
    editor?.youtube_url3,
    editor?.showreel_url,
    editor?.profile?.videoUrl,
    ...(Array.isArray(portfolioItems) ? portfolioItems.map((pi: any) => pi?.youtube_url || pi?.video_url || pi?.url || pi?.videoUrl) : []),
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
        <div className="bg-gradient-to-r from-yellow-500 via-amber-600 to-lime-500 rounded-3xl p-8 text-black shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black text-lime-400 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              {editor?.specialty_tag || 'VIDEO EDITOR'}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-wide shadow-md">
              <span className="text-amber-400">★</span>
              <span>
                {ratingCount > 0 && ratingAvg != null
                  ? `${Number(ratingAvg).toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'review' : 'reviews'})`
                  : '★ New'}
              </span>
            </div>
            {cleanInstagram && (
              <a
                href={instagramUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-zinc-900 text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-md hover:scale-105"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>@{cleanInstagram}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            <span className="text-black">HELLO!! I&apos;M </span>
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
              {editor?.full_name?.toUpperCase() || editor?.name?.toUpperCase() || 'EDITOR'}
            </span>
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="font-bold text-sm opacity-90">Verified Indian Video Editor • High Impact Showreels</p>
            {ratingCount > 0 && ratingAvg != null && (
              <div className="flex items-center gap-1 text-black font-extrabold text-xs bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/10">
                <span className="text-amber-500">★</span>
                <span>{Number(ratingAvg).toFixed(1)} / 5.0 Rating</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Work Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-lime-400 font-display">Featured Work & Showreels ({parsedVideos.length})</h2>

          <div className={`grid ${parsedVideos.length === 1 && (parsedVideos[0].type === 'website' || (parsedVideos[0].type === 'drive' && (parsedVideos[0] as any)?.isFolder)) ? 'grid-cols-1 max-w-2xl mx-auto' : parsedVideos.length === 1 ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-6 items-start`}>
            {parsedVideos.length > 0 ? (
              parsedVideos.map((media: any, index: number) => {
                const isDrive = media.type === 'drive' || /drive\.google\.com|docs\.google\.com/i.test(media.url || '')
                const isWebsite = !isDrive && (media.type === 'website' || media.type === 'unknown')
                return (
                  <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl" suppressHydrationWarning>
                    <div className="flex items-center justify-between" suppressHydrationWarning>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase" suppressHydrationWarning>
                        {isDrive
                          ? 'Google Drive Portfolio'
                          : isWebsite
                            ? 'Portfolio Website'
                            : `Showreel #${index + 1}`}
                      </span>
                      {isWebsite && (
                        <span className="text-[10px] font-bold text-lime-400 bg-lime-950 border border-lime-800/50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-lime-400" />
                          WEBSITE
                        </span>
                      )}
                      {isDrive && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800/50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                          <GoogleDriveIcon className="w-3 h-3" />
                          GOOGLE DRIVE
                        </span>
                      )}
                      {!isWebsite && !isDrive && (
                        <span className="text-[10px] font-bold text-lime-400 bg-lime-950 border border-lime-800/50 px-2 py-0.5 rounded-full uppercase">
                          {media.type}
                        </span>
                      )}
                    </div>

                    <ShowreelPlayer media={media} />
                  </div>
                )
              })
            ) : (
              <div className="col-span-3">
                <ProfileVideoPlayer videoUrl={editor?.videoUrl || editor?.video_url || editor?.raw_video_url} />
              </div>
            )}
          </div>
        </div>

        {/* Rate This Editor Component */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle ambient accent bar */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                <span>★</span>
                <span>Community Rating</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Rate {editor?.full_name || editor?.name || 'This Editor'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Have you worked with {editor?.full_name || editor?.name} or auditioned their showreels? Rate their editing quality to help creators make hiring decisions.
              </p>
            </div>

            {/* Overall Rating Score Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex sm:flex-col items-center justify-center shrink-0 min-w-[140px] text-center gap-2 sm:gap-1">
              <div className="text-3xl font-black text-amber-400 font-mono flex items-center gap-1">
                <span>★</span>
                <span>{ratingCount > 0 && ratingAvg != null ? Number(ratingAvg).toFixed(1) : 'New'}</span>
              </div>
              <p className="text-[11px] font-bold text-zinc-400">
                {ratingCount > 0
                  ? `${ratingCount} ${ratingCount === 1 ? 'creator rating' : 'creator ratings'}`
                  : 'No ratings yet'}
              </p>
            </div>
          </div>

          {/* Interactive Rating Area */}
          <div className="pt-4 border-t border-zinc-800/80">
            {isSelfProfile ? (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-center text-xs text-zinc-400 font-medium">
                👋 This is your public profile. Creators can rate and review your work here.
              </div>
            ) : !user ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-white">Sign in with Google to rate this editor</p>
                  <p className="text-xs text-zinc-400">Verified Google account required to prevent spam and ensure honest feedback.</p>
                </div>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google to Rate</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {hasRated ? 'Your Current Rating' : 'Tap to Select Rating'}
                    </p>
                    {/* 5 Clickable Stars */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isFilled = (hoveredRating || selectedRating) >= starVal
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => {
                                setSelectedRating(starVal)
                                setRatingMessage(null)
                              }}
                              onMouseEnter={() => setHoveredRating(starVal)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="p-1 rounded-lg hover:bg-zinc-800/80 transition-all transform hover:scale-110 active:scale-95 focus:outline-none"
                              title={`${starVal} star${starVal > 1 ? 's' : ''}`}
                            >
                              <span
                                className={`text-2xl sm:text-3xl transition-colors ${
                                  isFilled ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-zinc-700'
                                }`}
                              >
                                ★
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      <span className="text-xs font-extrabold text-amber-400 ml-2">
                        {(hoveredRating || selectedRating) > 0
                          ? [
                              '',
                              '1 Star (Needs Improvement)',
                              '2 Stars (Fair)',
                              '3 Stars (Good)',
                              '4 Stars (Great)',
                              '5 Stars (Exceptional)',
                            ][hoveredRating || selectedRating]
                          : 'Select stars'}
                      </span>
                    </div>
                  </div>

                  {/* Submit / Update Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRatingSubmit}
                      disabled={isSubmittingRating || !selectedRating}
                      className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 disabled:hover:bg-lime-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-2"
                    >
                      {isSubmittingRating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{hasRated ? 'Update Rating' : 'Submit Rating'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Rating Status Alert */}
                {ratingMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      ratingMessage.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                    }`}
                  >
                    <span>{ratingMessage.type === 'success' ? '✓' : '⚠'}</span>
                    <span>{ratingMessage.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Client Testimonials Section */}
        {editor?.testimonials && editor.testimonials.length > 0 && (
          <TestimonialsSection
            testimonials={editor.testimonials}
            editorName={editor?.full_name || editor?.name}
            ratingAvg={ratingAvg}
            ratingCount={ratingCount}
          />
        )}

        {/* Selected Work & Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">SPECIALTY</p>
            <p className="text-base text-white mt-1">{editor.specialty_tag || 'Gaming Videos'}</p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">BASE RATE</p>
            <p className="text-xl text-yellow-300 font-black mt-1" suppressHydrationWarning>₹{Number(editor.base_rate || 1500).toLocaleString('en-IN')} / Video</p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-5 text-center font-bold shadow-lg">
            <p className="text-xs text-blue-200 uppercase tracking-wider">TURNAROUND</p>
            <p className="text-base text-white mt-1">{formatTurnaround(editor.turnaround_time)}</p>
          </div>
        </div>

        {/* Contact CTA Block (Gated Behind Login) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <h3 className="text-2xl font-black font-display">LET'S CREATE SOMETHING GREAT!</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto" suppressHydrationWarning>
            {mounted && user
              ? 'Have a project in mind? Connect directly with this editor (3 free contacts included).'
              : 'Sign in to access 3 free direct WhatsApp contacts to hire verified editors.'}
          </p>

          {mounted && user ? (
            <button
              onClick={handleContactClick}
              disabled={isUnlocking}
              className="inline-flex items-center gap-2 px-8 py-4 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFYING ACCESS...</span>
                </>
              ) : (
                <span>CONTACT ME ON WHATSAPP / INSTAGRAM →</span>
              )}
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
              LOG IN TO CONTACT EDITOR 🔒
            </button>
          )}
        </div>
      </main>

      {/* CONTACT DETAILS POP-UP MODAL */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in fade-in zoom-in-95">
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
              <h3 className="text-xl font-black text-white pt-2">{editor.full_name || editor.name}</h3>
              <p className="text-zinc-400 text-xs">Reach out directly via WhatsApp or Instagram</p>
              {typeof unlockRemaining === 'number' && (
                <p className="text-[11px] font-semibold text-lime-400 pt-1">
                  {unlockRemaining} of 3 free contacts remaining
                </p>
              )}
            </div>

            {/* WhatsApp Contact Box */}
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

            {/* Instagram Contact Box */}
            {cleanInstagram && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Instagram Profile</p>
                    <p className="text-sm font-black text-white">@{cleanInstagram}</p>
                  </div>
                </div>
                <a
                  href={instagramUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>Open IG</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs text-center rounded-xl uppercase tracking-wider shadow-lg transition-all"
              >
                Open Chat on WhatsApp 💬
              </a>

              {cleanInstagram && (
                <a
                  href={instagramUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs text-center rounded-xl uppercase tracking-wider shadow-lg transition-all"
                >
                  Send DM on Instagram 📷
                </a>
              )}

              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl transition-all"
              >
                Stay on UperAI Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY PAYWALL MODAL */}
      <PaywallModal
        isOpen={isPaywallModalOpen}
        onClose={() => setIsPaywallModalOpen(false)}
        editorId={editor.user_id || editor.id || editor.handle}
        editorName={editor.full_name || editor.name || 'Editor'}
        freeLimit={3}
        onPaymentSuccess={(newPhone) => {
          if (newPhone) setUnlockedPhone(newPhone)
          setIsContactModalOpen(true)
        }}
      />
    </div>
  )
}
