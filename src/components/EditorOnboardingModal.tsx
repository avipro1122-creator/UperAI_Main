'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles, Video, DollarSign, User, PhoneCall } from 'lucide-react'
import { normalizeIndianPhone } from '@/lib/phone'
import { parseVideoUrl } from '@/lib/video-parser'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/client'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface EditorOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUGGESTED_SPECIALTIES = [
  'Short-Form / Reels Specialist',
  'YouTube Long-Form Editor',
  'Documentary & Cinematic Editor',
  'Gaming & Stream Highlights',
  '3D VFX & Motion Graphics',
]

export default function EditorOnboardingModal({ isOpen, onClose }: EditorOnboardingModalProps) {
  const { user, loginWithGoogle, setActiveRole } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form Fields (Exact same schema as /profile)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [headline, setHeadline] = useState('Short-Form / Reels Specialist')
  const [formatChoice, setFormatChoice] = useState<'both' | 'shorts' | 'long'>('both')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')

  const [rateShort, setRateShort] = useState<number | ''>(1500)
  const [rateLong, setRateLong] = useState<number | ''>(4500)
  const [turnaroundTime, setTurnaroundTime] = useState('48 Hours')

  const [video1, setVideo1] = useState('')
  const [desc1, setDesc1] = useState('')
  const [video2, setVideo2] = useState('')
  const [desc2, setDesc2] = useState('')
  const [video3, setVideo3] = useState('')
  const [desc3, setDesc3] = useState('')

  // Pre-fill from existing profile when opened
  useEffect(() => {
    if (!isOpen) return

    if (user?.name || user?.displayName) {
      setName((prev) => prev || user.displayName || user.name || '')
    }

    async function loadExisting() {
      const uid = user?.uid || user?.$id
      if (!uid) return

      try {
        const snap = await getDoc(doc(db, 'editor_profiles', uid))
        if (snap.exists()) {
          const d = snap.data()
          if (d.full_name || d.name) setName(d.full_name || d.name)
          if (d.city) setCity(d.city)
          if (d.headline || d.specialty_tag) setHeadline(d.headline || d.specialty_tag)
          if (d.whatsapp_number || d.whatsapp) setWhatsapp(d.whatsapp_number || d.whatsapp)
          if (d.instagram_handle || d.instagram) setInstagramHandle((d.instagram_handle || d.instagram).replace(/^@/, ''))
          if (d.rate_short) setRateShort(d.rate_short)
          if (d.rate_long) setRateLong(d.rate_long)
          if (d.turnaround_time) setTurnaroundTime(d.turnaround_time)
          if (d.youtube_url1 || d.youtube_url) setVideo1(d.youtube_url1 || d.youtube_url)
          if (d.youtube_url2) setVideo2(d.youtube_url2)
          if (d.youtube_url3) setVideo3(d.youtube_url3)
        }
      } catch {
        // Quiet fallback
      }
    }

    loadExisting()
  }, [isOpen, user])

  if (!isOpen) return null

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!name.trim()) return setError('Display name is required.')
      if (whatsapp.trim()) {
        const waCheck = normalizeIndianPhone(whatsapp)
        if (waCheck.error) return setError(waCheck.error)
      }
      if (!whatsapp.trim() && !instagramHandle.trim()) {
        return setError('Provide at least one contact method (WhatsApp or Instagram).')
      }
    }
    if (step === 2) {
      if (rateShort && Number(rateShort) < 1) {
        return setError('Shorts rate must be at least ₹1 (or leave blank).')
      }
      if (rateLong && Number(rateLong) < 1) {
        return setError('Long-form rate must be at least ₹1 (or leave blank).')
      }
      if (!rateShort && !rateLong) {
        return setError('Set at least one rate (Shorts or Long-form).')
      }
    }
    setStep((s) => s + 1)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!user) {
      return setError('Please sign in with Google to save your editor profile.')
    }

    const uid = user.uid || user.$id
    if (!uid) {
      return setError('Please sign in with Google to save your editor profile.')
    }

    if (!video1.trim() && !video2.trim() && !video3.trim()) {
      return setError('Please provide at least 1 video showreel URL (YouTube, Drive, or Reel).')
    }

    setSubmitting(true)

    const cleanName = name.trim() || user.displayName || user.name || 'Editor'
    const cleanHandle = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || uid
    const cleanInsta = instagramHandle.trim().replace(/^@/, '')
    const formatTag = formatChoice === 'shorts' ? 'Shorts' : formatChoice === 'long' ? 'Long-form' : 'Both'
    const effectiveBaseRate = Number(rateShort) || Number(rateLong) || 1500

    const primaryParsed = parseVideoUrl(video1.trim() || video2.trim() || video3.trim())
    const effectiveThumb = primaryParsed?.thumbnailUrl || null

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
      whatsapp: whatsapp.trim(),
      whatsapp_number: whatsapp.trim(),
      instagram: cleanInsta || null,
      instagram_handle: cleanInsta || null,
      youtube_url: video1.trim() || video2.trim() || video3.trim() || '',
      youtube_url1: video1.trim(),
      youtube_url2: video2.trim(),
      youtube_url3: video3.trim(),
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

      const userRef = doc(db, 'users', uid)
      await setDoc(userRef, { role: 'EDITOR', handle: cleanHandle, name: cleanName, updatedAt: new Date().toISOString() }, { merge: true })
      setActiveRole('EDITOR')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error saving profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSuccess(false)
    setError(null)
    onClose()
    if (success) {
      router.push('/profile')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-[92vw] max-w-lg md:w-full md:max-w-xl bg-zinc-950 text-white rounded-t-2xl md:rounded-3xl p-5 md:p-7 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto pb-24 md:pb-7 my-0 md:my-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 md:top-5 md:right-5 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-lime-400/20 text-lime-400 rounded-full flex items-center justify-center mx-auto border border-lime-400/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              Profile Listed Successfully!
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Your editor profile and showreels are now live on the marketplace. You can update your profile anytime in your dashboard.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClose()
                  router.push('/profile')
                }}
                className="px-6 py-3 bg-lime-400 text-zinc-950 font-extrabold rounded-xl text-xs hover:bg-lime-300 transition-colors shadow-lg"
              >
                Go to Profile Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Indicators */}
            <div className="border-b border-zinc-800 pb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Editor Onboarding • Step {step} of 3
              </span>
              <h3 className="font-display text-xl font-bold text-white mt-1">
                {step === 1 && '1. Personal & Contact Info'}
                {step === 2 && '2. Rates & Editing Specialty'}
                {step === 3 && '3. Add Portfolio Showreels'}
              </h3>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium space-y-2">
                <p>{error}</p>
                {(error.toLowerCase().includes('sign in') || !user) && (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="px-4 py-2 bg-white text-zinc-950 rounded-xl font-extrabold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign in with Google to Continue
                  </button>
                )}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. amanedits (without @)"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Creators send brief requests directly to your WhatsApp.</p>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Headline / Specialty *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High-Retention Shorts & Reels Specialist"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTED_SPECIALTIES.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setHeadline(spec)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                          headline === spec
                            ? 'bg-lime-400 text-zinc-950 border-lime-400'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Primary Editing Format
                  </label>
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
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          formatChoice === fmt.id
                            ? 'bg-lime-400/10 border-lime-400 text-lime-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Rate per Short (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={rateShort}
                      onChange={(e) => setRateShort(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Rate per Long Video (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="4500"
                      value={rateLong}
                      onChange={(e) => setRateLong(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Typical Delivery Turnaround
                  </label>
                  <select
                    value={turnaroundTime}
                    onChange={(e) => setTurnaroundTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                  >
                    <option value="24 Hours">24 Hours (1 Day)</option>
                    <option value="48 Hours">48 Hours (2 Days)</option>
                    <option value="3-4 Days">3 – 4 Days</option>
                    <option value="1 Week">1 Week</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Add links to videos you edited (YouTube, Google Drive, or Instagram Reels).
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Video #1 (Primary Showreel) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={video1}
                      onChange={(e) => setVideo1(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Video #2 (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={video2}
                      onChange={(e) => setVideo2(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Video #3 (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={video3}
                      onChange={(e) => setVideo3(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation controls */}
            <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-sm pt-3 pb-2 border-t border-zinc-800/80 -mx-4 md:-mx-7 px-4 md:px-7 mt-4 flex items-center justify-between z-10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-white text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-lime-400 text-zinc-950 rounded-xl text-xs font-extrabold hover:bg-lime-300 transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Profile'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
