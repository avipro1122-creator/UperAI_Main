'use client'

import React, { useState, useEffect } from 'react'
import { Zap, X, CheckCircle2, ArrowRight, Loader2, MessageCircle, Clock, ShieldCheck } from 'lucide-react'

const NICHES = [
  'Shorts / Reels',
  'YouTube Long-Form',
  'Talking Head / Edu',
  'Gaming Videos',
  'Ecommerce / Ads',
  'Podcast Editing',
]

const BUDGETS = [
  'Under ₹1,500 / video',
  '₹1,500 - ₹3,000 / video',
  '₹3,000 - ₹5,000 / video',
  '₹5,000+ / video',
]

export default function ConciergeStickyBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [selectedNiche, setSelectedNiche] = useState(NICHES[0])
  const [selectedBudget, setSelectedBudget] = useState(BUDGETS[1])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Check if previously dismissed in this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('uperai_concierge_dismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('uperai_concierge_dismissed', 'true')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanNumber = whatsapp.replace(/[^\d+]/g, '').trim()
    if (!cleanNumber || cleanNumber.length < 8) {
      setErrorMessage('Please enter a valid WhatsApp number.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/concierge-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: cleanNumber.startsWith('+') ? cleanNumber : `+91${cleanNumber}`,
          niche: selectedNiche,
          budget: selectedBudget,
          notes,
          source: 'homepage_sticky_bar',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi UperAI Concierge! I'm in a rush. Looking for 3 editors for: ${selectedNiche}, Budget: ${selectedBudget}. Notes: ${notes || 'Standard project'}`
    )
    window.open(`https://wa.me/919016047119?text=${text}`, '_blank')
  }

  if (isDismissed) return null

  return (
    <>
      {/* Sticky Bottom Lead Capture Bar */}
      <aside
        aria-label="Concierge Fast Match"
        className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-6 max-w-5xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-zinc-950/95 backdrop-blur-xl border border-lime-400/40 hover:border-lime-400/70 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-lime-400/20 border border-lime-400/40 text-lime-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>In a rush?</span>
                <span className="text-zinc-400 font-medium">
                  Tell us your budget &amp; niche and we&apos;ll match 3 editors to your WhatsApp in 2 hours.
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-lime-400 hover:bg-lime-300 active:scale-95 text-black text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-lime-400/20 w-full sm:w-auto whitespace-nowrap"
            >
              <span>Match 3 Editors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Concierge Micro-Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-lime-400/20 border border-lime-400/50 text-lime-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white font-display">
                  Brief Received! Matches in Progress ⚡
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  We are hand-matching 3 vetted Indian video editors matching your budget ({selectedBudget}) and niche ({selectedNiche}). We&apos;ll ping your WhatsApp directly within 2 hours.
                </p>

                <div className="pt-3 border-t border-zinc-900 space-y-2">
                  <button
                    type="button"
                    onClick={handleDirectWhatsApp}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 fill-black" />
                    <span>Ping Concierge on WhatsApp Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false)
                      setIsOpen(false)
                      handleDismiss()
                    }}
                    className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-semibold"
                  >
                    Close &amp; Continue Browsing
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[10px] font-black uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    <span>Matched in Under 2 Hours</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                    Fast-Track Editor Match
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Skip searching through profiles. Share your project specs and our team will match 3 vetted editors straight to your WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* WhatsApp input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Your WhatsApp Number <span className="text-lime-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                      />
                    </div>
                  </div>

                  {/* Niche selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Video Format / Niche <span className="text-lime-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {NICHES.map((niche) => {
                        const isSelected = selectedNiche === niche
                        return (
                          <button
                            key={niche}
                            type="button"
                            onClick={() => setSelectedNiche(niche)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                              isSelected
                                ? 'bg-lime-400 text-black border-lime-400 font-extrabold shadow-sm'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {niche}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Budget selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Budget Per Video <span className="text-lime-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGETS.map((b) => {
                        const isSelected = selectedBudget === b
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBudget(b)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                              isSelected
                                ? 'bg-lime-400 text-black border-lime-400 font-extrabold shadow-sm'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {b}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Optional notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Reference Channel or Project Notes <span className="text-zinc-500">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need high-retention Iman Gadzhi style captions, 4 reels/week..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-lime-400/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SENDING BRIEF...</span>
                        </>
                      ) : (
                        <>
                          <span>SEND BRIEF &amp; MATCH 3 EDITORS →</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                        100% Free Concierge
                      </span>
                      <span>•</span>
                      <span>No Spam, Verified Editors Only</span>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
