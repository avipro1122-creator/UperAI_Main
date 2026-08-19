'use client'

import { Filter, Play, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Filter by Format & Style',
      description:
        'Choose between vertical 9:16 Shorts/Reels, 16:9 Long-Form, Gaming, or VFX motion edits in seconds.',
      icon: Filter,
      accent: 'text-lime-400',
      badgeBg: 'bg-lime-400/10 text-lime-300 border-lime-400/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(204,255,0,0.12)]',
    },
    {
      number: '02',
      title: 'Audition Real Showreels',
      description:
        'Watch authentic client showreels and proof of work right in the player before messaging anyone.',
      icon: Play,
      accent: 'text-sky-400',
      badgeBg: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(56,189,248,0.12)]',
    },
    {
      number: '03',
      title: 'Lock Rates & Direct Chat',
      description:
        'See transparent upfront rates in INR with zero platform cuts. Connect directly on WhatsApp with your brief.',
      icon: ShieldCheck,
      accent: 'text-emerald-400',
      badgeBg: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.12)]',
    },
  ]

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-zinc-800/60 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] ambient-glow-lime opacity-40 pointer-events-none blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-zinc-300 mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-lime-400" />
          <span>How UperAI Works</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          Hiring video editors, <span className="text-gradient-lime">simplified</span>
        </h2>
        <p className="text-sm text-zinc-400 mt-2.5 leading-relaxed">
          Skip endless DMs, price haggling, and fake portfolios. Here is how you find your next video editor in minutes.
        </p>
      </div>

      {/* 3 Steps Educational Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.number}
              className={`group relative p-6 sm:p-7 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300 ${step.glow} flex flex-col justify-between space-y-4`}
            >
              {/* Top Row: Icon + Step Number */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <Icon className={`w-5 h-5 ${step.accent}`} />
                </div>
                <span className="text-xs font-extrabold tracking-widest text-zinc-500 font-mono">
                  STEP {step.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Bottom Subtle Pill */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span className="text-[11px] font-semibold text-zinc-300">
                  100% Free for Creators
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
