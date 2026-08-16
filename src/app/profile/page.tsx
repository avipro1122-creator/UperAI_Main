'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RoleGuard from '@/components/RoleGuard'
import { useAuth } from '@/context/AuthContext'
import { parseVideoUrl } from '@/lib/video-parser'
import { db, storage } from '@/lib/firebase/client'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

const PREDEFINED_SPECIALTIES = [
  'Long Form Video Editor',
  'Short Form Video Editor',
  'Design',
  'VFX',
  'Custom',
]

// Helper to normalize Instagram Reel links
const normalizeMediaUrl = (url: string) => {
  if (!url) return ''
  const trimmed = url.trim()
  const instaMatch = trimmed.match(/(?:instagram\.com\/(?:reel|reels|p)\/)([\w-]+)/i)
  if (instaMatch) {
    return `https://www.instagram.com/reel/${instaMatch[1]}/`
  }
  return trimmed
}

function ThumbnailField({
  slot,
  value,
  uploading,
  onChange,
  onUpload,
}: {
  slot: 1 | 2
  value: string
  uploading: boolean
  onChange: (url: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>Custom Thumbnail (Optional)</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-8">
          <input
            type="url"
            placeholder="Paste image URL (https://...)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/60 transition-colors"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          <label className="flex-1 cursor-pointer text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-2 text-xs font-semibold transition-all">
            {uploading ? 'Uploading…' : '📁 Upload Image'}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={onUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {value && (
        <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`Thumbnail preview ${slot}`} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileDocId, setProfileDocId] = useState<string | null>(null)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)

  const [selectedSpecialtyOption, setSelectedSpecialtyOption] = useState('Long Form Video Editor')
  const [customSpecialty, setCustomSpecialty] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    specialtyTag: 'Long Form Video Editor',
    baseRate: 1500,
    turnaroundTime: '2 Days',
    youtubeUrl1: '',
    youtubeUrl2: '',
    youtubeUrl3: '',
    thumbnailUrl1: '',
    thumbnailUrl2: '',
    whatsappNumber: '',
  })

  const [uploadingThumb, setUploadingThumb] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false })

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadProfile() {
      try {
        const uid = user?.uid || user?.$id
        if (!uid) return

        const snap = await getDoc(doc(db, 'editor_profiles', uid))
        if (snap.exists()) {
          const docData = snap.data()
          setProfileDocId(snap.id)
          const tag = docData.specialty_tag || 'Long Form Video Editor'

          if (PREDEFINED_SPECIALTIES.includes(tag)) {
            setSelectedSpecialtyOption(tag)
            setCustomSpecialty('')
          } else {
            setSelectedSpecialtyOption('Custom')
            setCustomSpecialty(tag)
          }

          setFormData({
            fullName: docData.full_name || user?.displayName || user?.name || '',
            specialtyTag: tag,
            baseRate: docData.base_rate || 1500,
            turnaroundTime: docData.turnaround_time || '2 Days',
            youtubeUrl1: docData.youtube_url1 || docData.youtube_url || '',
            youtubeUrl2: docData.youtube_url2 || '',
            youtubeUrl3: docData.youtube_url3 || '',
            thumbnailUrl1: docData.thumbnail_url1 || '',
            thumbnailUrl2: docData.thumbnail_url2 || '',
            whatsappNumber: docData.whatsapp_number || docData.whatsapp || '',
          })
        } else {
          setFormData((prev) => ({ ...prev, fullName: user?.displayName || user?.name || '' }))
        }
      } catch (err) {
        console.error('Error fetching profile from Firestore:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP, or GIF).')
      return
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      alert('Thumbnail image must be smaller than 5MB.')
      return
    }

    setUploadingThumb((prev) => ({ ...prev, [slot]: true }))
    try {
      const uid = user?.uid || user?.$id || 'guest'
      const storageRef = ref(storage, `thumbnails/${uid}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(snapshot.ref)
      setFormData((prev) => ({ ...prev, [`thumbnailUrl${slot}`]: downloadUrl }))
    } catch (err: any) {
      alert(`Thumbnail upload failed: ${err.message || 'Unknown error'}`)
    } finally {
      setUploadingThumb((prev) => ({ ...prev, [slot]: false }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to save your profile.')
      return
    }

    setSaving(true)
    const effectiveSpecialty =
      selectedSpecialtyOption === 'Custom'
        ? (customSpecialty.trim() || 'Video Editor')
        : selectedSpecialtyOption

    const uid = user?.uid || user?.$id
    if (!uid) {
      alert('Please sign in to save your profile.')
      setSaving(false)
      return
    }
    const nameVal = formData.fullName.trim() || 'Editor'
    const handle = nameVal.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || uid

    const payload = {
      user_id: uid,
      full_name: nameVal,
      display_name: nameVal,
      name: nameVal,
      handle,
      specialty_tag: effectiveSpecialty,
      headline: effectiveSpecialty,
      base_rate: Number(formData.baseRate) || 1500,
      turnaround_time: formData.turnaroundTime.trim() || '2 Days',
      youtube_url: formData.youtubeUrl1.trim() || formData.youtubeUrl2.trim() || formData.youtubeUrl3.trim() || '',
      youtube_url1: formData.youtubeUrl1.trim(),
      youtube_url2: formData.youtubeUrl2.trim(),
      youtube_url3: formData.youtubeUrl3.trim(),
      thumbnail_url1: formData.thumbnailUrl1.trim(),
      thumbnail_url2: formData.thumbnailUrl2.trim(),
      whatsapp_number: formData.whatsappNumber.trim(),
      whatsapp: formData.whatsappNumber.trim(),
      open_to_work: true,
      is_hidden: false,
      updatedAt: new Date().toISOString(),
    }

    try {
      const editorRef = doc(db, 'editor_profiles', uid)
      await setDoc(editorRef, payload, { merge: true })
      setProfileDocId(uid)
      alert('Profile details saved successfully!')
      router.refresh()
      router.push('/')
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const showreelUrls = [formData.youtubeUrl1, formData.youtubeUrl2, formData.youtubeUrl3]

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
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">Specialty</label>
                  <select
                    value={selectedSpecialtyOption}
                    onChange={(e) => setSelectedSpecialtyOption(e.target.value)}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                  >
                    {PREDEFINED_SPECIALTIES.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400">Base Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400">Turnaround Time</label>
                <input
                  type="text"
                  value={formData.turnaroundTime}
                  onChange={(e) => setFormData({ ...formData, turnaroundTime: e.target.value })}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="e.g. 2 Days / 48 Hours"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400">Direct WhatsApp Number</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Showreel Video Links</h3>
                
                <div>
                  <label className="text-xs text-zinc-400">Video #1 (Primary)</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl1}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl1: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <ThumbnailField
                    slot={1}
                    value={formData.thumbnailUrl1}
                    uploading={uploadingThumb[1]}
                    onChange={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl1: url }))}
                    onUpload={(e) => handleThumbnailUpload(e, 1)}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Video #2</label>
                  <input
                    type="url"
                    value={formData.youtubeUrl2}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl2: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <ThumbnailField
                    slot={2}
                    value={formData.thumbnailUrl2}
                    uploading={uploadingThumb[2]}
                    onChange={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl2: url }))}
                    onUpload={(e) => handleThumbnailUpload(e, 2)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-6 py-3 bg-lime-400 hover:bg-lime-300 text-black font-black text-sm rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving Changes…' : 'Save Profile Details'}
              </button>
            </form>

            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-zinc-400">Quick Preview</h2>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="text-base font-bold text-white">{formData.fullName || 'Editor Name'}</div>
                <div className="text-xs text-lime-400">{selectedSpecialtyOption}</div>
                <div className="text-xs text-zinc-400">₹{formData.baseRate.toLocaleString()} • {formData.turnaroundTime}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
