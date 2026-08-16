'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { X, Search } from 'lucide-react'

interface BrowseFiltersProps {
  /** When true, renders as an inline sidebar panel. When false (mobile sheet),
   *  the parent controls visibility via `open` prop. */
  variant: 'sidebar' | 'sheet'
  open?: boolean
  onClose?: () => void
}

export default function BrowseFilters({ variant, open, onClose }: BrowseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams?.get('q') ?? '')
  const [format, setFormat] = useState(searchParams?.get('format') ?? '')
  const [rateMin, setRateMin] = useState(searchParams?.get('rate_min') ?? '')
  const [rateMax, setRateMax] = useState(searchParams?.get('rate_max') ?? '')
  const [sort, setSort] = useState(searchParams?.get('sort') ?? 'newest')

  function applyFilters() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (format) params.set('format', format)
    if (rateMin) params.set('rate_min', rateMin)
    if (rateMax) params.set('rate_max', rateMax)
    if (sort && sort !== 'newest') params.set('sort', sort)

    startTransition(() => {
      router.push(`/editors${params.toString() ? '?' + params.toString() : ''}`)
    })

    if (variant === 'sheet') onClose?.()
  }

  function clearFilters() {
    setQ('')
    setFormat('')
    setRateMin('')
    setRateMax('')
    setSort('newest')
    startTransition(() => {
      router.push('/editors')
    })
    if (variant === 'sheet') onClose?.()
  }

  const hasActive =
    !!q.trim() || !!format || !!rateMin || !!rateMax || (!!sort && sort !== 'newest')

  const inputClass =
    'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors'

  const labelClass = 'text-xs font-medium text-zinc-400 block mb-1.5'

  // ── SHEET (mobile / tablet overlay) ─────────────────────────
  if (variant === 'sheet') {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter editors"
          className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl px-5 pt-4 pb-8 transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Handle */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-bold text-white">
              Filter &amp; Search
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <FilterFields
            q={q}
            setQ={setQ}
            format={format}
            setFormat={setFormat}
            rateMin={rateMin}
            setRateMin={setRateMin}
            rateMax={rateMax}
            setRateMax={setRateMax}
            sort={sort}
            setSort={setSort}
            inputClass={inputClass}
            labelClass={labelClass}
          />

          <div className="flex gap-3 mt-6">
            {hasActive && (
              <button
                onClick={clearFilters}
                className="btn-secondary text-sm px-4 py-2.5 rounded-xl flex-1"
              >
                Clear all
              </button>
            )}
            <button
              onClick={applyFilters}
              className="btn-primary text-sm px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── SIDEBAR (desktop) ────────────────────────────────────────
  return (
    <aside className="w-full">
      <div className="sticky top-24 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-white">Filter &amp; Search</h2>
          {hasActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <FilterFields
          q={q}
          setQ={setQ}
          format={format}
          setFormat={setFormat}
          rateMin={rateMin}
          setRateMin={setRateMin}
          rateMax={rateMax}
          setRateMax={setRateMax}
          sort={sort}
          setSort={setSort}
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <button
          onClick={applyFilters}
          className="btn-primary text-sm px-4 py-2.5 rounded-xl w-full flex items-center justify-center gap-1.5"
        >
          <Search className="w-4 h-4" /> Search Editors
        </button>
      </div>
    </aside>
  )
}

// ── Shared filter fields ─────────────────────────────────────────────────────

interface FieldsProps {
  q: string
  setQ: (v: string) => void
  format: string
  setFormat: (v: string) => void
  rateMin: string
  setRateMin: (v: string) => void
  rateMax: string
  setRateMax: (v: string) => void
  sort: string
  setSort: (v: string) => void
  inputClass: string
  labelClass: string
}

function FilterFields({
  q, setQ,
  format, setFormat,
  rateMin, setRateMin,
  rateMax, setRateMax,
  sort, setSort,
  inputClass, labelClass,
}: FieldsProps) {
  return (
    <div className="space-y-5">
      {/* Search Input */}
      <div>
        <label className={labelClass}>Search</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Name, skills, software..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Format */}
      <div>
        <label className={labelClass}>Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className={inputClass}
        >
          <option value="">Any</option>
          <option value="shorts">Shorts</option>
          <option value="long">Long-form</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Rate range */}
      <div>
        <label className={labelClass}>Rate range (₹)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
            className={inputClass}
          />
          <span className="text-zinc-600 text-xs shrink-0">to</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={rateMax}
            onChange={(e) => setRateMax(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className={labelClass}>Sort by</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={inputClass}
        >
          <option value="newest">Newest first</option>
          <option value="rate_asc">Rate: Low to High</option>
          <option value="rate_desc">Rate: High to Low</option>
        </select>
      </div>
    </div>
  )
}
