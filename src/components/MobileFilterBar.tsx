'use client'

import { useState } from 'react'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import BrowseFilters from './BrowseFilters'

interface MobileFilterBarProps {
  /** Counts how many filters are currently active so we can badge the button. */
  activeCount: number
}

export default function MobileFilterBar({ activeCount }: MobileFilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      {/* Sticky bar — hidden on desktop where sidebar takes over */}
      <div className="lg:hidden sticky top-[60px] z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => setSheetOpen(true)}
          className="relative flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full px-3.5 py-2 transition-colors"
          aria-label="Open filters and sort"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-white text-zinc-900 text-[10px] font-bold flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full px-3.5 py-2 transition-colors"
          aria-label="Open sort options"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort</span>
        </button>
      </div>

      {/* Sheet — renders as a bottom drawer on mobile/tablet */}
      <BrowseFilters
        variant="sheet"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
