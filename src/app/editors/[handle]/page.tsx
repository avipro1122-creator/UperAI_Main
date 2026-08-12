'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import { useAuth } from '@/context/AuthContext'
import { databases } from '@/lib/appwrite/client'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query } from 'appwrite'
import { normalizeIndianPhone } from '@/lib/phone'

export default function PublicEditorProfilePage({ params }: { params: { handle?: string; id?: string } }) {
  const { user, loginWithGoogle } = useAuth()
  const targetId = params.handle || params.id || ''
  const [editor, setEditor] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPublicEditor() {
      if (!targetId) {
        setLoading(false)
        return
      }

      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
        let doc: any = null

        // 1. Try direct get document by ID
        try {
          doc = await databases.getDocument(
            dbId,
            APPWRITE_CONFIG.collections.editor_profiles,
            targetId
          )
        } catch {
          doc = null
        }

        // 2. Fallback: list documents matching user_id
        if (!doc) {
          const listRes = await databases.listDocuments(
            dbId,
            APPWRITE_CONFIG.collections.editor_profiles,
            [Query.equal('user_id', targetId)]
          ).catch(() => ({ documents: [] }))

          if (listRes.documents.length > 0) {
            doc = listRes.documents[0]
          }
        }

        setEditor(doc)
      } catch (err) {
        console.error('Failed to load public editor profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicEditor()
  }, [targetId])

  const extractYouTubeId = (url?: string) => {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    return match ? match[1] : null
  }

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

  const showreels = [
    extractYouTubeId(editor.youtube_url1 || editor.youtube_url),
    extractYouTubeId(editor.youtube_url2),
    extractYouTubeId(editor.youtube_url3),
  ].filter(Boolean) as string[]

  const rawWhatsapp = editor.whatsapp_number || editor.whatsapp || ''
  const cleanWhatsapp = normalizeIndianPhone(rawWhatsapp).normalized || rawWhatsapp.replace(/\D/g, '')
  const whatsappMessage = encodeURIComponent(
    `Hi ${editor.full_name || 'Editor'}, I saw your portfolio on UperAI and would like to discuss a video project with you.`
  )
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}` : '#'

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Link className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all" href="/">
          ← Back to Marketplace
        </Link>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-600 to-lime-500 rounded-3xl p-8 text-black shadow-2xl space-y-2">
          <span className="bg-black text-lime-400 text-[10px] font-black uppercase px-3 py-1 rounded-full">
            {editor.specialty_tag || 'VIDEO EDITOR'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">HELLO!! I'M {editor.full_name?.toUpperCase() || 'AVANISH RAI'}</h1>
          <p className="font-bold text-sm opacity-90">Verified Indian Video Editor • High Impact Showreels</p>
        </div>

        {/* Featured Work / Showreels Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-lime-400 font-display">Featured Work & Showreels ({showreels.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showreels.length > 0 ? (
              showreels.map((id, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-3 space-y-3 shadow-xl">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Showreel #{index + 1}</span>
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                    <iframe src={`https://www.youtube.com/embed/${id}`} className="w-full h-full border-0" allowFullScreen />
                  </div>
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
              ? 'Have a project in mind? Send a brief directly on WhatsApp.'
              : 'Sign in to access direct WhatsApp contacts and hire verified editors.'}
          </p>

          {user ? (
            /* Unlocked: Direct WhatsApp Link for Logged-In Users */
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              CONTACT ME ON WHATSAPP →
            </a>
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
    </div>
  )
}
