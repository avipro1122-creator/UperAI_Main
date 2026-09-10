'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Video,
  DollarSign,
  PhoneCall,
  User,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Eye,
  Camera,
  Play,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { parseVideoUrl } from '@/lib/video-parser'
import { resolveThumbnailUrl } from '@/lib/thumbnail-resolver'
import { normalizeIndianPhone } from '@/lib/phone'
import { db, storage } from '@/lib/firebase/client'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

const SUGGESTED_SPECIALTIES = [
  'Short-Form / Reels Specialist',
  'YouTube Long-Form Editor',
  'Documentary & Cinematic Editor',
  'Gaming & Stream Highlights',
  '3D VFX & Motion Graphics',
]

const TURNAROUND_OPTIONS = [
  { value: '24 Hours', label: '24 Hours (1 Day)' },
  { value: '48 Hours', label: '48 Hours (2 Days)' },
  { value: '3-4 Days', label: '3 – 4 Days' },
  { value: '1 Week', label: '1 Week' },
]

export default function ProfilePage() {
  const { user, loginWithGoogle, setActiveRole } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [profileDocId, setProfileDocId] = useState<string | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [headline, setHeadline] = useState('Short-Form / Reels Specialist')
  const [formatChoice, setFormatChoice] = useState<'both' | 'shorts' | 'long'>('both')
  const [rateShort, setRateShort] = useState<number | ''>(1500)
  const [rateLong, setRateLong] = useState<number | ''>(4500)
  const [turnaroundTime, setTurnaroundTime] = useState('48 Hours')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')

  // Video Portfolio State
  const [video1, setVideo1] = useState('')
  const [desc1, setDesc1] = useState('')
  const [thumb1, setThumb1] = useState('')

  const [video2, setVideo2] = useState('')
  const [desc2, setDesc2] = useState('')
  const [thumb2, setThumb2] = useState('')

  const [video3, setVideo3] = useState('')
  const [desc3, setDesc3] = useState('')
  const [thumb3, setThumb3] = useState('')

  const [uploadingThumb, setUploadingThumb] = useState<{ [key: number]: boolean }>({})

  // Load existing profile from Firestore
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
          const d = snap.data()
          setProfileDocId(snap.id)
          setFullName(d.full_name || d.name || user?.displayName || user?.name || '')
          setCity(d.city || '')
          setHeadline(d.headline || d.specialty_tag || 'Short-Form / Reels Specialist')

          const fmt = (d.format_tag || d.format || '').toLowerCase()
          if (fmt.includes('short')) setFormatChoice('shorts')
          else if (fmt.includes('long')) setFormatChoice('long')
          else setFormatChoice('both')

          setRateShort(d.rate_short != null ? d.rate_short : (d.min_rate || 1500))
          setRateLong(d.rate_long != null ? d.rate_long : (d.max_rate || 4500))
          setTurnaroundTime(d.turnaround_time || '48 Hours')
          setWhatsappNumber(d.whatsapp_number || d.whatsapp || '')
          setInstagramHandle((d.instagram_handle || d.instagram || '').replace(/^@/, ''))

          setVideo1(d.youtube_url1 || d.youtube_url || '')
          setThumb1(d.thumbnail_url1 || '')
          setVideo2(d.youtube_url2 || '')
          setThumb2(d.thumbnail_url2 || '')
          setVideo3(d.youtube_url3 || '')
          setThumb3(d.thumbnail_url3 || '')
        } else {
          setFullName(user?.displayName || user?.name || '')
        }
      } catch (err) {
        console.error('Error fetching profile from Firestore:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
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

      if (slot === 1) setThumb1(downloadUrl)
      if (slot === 2) setThumb2(downloadUrl)
      if (slot === 3) setThumb3(downloadUrl)
    } catch (err: any) {
      alert(`Thumbnail upload failed: ${err.message || 'Unknown error'}`)
    } finally {
      setUploadingThumb((prev) => ({ ...prev, [slot]: false }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSavedSuccess(false)

    if (!user) {
      setErrorMessage('Please sign in to save your profile.')
      return
    }

    const uid = user?.uid || user?.$id
    if (!uid) {
      setErrorMessage('Please sign in to save your profile.')
      return
    }

    const cleanName = fullName.trim()
    if (!cleanName) {
      setErrorMessage('Display Name is required.')
      return
    }

    if (whatsappNumber.trim()) {
      const waCheck = normalizeIndianPhone(whatsappNumber)
      if (waCheck.error) {
        setErrorMessage(waCheck.error)
        return
      }
    }

    if (!whatsappNumber.trim() && !instagramHandle.trim()) {
      setErrorMessage('Please provide at least one contact method (WhatsApp or Instagram).')
      return
    }

    if (!video1.trim() && !video2.trim() && !video3.trim()) {
      setErrorMessage('Please provide at least 1 portfolio video URL (YouTube, Drive, or Reel).')
      return
    }

    setSaving(true)

    const cleanHandle = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || uid
    const cleanInsta = instagramHandle.trim().replace(/^@/, '')
    const formatTag = formatChoice === 'shorts' ? 'Shorts' : formatChoice === 'long' ? 'Long-form' : 'Both'
    const effectiveBaseRate = Number(rateShort) || Number(rateLong) || 1500

    const primaryParsed = parseVideoUrl(video1.trim() || video2.trim() || video3.trim())
    const resolvedThumb1 = resolveThumbnailUrl(thumb1.trim()) || resolveThumbnailUrl(video1.trim()) || primaryParsed?.thumbnailUrl || null
    const resolvedThumb2 = resolveThumbnailUrl(thumb2.trim()) || resolveThumbnailUrl(video2.trim()) || null
    const resolvedThumb3 = resolveThumbnailUrl(thumb3.trim()) || resolveThumbnailUrl(video3.trim()) || null
    const effectiveThumb = resolvedThumb1 || resolvedThumb2 || resolvedThumb3 || null

    const payload = {
      user_id: uid,
      id: uid,
      full_name: cleanName,
      display_name: cleanName,
      name: cleanName,
      handle: cleanHandle,
      city: city.trim() || null,
      headline: headline.trim() || 'Video Editor',
      specialty_tag: headline.trim() || 'Video Editor',
      format_tag: formatTag,
      format: formatTag,
      base_rate: effectiveBaseRate,
      min_rate: Number(rateShort) || effectiveBaseRate,
      max_rate: Number(rateLong) || effectiveBaseRate,
      rate_short: Number(rateShort) || null,
      rate_long: Number(rateLong) || null,
      turnaround_time: turnaroundTime,
      whatsapp: whatsappNumber.trim(),
      whatsapp_number: whatsappNumber.trim(),
      instagram: cleanInsta || null,
      instagram_handle: cleanInsta || null,
      youtube_url: video1.trim() || video2.trim() || video3.trim() || '',
      youtube_url1: video1.trim(),
      youtube_url2: video2.trim(),
      youtube_url3: video3.trim(),
      thumbnail_url1: resolvedThumb1,
      thumbnail_url2: resolvedThumb2,
      thumbnail_url3: resolvedThumb3,
      thumbnail_url: effectiveThumb,
      preview_img: effectiveThumb,
      avatar_url: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      open_to_work: true,
      is_hidden: false,
      updatedAt: new Date().toISOString(),
    }

    try {
      const editorRef = doc(db, 'editor_profiles', uid)
      await setDoc(editorRef, payload, { merge: true })

      // Update user role to EDITOR
      const userRef = doc(db, 'users', uid)
      await setDoc(userRef, { role: 'EDITOR', handle: cleanHandle, name: cleanName, updatedAt: new Date().toISOString() }, { merge: true })
      setActiveRole('EDITOR')

      setProfileDocId(uid)
      setSavedSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMessage(`Save failed: ${err.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  // Derived preview values
  const previewThumb = resolveThumbnailUrl(thumb1) || resolveThumbnailUrl(video1) || parseVideoUrl(video1)?.thumbnailUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'
  const previewRate = rateShort ? `From ₹${Number(rateShort).toLocaleString()}` : rateLong ? `From ₹${Number(rateLong).toLocaleString()}` : 'Rates upfront'

  if (!user && !loading) {
    return (
      <div className="min-h-[80vh] bg-[#09090b] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-white">Join as an Editor</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in with Google to set up your verified editor profile, set your rates in INR, and get hired directly by top creators.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-lime-400 selection:text-black">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-lime-400 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
            </Link>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
              Editor Profile &amp; Portfolio Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage your verified editor listing, showreels, rates, and direct WhatsApp contact info.
            </p>
          </div>

          {profileDocId && (
            <Link
              href={`/editors/${profileDocId}`}
              className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-lime-400/40 text-lime-400 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md shrink-0 backdrop-blur-md"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Your editor profile has been saved and is live on the marketplace!</span>
            </div>
            {profileDocId && (
              <Link
                href={`/editors/${profileDocId}`}
                className="px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors"
              >
                View Live ↗
              </Link>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your profile settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Comprehensive Form */}
            <form
              onSubmit={handleSave}
              className="lg:col-span-7 space-y-6 bg-zinc-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl"
            >
              {/* SECTION 1: Personal & Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lime-400 text-xs font-extrabold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  <User className="w-4 h-4" />
                  <span>1. Personal &amp; Contact Info</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aman Sharma"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">City / Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                      placeholder="e.g. amanedits (without @)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Direct WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Interested creators contact you directly on WhatsApp with project briefs.
                  </p>
                </div>
              </div>

              {/* SECTION 2: Editing Specialty & Format */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-lime-400 text-xs font-extrabold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>2. Editing Specialty &amp; Format</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Headline / Specialty *</label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. High-Retention Shorts & Reels Specialist"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTED_SPECIALTIES.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setHeadline(spec)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          headline === spec
                            ? 'bg-lime-400 text-zinc-950 border-lime-400'
                            : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Primary Format</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'shorts', label: 'Shorts (9:16)' },
                      { id: 'long', label: 'Long-Form (16:9)' },
                      { id: 'both', label: 'Both Formats' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormatChoice(fmt.id as any)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          formatChoice === fmt.id
                            ? 'bg-lime-400/10 border-lime-400 text-lime-400 shadow-sm'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Rates & Turnaround */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-lime-400 text-xs font-extrabold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  <DollarSign className="w-4 h-4" />
                  <span>3. Rates &amp; Turnaround</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Rate per Short (₹)</label>
                    <input
                      type="number"
                      min={1}
                      value={rateShort}
                      onChange={(e) => setRateShort(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 1500"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Rate per Long Video (₹)</label>
                    <input
                      type="number"
                      min={1}
                      value={rateLong}
                      onChange={(e) => setRateLong(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 4500"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Typical Delivery Turnaround</label>
                  <select
                    value={turnaroundTime}
                    onChange={(e) => setTurnaroundTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400/80 transition-colors"
                  >
                    {TURNAROUND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 4: Showreels & Portfolio */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-lime-400 text-xs font-extrabold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  <Video className="w-4 h-4" />
                  <span>4. Portfolio Showreels</span>
                </div>

                {/* Video 1 (Primary) */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Video #1 (Primary Showreel) *</span>
                    <span className="text-[10px] font-bold text-lime-400 bg-lime-950 px-2 py-0.5 rounded-full border border-lime-800/40">
                      Main Preview
                    </span>
                  </div>
                  <input
                    type="url"
                    required
                    value={video1}
                    onChange={(e) => setVideo1(e.target.value)}
                    placeholder="YouTube or Google Drive URL (e.g. https://www.youtube.com/watch?v=...)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />

                  {/* Thumbnail Slot 1 */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition-all">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingThumb[1] ? 'Uploading…' : 'Custom Thumbnail'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingThumb[1]}
                        onChange={(e) => handleThumbnailUpload(e, 1)}
                        className="hidden"
                      />
                    </label>
                    {thumb1 && (
                      <button
                        type="button"
                        onClick={() => setThumb1('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove custom image
                      </button>
                    )}
                  </div>
                </div>

                {/* Video 2 (Optional) */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-zinc-300">Video #2 (Optional)</span>
                  <input
                    type="url"
                    value={video2}
                    onChange={(e) => setVideo2(e.target.value)}
                    placeholder="YouTube or Google Drive URL"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition-all">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingThumb[2] ? 'Uploading…' : 'Custom Thumbnail'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingThumb[2]}
                        onChange={(e) => handleThumbnailUpload(e, 2)}
                        className="hidden"
                      />
                    </label>
                    {thumb2 && (
                      <button
                        type="button"
                        onClick={() => setThumb2('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Video 3 (Optional) */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-zinc-300">Video #3 (Optional)</span>
                  <input
                    type="url"
                    value={video3}
                    onChange={(e) => setVideo3(e.target.value)}
                    placeholder="YouTube or Google Drive URL"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors"
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition-all">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingThumb[3] ? 'Uploading…' : 'Custom Thumbnail'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingThumb[3]}
                        onChange={(e) => handleThumbnailUpload(e, 3)}
                        className="hidden"
                      />
                    </label>
                    {thumb3 && (
                      <button
                        type="button"
                        onClick={() => setThumb3('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-lime-400/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile Details…</span>
                  </>
                ) : (
                  <span>Publish / Save Editor Profile</span>
                )}
              </button>
            </form>

            {/* Right Column: Live Marketplace Card Preview */}
            <div className="lg:col-span-5 sticky top-20 space-y-4">
              <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-lime-400" /> Live Marketplace Card Preview
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Verified
                  </span>
                </div>

                {/* Simulated Editor Card */}
                <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl space-y-3 p-3.5 group">
                  <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewThumb}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shadow-lg font-bold">
                        <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-lime-400 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0">
                        {fullName?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{fullName || 'Your Display Name'}</span>
                          <CheckCircle2 className="w-3 h-3 text-lime-400 shrink-0" />
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          @{instagramHandle || fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'handle'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 truncate">
                      {headline || 'Short-Form / Reels Specialist'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 uppercase">
                        {formatChoice === 'shorts' ? 'Shorts' : formatChoice === 'long' ? 'Long-form' : 'Both'}
                      </span>
                      <span className="font-extrabold text-lime-400 font-mono">
                        {previewRate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-zinc-400 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span>Instant WhatsApp direct connect enabled</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span>0% commission on your earnings</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
