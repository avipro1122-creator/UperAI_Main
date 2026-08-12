'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RoleGuard from '@/components/RoleGuard'
import { useAuth } from '@/context/AuthContext'
import { parseVideoUrl } from '@/lib/video-parser'
import { databases } from '@/lib/appwrite/client'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query, ID, Permission, Role } from 'appwrite'

const PREDEFINED_SPECIALTIES = [
  'Long Form Video Editor',
  'Short Form Video Editor',
  'Design',
  'VFX',
  'Custom',
]

const sanitizeVideoUrl = (rawUrl: string, maxLength = 190): string => {
  if (!rawUrl) return ''
  let url = rawUrl.trim()
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('si')
    parsed.searchParams.delete('feature')
    parsed.searchParams.delete('pp')
    url = parsed.toString()
  } catch {
    // Keep trimmed string
  }
  return url.length > maxLength ? url.substring(0, maxLength) : url
}

export default function ProfilePage() {
  return (
    <RoleGuard>
      <ProfileDashboardContent />
    </RoleGuard>
  )
}

function ProfileDashboardContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileDocId, setProfileDocId] = useState<string | null>(null)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)

  const [selectedSpecialtyOption, setSelectedSpecialtyOption] = useState<string>('Long Form Video Editor')
  const [customSpecialty, setCustomSpecialty] = useState<string>('')

  const [formData, setFormData] = useState({
    fullName: '',
    specialtyTag: 'Long Form Video Editor',
    baseRate: 1500,
    turnaroundTime: '2 Days',
    youtubeUrl1: '',
    youtubeUrl2: '',
    youtubeUrl3: '',
    whatsappNumber: '',
  })

  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
        let response = await databases.listDocuments(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.equal('user_id', user.$id)]
        ).catch(() => ({ documents: [] }))

        if (response.documents.length === 0) {
          response = await databases.listDocuments(
            dbId,
            APPWRITE_CONFIG.collections.editor_profiles,
            [Query.equal('$id', user.$id)]
          ).catch(() => ({ documents: [] }))
        }

        if (response.documents.length > 0) {
          const doc = response.documents[0]
          setProfileDocId(doc.$id)
          const tag = doc.specialty_tag || 'Long Form Video Editor'
          
          if (PREDEFINED_SPECIALTIES.includes(tag)) {
            setSelectedSpecialtyOption(tag)
            setCustomSpecialty('')
          } else {
            setSelectedSpecialtyOption('Custom')
            setCustomSpecialty(tag)
          }

          setFormData({
            fullName: doc.full_name || user.name || '',
            specialtyTag: tag,
            baseRate: doc.base_rate || 1500,
            turnaroundTime: doc.turnaround_time || '2 Days',
            youtubeUrl1: doc.youtube_url1 || doc.youtube_url || '',
            youtubeUrl2: doc.youtube_url2 || '',
            youtubeUrl3: doc.youtube_url3 || '',
            whatsappNumber: doc.whatsapp_number || doc.whatsapp || '',
          })
        } else {
          setFormData((prev) => ({ ...prev, fullName: user.name || '' }))
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const extractYouTubeId = (url: string) => {
    if (!url) return ''
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    return match ? match[1] : ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // MANDATORY PHONE NUMBER VALIDATION
    const cleanPhone = formData.whatsappNumber.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('A valid 10-digit WhatsApp phone number is compulsory to create or update your profile.')
      return
    }

    setSaving(true)

    const finalSpecialtyTag =
      selectedSpecialtyOption === 'Custom'
        ? customSpecialty.trim() || 'Video Editor'
        : selectedSpecialtyOption

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

    const cleanUrl1 = sanitizeVideoUrl(formData.youtubeUrl1, 1900)
    const cleanUrl2 = sanitizeVideoUrl(formData.youtubeUrl2, 1900)
    const cleanUrl3 = sanitizeVideoUrl(formData.youtubeUrl3, 190)
    const mainVideoUrl = (cleanUrl1 || cleanUrl2 || cleanUrl3 || '').trim()
    const parsedMain = parseVideoUrl(mainVideoUrl)
    const previewImg = parsedMain?.thumbnailUrl || ''

    const payload: Record<string, any> = {
      user_id: user.$id,
      full_name: formData.fullName,
      specialty_tag: finalSpecialtyTag,
      base_rate: Number(formData.baseRate),
      turnaround_time: formData.turnaroundTime,
      youtube_url: cleanUrl1,
      youtube_url1: cleanUrl1,
      youtube_url2: cleanUrl2,
      youtube_url3: cleanUrl3,
      preview_img: previewImg,
      whatsapp_number: cleanPhone,
      whatsapp: cleanPhone,
      open_to_work: true,
      is_hidden: false,
    }

    const documentPermissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]

    async function attemptSave(docPayload: Record<string, any>) {
      if (profileDocId) {
        try {
          return await databases.updateDocument(
            dbId,
            APPWRITE_CONFIG.collections.editor_profiles,
            profileDocId,
            docPayload,
            documentPermissions
          )
        } catch {
          // Document not found (404) or schema update issue: recreate seamlessly
          try {
            await databases.deleteDocument(dbId, APPWRITE_CONFIG.collections.editor_profiles, profileDocId).catch(() => {})
          } catch {}

          try {
            const created = await databases.createDocument(
              dbId,
              APPWRITE_CONFIG.collections.editor_profiles,
              profileDocId,
              docPayload,
              documentPermissions
            )
            setProfileDocId(created.$id)
            return created
          } catch {
            const created = await databases.createDocument(
              dbId,
              APPWRITE_CONFIG.collections.editor_profiles,
              ID.unique(),
              docPayload,
              documentPermissions
            )
            setProfileDocId(created.$id)
            return created
          }
        }
      } else {
        const created = await databases.createDocument(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          ID.unique(),
          docPayload,
          documentPermissions
        )
        setProfileDocId(created.$id)
        return created
      }
    }

    try {
      await attemptSave(payload)
      alert('Profile details & WhatsApp contact info saved successfully!')
      router.refresh()
      router.push('/')
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const showreelUrls = [formData.youtubeUrl1, formData.youtubeUrl2, formData.youtubeUrl3]
  const activeParsedVideo = parseVideoUrl(showreelUrls[activePreviewIndex] || showreelUrls[0] || '')

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-lime-400 selection:text-black">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-lime-400 mb-2 transition-colors" href="/">
              ← Back to Marketplace / Home
            </Link>
            <h1 className="text-2xl sm:text-4xl font-black font-display">Editor Profile Dashboard</h1>
            <p className="text-zinc-400 text-xs sm:text-sm">Manage your public listing, showreels, and direct WhatsApp contact info.</p>
          </div>

          {profileDocId && (
            <Link className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-lime-400 font-bold text-xs rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-md" href={`/editors/${profileDocId}`}>
              👁️ View Live Public Portfolio Page ↗
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading profile settings...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form onSubmit={handleSave} className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-lime-400 border-b border-zinc-800 pb-3">Edit Details</h2>

              <div>
                <label className="text-xs font-bold text-zinc-400">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g. Avanish Rai"
                  className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                  required
                />
              </div>

              {/* SPECIALTY TAG DROPDOWN WITH CUSTOM OPTION */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Specialty Tag *</label>
                <select
                  value={selectedSpecialtyOption}
                  onChange={(e) => {
                    const val = e.target.value
                    setSelectedSpecialtyOption(val)
                    if (val !== 'Custom') {
                      setFormData((prev) => ({ ...prev, specialtyTag: val }))
                    }
                  }}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all font-semibold"
                >
                  <option value="Long Form Video Editor">Long Form Video Editor</option>
                  <option value="Short Form Video Editor">Short Form Video Editor</option>
                  <option value="Design">Design</option>
                  <option value="VFX">VFX</option>
                  <option value="Custom">Custom (Type your own)</option>
                </select>

                {/* Custom Specialty Field (Visible only when 'Custom' is selected) */}
                {selectedSpecialtyOption === 'Custom' && (
                  <input
                    type="text"
                    value={customSpecialty}
                    onChange={(e) => {
                      setCustomSpecialty(e.target.value)
                      setFormData((prev) => ({ ...prev, specialtyTag: e.target.value }))
                    }}
                    placeholder="Type custom specialty (e.g., 3D Motion Animator)..."
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-all mt-2"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">Base Rate (₹) *</label>
                  <input
                    type="number"
                    value={formData.baseRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, baseRate: Number(e.target.value) }))}
                    className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400">Turnaround Time *</label>
                  <input
                    type="text"
                    value={formData.turnaroundTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, turnaroundTime: e.target.value }))}
                    className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* 3 SHOWREEL URL INPUTS */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-lime-400 uppercase tracking-wider">Showreels / Featured Videos (YouTube or Instagram Reels)</h3>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Video #1 (Main Showreel / Reel)</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, youtubeUrl1: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                    className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Video #2 (Shorts / Instagram Reel Sample)</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl2}
                    onChange={(e) => setFormData((prev) => ({ ...prev, youtubeUrl2: e.target.value }))}
                    placeholder="https://www.instagram.com/reel/... or https://youtube.com/shorts/..."
                    className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Video #3 (3D / Motion VFX / Reel Sample)</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl3}
                    onChange={(e) => setFormData((prev) => ({ ...prev, youtubeUrl3: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                    className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>
              </div>

              {/* COMPULSORY WHATSAPP NUMBER FIELD */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-lime-400">WhatsApp Phone Number * (Compulsory)</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="e.g. 9016047119"
                  className="w-full p-3 bg-zinc-950 border border-lime-800/60 focus:border-lime-400 rounded-xl text-xs text-white transition-all"
                  required
                />
                <p className="text-[10px] text-zinc-400">Required so creators can connect with you directly via WhatsApp.</p>
              </div>

              <button type="submit" disabled={saving} className="w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all mt-2 shadow-lg">
                {saving ? 'Saving...' : 'SAVE ALL CHANGES'}
              </button>
            </form>

            {/* PREVIEW PANEL WITH SHOWREEL SWITCHER */}
            <div className="lg:col-span-5 space-y-4 sticky top-24">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">{formData.fullName || 'Avi Rai'}</h3>
                  <span className="text-[10px] bg-lime-950 text-lime-400 font-bold px-2 py-0.5 rounded border border-lime-800/40">
                    {selectedSpecialtyOption === 'Custom' ? customSpecialty || 'Custom' : selectedSpecialtyOption}
                  </span>
                </div>

                <div className={`w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 ${activeParsedVideo?.isShortsUrl || activeParsedVideo?.sourceType === 'instagram' ? 'aspect-[9/16] max-h-[460px] mx-auto' : 'aspect-video'}`}>
                  {activeParsedVideo ? (
                    <iframe src={activeParsedVideo.embedUrl} className="w-full h-full border-0" allowFullScreen />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">Paste YouTube or Instagram Reel URL</div>
                  )}
                </div>

                {/* Showreel Selector Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        activePreviewIndex === idx ? 'bg-lime-400 text-black border-lime-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Video #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
