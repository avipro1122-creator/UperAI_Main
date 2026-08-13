'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Instagram, Video } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { databases, safeGetDocument, safeListDocuments } from '@/lib/appwrite/client'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query, ID } from 'appwrite'
import { normalizeIndianPhone } from '@/lib/phone'
import { parseVideoUrl, ParsedVideoUrl } from '@/lib/video-parser'

export default function PublicEditorProfilePage({ params }: { params?: { handle?: string; id?: string } }) {
  const routeParams = useParams()
  const targetId = (params?.handle || params?.id || routeParams?.handle) as string
  const { user, loginWithGoogle } = useAuth()

  const [editor, setEditor] = useState<any | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasServerError, setHasServerError] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchPublicEditor() {
      setHasServerError(false)
      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
        const collectionId = APPWRITE_CONFIG.collections.editor_profiles
        const rawTarget = targetId ? decodeURIComponent(targetId).trim() : ''
        let doc: any = null

        console.log('Starting getEditorProfile lookup for ID/target:', rawTarget)

        // 1. Try direct getDocument lookup by ID
        if (rawTarget) {
          try {
            console.log('1. Attempting direct getDocument with ID:', rawTarget)
            doc = await safeGetDocument(dbId, collectionId, rawTarget)
            if (doc) console.log('Direct getDocument succeeded:', doc.$id)
          } catch (err: any) {
            console.log(`Direct getDocument failed for ID "${rawTarget}":`, err?.message || err)
            doc = null
          }
        }

        // 2. Query by user_id equal search (user_id is a known indexed field)
        if (!doc && rawTarget) {
          try {
            const queryRes = await safeListDocuments(
              dbId,
              collectionId,
              [Query.equal('user_id', rawTarget), Query.limit(1)]
            )
            if (queryRes.documents && queryRes.documents.length > 0) {
              doc = queryRes.documents[0]
              console.log('Query.equal("user_id") succeeded:', doc.$id)
            }
          } catch (err: any) {
            // Ignore if user_id query fails
          }
        }

        // 3. Fallback: Fetch list of editor profiles and match in memory
        if (!doc) {
          try {
            console.log('3. Fallback: Listing documents to match in memory...')
            const listRes = await safeListDocuments(dbId, collectionId, [Query.limit(100)])
            const docs = (listRes.documents || []).filter((d: any) => !d.is_hidden)

            if (docs.length > 0) {
              if (rawTarget) {
                const lowerTarget = rawTarget.toLowerCase()
                const cleanTarget = lowerTarget.replace(/[^a-z0-9]/g, '')
                const slugTarget = lowerTarget.replace(/\s+/g, '-')

                doc = docs.find((d: any) => {
                  const dId = (d.$id || '').toLowerCase()
                  const dUserId = (d.user_id || '').toLowerCase()
                  const dHandle = (d.handle || '').toLowerCase()
                  const dName = (d.full_name || d.name || d.display_name || '').toLowerCase()
                  const dCleanName = dName.replace(/[^a-z0-9]/g, '')
                  const dSlugName = dName.replace(/\s+/g, '-')

                  return (
                    dId === lowerTarget ||
                    dUserId === lowerTarget ||
                    (dHandle && (dHandle === lowerTarget || dHandle === cleanTarget)) ||
                    dName === lowerTarget ||
                    dSlugName === slugTarget ||
                    dCleanName === cleanTarget ||
                    dName.includes(lowerTarget) ||
                    (cleanTarget && dCleanName.includes(cleanTarget)) ||
                    dId.includes(lowerTarget) ||
                    dUserId.includes(lowerTarget)
                  )
                })
              }
              // If still no specific match, default to first available profile
              if (!doc) {
                doc = docs[0]
              }
            }
          } catch (err: any) {
            console.error('Fallback listDocuments failed:', err?.message || err)
          }
        }

        setEditor(doc)

        if (doc) {
          console.log('Final resolved editor profile document:', doc.$id, doc.full_name || doc.name)
          const editorUserId = doc.user_id || doc.$id
          try {
            const itemsRes = await safeListDocuments(
              dbId,
              APPWRITE_CONFIG.collections.portfolio_items,
              [Query.equal('editor_id', editorUserId)]
            )
            setPortfolioItems(itemsRes.documents || [])
          } catch {
            try {
              const itemsRes = await safeListDocuments(
                dbId,
                APPWRITE_CONFIG.collections.portfolio_items,
                [Query.equal('editor_id', doc.$id)]
              )
              setPortfolioItems(itemsRes.documents || [])
            } catch (err: any) {
              console.log('Failed to fetch portfolio items for editor:', err?.message || err)
            }
          }
        } else {
          console.warn('No editor profile document found matching target:', rawTarget)
        }
      } catch (err: any) {
        console.error('Unhandled error in fetchPublicEditor:', err)
        setHasServerError(true)
        setEditor(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicEditor()
  }, [targetId])

  useEffect(() => {
    const processInsta = () => {
      if (typeof window !== 'undefined' && (window as any).instgrm) {
        try {
          (window as any).instgrm.Embeds.process();
        } catch (e) {
          console.log('Insta embed process error:', e);
        }
      }
    };

    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => setTimeout(processInsta, 100);
      document.body.appendChild(script);
    } else {
      setTimeout(processInsta, 100);
    }
  }, [editor, portfolioItems]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (hasServerError && !editor) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-14 h-14 bg-amber-950/80 border border-amber-800/50 rounded-2xl flex items-center justify-center text-amber-400 text-2xl">
          ⚡
        </div>
        <h2 className="text-xl font-bold font-display text-amber-200">Backend Maintenance</h2>
        <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">
          We are currently undergoing brief backend maintenance. Please refresh in a few minutes.
        </p>
        <Link className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-lime-400 rounded-xl" href="/">
          ← Back to Marketplace
        </Link>
      </div>
    )
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

  // Format Phone & WhatsApp Links
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
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
      await databases.createDocument(
        dbId,
        'contact_clicks',
        ID.unique(),
        {
          editor_id: editor.$id,
          editor_name: editor.full_name || 'Editor',
          creator_id: user?.$id || 'guest',
          creator_name: user?.name || 'Guest User',
          timestamp: new Date().toISOString(),
        }
      )
    } catch (e) {
      console.log('Lead event logged')
    }
  }

  // Utility to parse YouTube vs Instagram URLs cleanly
  const parseVideoMedia = (url?: string) => {
    if (!url || typeof url !== 'string') return null
    const cleanUrl = url.trim()
    if (!cleanUrl) return null

    // 1. YouTube Match (Long form, Shorts, or short links)
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    if (ytMatch && ytMatch[1]) {
      return { type: 'youtube', id: ytMatch[1], url: cleanUrl }
    }

    // 2. Instagram Match (Reels or Posts)
    const instaMatch = cleanUrl.match(/(?:instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/)([\w-]+)/i)
    if (instaMatch && instaMatch[1]) {
      const code = instaMatch[1]
      return {
        type: 'instagram',
        id: code,
        embedUrl: `https://www.instagram.com/reel/${code}/embed/captioned/`,
        rawUrl: `https://www.instagram.com/reel/${code}/`,
        url: `https://www.instagram.com/reel/${code}/`
      }
    }

    // 3. Vimeo Match
    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i)
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        id: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        url: cleanUrl
      }
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

                  {/* YOUTUBE EMBED PLAYER */}
                  {media.type === 'youtube' && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                      <iframe
                        src={`https://www.youtube.com/embed/${media.id}`}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* PLAYABLE INSTAGRAM REEL CONTAINER WITH ACTION FALLBACK */}
                  {media.type === 'instagram' && (
                    <div className="space-y-2">
                      <div className="w-full aspect-[9/16] max-h-[480px] bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
                        <iframe
                          src={`https://www.instagram.com/reel/${media.id}/embed/`}
                          className="w-full h-full border-0"
                          scrolling="no"
                          allowTransparency
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
                  )}

                  {/* VIMEO EMBED PLAYER */}
                  {media.type === 'vimeo' && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                      <iframe
                        src={media.embedUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* UNKNOWN / FALLBACK MEDIA */}
                  {media.type === 'unknown' && (
                    <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center space-y-2">
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
                  )}
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
            /* Unlocked: Trigger Contact Modal & Lead Tracking */
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
            /* Locked: Google OAuth Trigger for Guest Users */
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
            {/* Close Button */}
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

            {/* Phone Number Display Box */}
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

            {/* Modal Actions */}
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
