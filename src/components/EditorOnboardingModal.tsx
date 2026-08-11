'use client'

import { useState } from 'react'
import { X, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { normalizeIndianPhone } from '@/lib/phone'

interface EditorOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.trim().match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function getYouTubeThumbnail(url: string): string {
  const videoId = parseYouTubeVideoId(url)
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
  return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop'
}

const mapFormatToDb = (rawFormat: string): 'SHORTS' | 'LONG_FORM' | 'DUAL' => {
  const normalized = (rawFormat || '').toLowerCase()
  if (normalized.includes('short') || normalized.includes('9:16')) return 'SHORTS'
  if (normalized.includes('long') || normalized.includes('16:9')) return 'LONG_FORM'
  return 'DUAL'
}

export default function EditorOnboardingModal({ isOpen, onClose }: EditorOnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [headline, setHeadline] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [rateShort, setRateShort] = useState('')
  const [rateLong, setRateLong] = useState('')
  const [turnaroundDays, setTurnaroundDays] = useState('2')
  const [video1, setVideo1] = useState('')
  const [desc1, setDesc1] = useState('')
  const [video2, setVideo2] = useState('')
  const [desc2, setDesc2] = useState('')
  const [video3, setVideo3] = useState('')
  const [desc3, setDesc3] = useState('')

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

    const portfolio = [
      { youtubeUrl: video1.trim(), roleDescription: desc1.trim() },
      { youtubeUrl: video2.trim(), roleDescription: desc2.trim() },
      { youtubeUrl: video3.trim(), roleDescription: desc3.trim() },
    ].filter((item) => item.youtubeUrl)

    if (portfolio.length < 1) {
      return setError('Please provide at least 1 valid video link (YouTube or Google Drive).')
    }

    setSubmitting(true)

    try {
      const rawFormat = rateShort && rateLong ? 'DUAL' : rateShort ? 'SHORTS' : 'LONG_FORM'
      const formData = {
        fullName: name.trim(),
        name: name.trim(),
        city: city.trim() || null,
        bio: bio.trim() || null,
        specialtyTag: headline.trim() || 'Video Editor & Motion Graphics Specialist',
        headline: headline.trim() || 'Video Editor & Motion Graphics Specialist',
        whatsapp: whatsapp.trim() || null,
        instagramHandle: instagramHandle.trim() || null,
        instagram: instagramHandle.trim() || null,
        youtubeUrl: portfolio[0]?.youtubeUrl || null,
        format: mapFormatToDb(rawFormat),
        rateShort: rateShort ? Number(rateShort) : null,
        rateLong: rateLong ? Number(rateLong) : null,
        baseRate: rateShort ? Number(rateShort) : rateLong ? Number(rateLong) : 1500,
        currency: 'INR',
        turnaroundTime: `${turnaroundDays || 2} Days`,
        turnaroundDays: Number(turnaroundDays) || 2,
        clips: portfolio.map((p) => ({ url: p.youtubeUrl, roleExplanation: p.roleDescription })),
        portfolio,
      }

      const res = await fetch('/api/onboarding/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(`Submission Error: ${data.error || 'Failed to submit'}`)
        setSubmitting(false)
        return
      }

      // Success: Refresh homepage
      window.location.reload()
    } catch (err: any) {
      alert(`Network Error: ${err.message || 'Check console logs'}`)
      setSubmitting(false)
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
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-[92vw] max-w-lg md:w-full md:max-w-xl bg-zinc-950 text-white rounded-t-2xl md:rounded-3xl p-4 md:p-6 border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto pb-24 md:pb-6 my-0 md:my-auto">
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
              Your editor profile and portfolio clips are now live on the marketplace. Creators can find you and send project briefs directly!
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-3 bg-white text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              View My Profile
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Editor Onboarding • Step {step} of 3
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  {step === 1 && 'Personal & Contact Info'}
                  {step === 2 && 'Rates & Editing Specialty'}
                  {step === 3 && 'Add 3 YouTube Portfolio Clips'}
                </h3>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
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
                    placeholder="Your display name"
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
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gaming & VFX Specialist"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@editorname"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Rate per Short (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={rateShort}
                      onChange={(e) => setRateShort(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Rate per Long Video (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="8000"
                      value={rateLong}
                      onChange={(e) => setRateLong(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Typical Delivery Turnaround (Days)
                  </label>
                  <select
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                  >
                    <option value="1">24 Hours (1 Day)</option>
                    <option value="2">48 Hours (2 Days)</option>
                    <option value="4">3 – 4 Days</option>
                    <option value="7">1 Week</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Add at least 1 YouTube video URL you edited. You can add up to 3 videos with brief lines explaining your role.
                </p>

                <div className="space-y-3">
                  <div>
                    <input
                      type="url"
                      placeholder="YouTube Video 1 URL (Required)"
                      value={video1}
                      onChange={(e) => setVideo1(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Cut 9:16 Shorts, added sound SFX & captions)"
                      value={desc1}
                      onChange={(e) => setDesc1(e.target.value)}
                      className="w-full px-4 py-1.5 mt-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="YouTube Video 2 URL (Optional)"
                      value={video2}
                      onChange={(e) => setVideo2(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. 16:9 Documentary edit & color grading)"
                      value={desc2}
                      onChange={(e) => setDesc2(e.target.value)}
                      className="w-full px-4 py-1.5 mt-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="YouTube Video 3 URL (Optional)"
                      value={video3}
                      onChange={(e) => setVideo3(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Motion graphics & VFX assets)"
                      value={desc3}
                      onChange={(e) => setDesc3(e.target.value)}
                      className="w-full px-4 py-1.5 mt-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation controls */}
            <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-sm pt-3 pb-2 border-t border-zinc-800/80 -mx-4 md:-mx-6 px-4 md:px-6 mt-4 flex items-center justify-between z-10">
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
                  className="px-6 py-2.5 bg-gradient-to-r from-lime-300 to-emerald-400 text-zinc-950 rounded-xl text-xs font-bold hover:from-lime-400 hover:to-emerald-500 transition-all flex items-center gap-2 shadow-md shadow-lime-400/10 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
