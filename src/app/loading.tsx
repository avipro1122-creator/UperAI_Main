import EditorCardSkeleton from '@/components/EditorCardSkeleton'

export default function HomeLoading() {
  return (
    <div className="bg-[#0E1017] text-gray-100 min-h-screen" aria-busy="true" aria-label="Loading UperAI">
      {/* ── Hero skeleton ─────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 border-b border-zinc-800/60 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            {/* Status badges */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="h-8 w-64 rounded-full skeleton-shimmer" />
              <div className="h-8 w-48 rounded-full skeleton-shimmer" />
            </div>

            {/* Toggle */}
            <div className="h-11 w-64 rounded-full skeleton-shimmer" />

            {/* Headline */}
            <div className="space-y-3">
              <div className="h-10 sm:h-14 w-full max-w-lg rounded-xl skeleton-shimmer" />
              <div className="h-10 sm:h-14 w-2/3 max-w-sm rounded-xl skeleton-shimmer" />
            </div>

            {/* Subheadline */}
            <div className="h-4 w-full max-w-md rounded skeleton-shimmer" />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <div className="h-12 w-full sm:w-44 rounded-xl skeleton-shimmer" />
              <div className="h-12 w-full sm:w-44 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-5 relative mt-6 lg:mt-0">
            <div className="relative w-full max-w-sm mx-auto lg:max-w-none h-[420px]">
              <div className="absolute top-2 left-0 sm:-left-2 w-[270px] sm:w-[290px] aspect-[4/5] rounded-2xl skeleton-shimmer" />
              <div className="absolute top-20 right-0 sm:-right-2 w-[260px] sm:w-[280px] aspect-[4/5] rounded-2xl skeleton-shimmer opacity-80" />
              <div className="absolute bottom-2 left-6 sm:left-8 w-[260px] sm:w-[280px] aspect-[4/5] rounded-2xl skeleton-shimmer opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketplace skeleton ─────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="pb-4 border-b border-white/10 space-y-3">
            <div className="h-5 w-28 rounded-full skeleton-shimmer" />
            <div className="h-8 w-72 rounded skeleton-shimmer" />
            <div className="h-4 w-96 max-w-full rounded skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 rounded-3xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Directory grid skeleton ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-800 pb-4">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded skeleton-shimmer" />
            <div className="h-3 w-80 max-w-full rounded skeleton-shimmer" />
          </div>
          <div className="h-9 w-full sm:w-80 rounded-xl skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <EditorCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
