export default function EditorCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-sm" aria-hidden="true">
      {/* Thumbnail */}
      <div className="w-full aspect-video skeleton-shimmer" />

      {/* Body */}
      <div className="p-3.5 space-y-2.5">
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded skeleton-shimmer" />
            <div className="h-2 w-1/3 rounded skeleton-shimmer" />
          </div>
        </div>

        {/* Headline */}
        <div className="h-2.5 w-4/5 rounded skeleton-shimmer" />

        {/* Badges */}
        <div className="flex gap-1.5">
          <div className="h-4 w-16 rounded-full skeleton-shimmer" />
          <div className="h-4 w-12 rounded-full skeleton-shimmer" />
          <div className="h-4 w-12 rounded-full skeleton-shimmer" />
        </div>

        {/* Format + rate row */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          <div className="h-4 w-14 rounded-full skeleton-shimmer" />
          <div className="h-3 w-12 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}
