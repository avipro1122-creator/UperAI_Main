import React from 'react'

export default function HomeLoading() {
  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen" aria-busy="true" aria-label="Loading UperAI">
      {/* ── Hero skeleton ─────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-14 pb-12 sm:pb-24 border-b border-zinc-800/60 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-10 items-center">
          {/* Left column */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-5 sm:space-y-6">
            {/* Status badges */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-56 rounded-full bg-zinc-900 skeleton-shimmer" />
              <div className="h-7 w-28 rounded-full bg-zinc-900 skeleton-shimmer" />
            </div>

            {/* Audience switcher */}
            <div className="h-9 w-60 rounded-full bg-zinc-900 skeleton-shimmer" />

            {/* Headline */}
            <div className="space-y-2.5">
              <div className="h-10 sm:h-14 w-full max-w-md rounded-2xl bg-zinc-900 skeleton-shimmer" />
              <div className="h-10 sm:h-14 w-3/4 max-w-sm rounded-2xl bg-zinc-900 skeleton-shimmer" />
            </div>

            {/* Subheadline */}
            <div className="h-4 w-full max-w-lg rounded-lg bg-zinc-900 skeleton-shimmer" />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="h-12 w-full sm:w-40 rounded-xl bg-zinc-900 skeleton-shimmer" />
              <div className="h-12 w-full sm:w-40 rounded-xl bg-zinc-900 skeleton-shimmer" />
            </div>
          </div>

          {/* Right column: 9:16 Showreel Cards */}
          <div className="lg:col-span-6 xl:col-span-5 relative mt-4 sm:mt-0 flex items-center justify-center">
            <div className="relative w-full max-w-sm h-[420px] sm:h-[500px] flex items-center justify-center">
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 w-[240px] sm:w-[275px] aspect-[9/16] rounded-2xl bg-zinc-900 border border-white/10 skeleton-shimmer z-20 shadow-2xl" />
              <div className="absolute top-4 right-1 w-[220px] sm:w-[250px] aspect-[9/16] rounded-2xl bg-zinc-900/70 border border-white/5 skeleton-shimmer z-10 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feed skeleton ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="h-20 rounded-2xl bg-zinc-900/80 border border-white/10 skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4 space-y-3">
              <div className="aspect-video rounded-xl bg-zinc-800 skeleton-shimmer" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 rounded bg-zinc-800 skeleton-shimmer" />
                  <div className="h-2.5 w-20 rounded bg-zinc-800 skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
