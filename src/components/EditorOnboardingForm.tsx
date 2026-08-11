'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Video,
  Sparkles,
  DollarSign,
  PhoneCall,
  HardDrive,
} from 'lucide-react'
import { CURRENCIES } from '@/lib/constants'
import { normalizeIndianPhone } from '@/lib/phone'
import { parseVideoUrl } from '@/lib/video-parser'

interface PortfolioRow {
  youtubeUrl: string
  roleDescription: string
  previewState: 'idle' | 'loading' | 'ok' | 'error'
  previewTitle?: string
  previewThumb?: string
  sourceType?: 'youtube' | 'drive'
  driveError?: string
}

interface ExistingData {
  name?: string
  bio?: string
  city?: string
  headline?: string
  rateLong?: string
  rateShort?: string
  currency?: string
  whatsapp?: string
  instagramHandle?: string
  turnaroundDays?: string
}

const emptyRow = (): PortfolioRow => ({
  youtubeUrl: '',
  roleDescription: '',
  previewState: 'idle',
})

const STEPS = [
  { id: 1, name: 'Add your work', icon: Video },
  { id: 2, name: 'Say what you do', icon: Sparkles },
  { id: 3, name: 'Set your rate', icon: DollarSign },
  { id: 4, name: 'How to reach you', icon: PhoneCall },
]

export default function EditorOnboardingForm({ existing }: { existing?: ExistingData }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Work / Portfolio
  const [rows, setRows] = useState<PortfolioRow[]>([emptyRow(), emptyRow(), emptyRow()])

  // Step 2: Identity & Specialty
  const [name, setName] = useState(existing?.name ?? '')
  const [headline, setHeadline] = useState(existing?.headline ?? '')
  const [formatChoice, setFormatChoice] = useState<'both' | 'shorts' | 'long'>('both')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [city, setCity] = useState(existing?.city ?? '')

  // Step 3: Rates
  const [rateLong, setRateLong] = useState(existing?.rateLong ?? '')
  const [rateShort, setRateShort] = useState(existing?.rateShort ?? '')
  const [currency, setCurrency] = useState(existing?.currency ?? 'INR')
  const [turnaroundDays, setTurnaroundDays] = useState(existing?.turnaroundDays ?? '2')

  // Step 4: Contact
  const [whatsapp, setWhatsapp] = useState(existing?.whatsapp ?? '')
  const [instagramHandle, setInstagramHandle] = useState(existing?.instagramHandle ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  function updateRow(index: number, patch: Partial<PortfolioRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function onUrlChange(index: number, value: string) {
    updateRow(index, { youtubeUrl: value, previewState: 'idle', driveError: undefined })
    clearTimeout(debounceTimers.current[index])
    if (!value.trim()) return

    const parsed = parseVideoUrl(value)
    if (!parsed) {
      updateRow(index, { previewState: 'error', driveError: 'Please enter a valid YouTube video URL or Google Drive link.' })
      return
    }

    updateRow(index, { sourceType: parsed.sourceType })

    if (parsed.sourceType === 'drive') {
      debounceTimers.current[index] = setTimeout(async () => {
        updateRow(index, { previewState: 'loading' })
        try {
          const res = await fetch('/api/check-drive-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: value }),
          })
          const data = await res.json()
          if (data.isPublic) {
            updateRow(index, { previewState: 'ok', previewTitle: 'Google Drive Video' })
          } else {
            updateRow(index, {
              previewState: 'error',
              driveError: data.error || "This Drive link is private. Set sharing to 'Anyone with the link' so creators can watch it.",
            })
          }
        } catch {
          updateRow(index, {
            previewState: 'error',
            driveError: "Could not verify Drive link permissions. Check 'Anyone with the link' access.",
          })
        }
      }, 400)
      return
    }

    // YouTube oEmbed lookup
    debounceTimers.current[index] = setTimeout(async () => {
      updateRow(index, { previewState: 'loading' })
      try {
        const res = await fetch('/api/oembed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        })
        const data = await res.json()
        if (data.available) {
          updateRow(index, { previewState: 'ok', previewTitle: data.title, previewThumb: data.thumbnailUrl })
        } else {
          updateRow(index, { previewState: 'error' })
        }
      } catch {
        updateRow(index, { previewState: 'error' })
      }
    }, 400)
  }

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  function addRow() {
    if (rows.length >= 6) return
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    if (rows.length <= 3) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
    setStepError(null)

    if (step === 1) {
      const filled = rows.filter((r) => r.youtubeUrl.trim() && r.roleDescription.trim())
      if (filled.length < 3) {
        setStepError('Please add at least 3 videos, each with a one-line description of what you did.')
        return false
      }

      const hasDriveError = rows.some((r) => r.driveError)
      if (hasDriveError) {
        setStepError("One or more Google Drive links are private. Set sharing to 'Anyone with the link' to proceed.")
        return false
      }
      return true
    }

    if (step === 2) {
      if (!name.trim()) {
        setStepError('Display name is required.')
        return false
      }
      if (!headline.trim()) {
        setStepError('Headline / specialty is required (e.g. Gaming & VFX Specialist).')
        return false
      }
      return true
    }

    if (step === 3) {
      if (rateLong && Number(rateLong) < 1) {
        setStepError('Long-form rate must be at least ₹1 (or leave blank if you don\'t offer that format).')
        return false
      }
      if (rateShort && Number(rateShort) < 1) {
        setStepError('Shorts rate must be at least ₹1 (or leave blank if you don\'t offer that format).')
        return false
      }
      if (!rateLong && !rateShort) {
        setStepError('Set at least one rate (Shorts or Long-form). Creators filter by this.')
        return false
      }
      return true
    }

    if (step === 4) {
      if (whatsapp.trim()) {
        const waCheck = normalizeIndianPhone(whatsapp)
        if (waCheck.error) {
          setStepError(waCheck.error)
          return false
        }
      }

      if (!whatsapp.trim() && !instagramHandle.trim()) {
        setStepError('Please provide at least one contact method (WhatsApp or Instagram).')
        return false
      }
      return true
    }

    return true
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 4))
    }
  }

  const handlePrevStep = () => {
    setStepError(null)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep(4)) return

    setSubmitting(true)
    const filledRows = rows.filter((r) => r.youtubeUrl.trim() && r.roleDescription.trim())

    try {
      const res = await fetch('/api/editor-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          headline: headline.trim() || null,
          rateLong: rateLong ? Number(rateLong) : null,
          rateShort: rateShort ? Number(rateShort) : null,
          currency,
          turnaroundDays: turnaroundDays ? Number(turnaroundDays) : null,
          whatsapp: whatsapp.trim() || null,
          instagramHandle: instagramHandle.trim() || null,
          portfolio: filledRows.map((r) => ({
            youtubeUrl: r.youtubeUrl.trim(),
            roleDescription: r.roleDescription.trim(),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setStepError(data.error ?? 'Something went wrong while saving your profile. Try again.')
        setSubmitting(false)
        return
      }
      router.push(`/editors/${data.handle}`)
    } catch {
      setStepError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 transition-colors'
  const labelClass = 'text-xs font-bold text-zinc-300 block mb-1.5 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {/* ── 4-STEP PROGRESS INDICATOR ──────────────────────────── */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const Icon = step.icon

            return (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                      : isCompleted
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800/60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {step.id}. {step.name}
                  </span>
                </div>
                {step.id < 4 && <div className="w-4 sm:w-8 h-px bg-zinc-800 shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {stepError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-in fade-in">
          {stepError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── STEP 1: Add your work ───────────────────────────────── */}
        {currentStep === 1 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-lime-400" /> 1. Add your work
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Add 3–6 video links you edited. YouTube links are preferred, Google Drive links are supported. Include a one-line description of your exact role on each.
              </p>
            </div>

            <div className="space-y-4">
              {rows.map((row, i) => (
                <div key={i} className="subtle-panel p-4 sm:p-5 rounded-2xl space-y-3 border border-zinc-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <input
                          type="url"
                          placeholder="YouTube link (preferred) or Google Drive link (e.g. drive.google.com/file/d/...)"
                          value={row.youtubeUrl}
                          onChange={(e) => onUrlChange(i, e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="What did you do on this? e.g. full edit, motion graphics, color & SFX"
                        value={row.roleDescription}
                        onChange={(e) => updateRow(i, { roleDescription: e.target.value })}
                        maxLength={140}
                        className={inputClass}
                      />
                    </div>

                    {row.previewState === 'ok' && row.previewThumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.previewThumb} alt="" className="w-20 h-20 object-cover rounded-xl border border-zinc-800 shrink-0" />
                    )}
                    {row.previewState === 'ok' && !row.previewThumb && (
                      <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <HardDrive className="w-5 h-5 text-sky-400 mb-1" />
                        <span className="text-[10px] text-zinc-400 leading-tight">Drive Video</span>
                      </div>
                    )}
                    {row.previewState === 'loading' && (
                      <div className="w-20 h-20 flex items-center justify-center shrink-0">
                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                      </div>
                    )}
                    {row.previewState === 'error' && (
                      <div className="w-20 h-20 flex items-center justify-center shrink-0" title="Check video permissions">
                        <XCircle className="w-5 h-5 text-rose-400" />
                      </div>
                    )}

                    {rows.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-zinc-500 hover:text-rose-400 p-1 shrink-0 transition-colors"
                        aria-label="Remove video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {row.previewState === 'ok' && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {row.previewTitle || 'Link verified'}
                    </p>
                  )}
                  {row.driveError && (
                    <p className="text-[11px] text-rose-400 leading-relaxed font-medium">
                      ⚠️ {row.driveError}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {rows.length < 6 && (
              <button
                type="button"
                onClick={addRow}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-lime-400" /> Add another video clip ({rows.length}/6)
              </button>
            )}
          </section>
        )}

        {/* ── STEP 2: Say what you do ─────────────────────────────── */}
        {currentStep === 2 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lime-400" /> 2. Say what you do
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Describe your editing specialty, format, and content focus so creators find you quickly.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Headline / Specialty *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gaming & VFX Specialist (or Documentary Long-Form Editor)"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 mt-1">One line describing your main style & content type.</p>
              </div>

              <div>
                <label className={labelClass}>Primary Editing Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormatChoice('shorts')}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                      formatChoice === 'shorts'
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    Shorts (9:16)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatChoice('long')}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                      formatChoice === 'long'
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    Long-form (16:9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatChoice('both')}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                      formatChoice === 'both'
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    Both Formats
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City / Location (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={80}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>One-line bio (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 3+ years experience editing top tech creators"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={160}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 3: Set your rate ──────────────────────────────── */}
        {currentStep === 3 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-lime-400" /> 3. Set your rate
              </h2>
              <p className="text-xs text-lime-400/90 font-medium mt-1.5 flex items-center gap-1">
                <span>💡 Creators filter by this. Set transparent base rates per video.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Shorts Rate (₹)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 1500"
                  value={rateShort}
                  onChange={(e) => setRateShort(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 mt-1">Per 9:16 vertical Short / Reel</p>
              </div>

              <div>
                <label className={labelClass}>Long-Form Rate (₹)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 8000"
                  value={rateLong}
                  onChange={(e) => setRateLong(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 mt-1">Per 16:9 main channel video</p>
              </div>

              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-w-xs">
              <label className={labelClass}>Typical Turnaround (Days)</label>
              <select
                value={turnaroundDays}
                onChange={(e) => setTurnaroundDays(e.target.value)}
                className={inputClass}
              >
                <option value="1">24 Hours (1 Day)</option>
                <option value="2">48 Hours (2 Days)</option>
                <option value="4">3 – 4 Days</option>
                <option value="7">1 Week</option>
              </select>
            </div>
          </section>
        )}

        {/* ── STEP 4: How to reach you ────────────────────────────── */}
        {currentStep === 4 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-lime-400" /> 4. How to reach you
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Add your direct WhatsApp number or Instagram handle so interested creators can contact you directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 or 919876543210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 mt-1">10-digit Indian number (91 prefix automatically added)</p>
              </div>

              <div>
                <label className={labelClass}>Instagram Handle</label>
                <input
                  type="text"
                  placeholder="username (no @)"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 mt-1">Without the @ symbol</p>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP NAVIGATION CONTROLS ───────────────────────────── */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-white text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-md"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 bg-gradient-to-r from-lime-300 to-emerald-400 text-zinc-950 rounded-xl text-xs font-extrabold hover:from-lime-400 hover:to-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete & Publish Profile'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
