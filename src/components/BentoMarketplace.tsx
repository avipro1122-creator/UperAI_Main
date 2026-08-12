'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export interface BentoEditorItem {
  id: string
  name: string
  avatar?: string
  specialty?: string
  category?: string
  headline?: string
  rate?: number
  rateLabel?: string
  turnaround?: string
  badgeText?: string
  videoId?: string
  previewImg?: string
  softwareTags?: string[]
}

export default function BentoMarketplace({ dbEditors = [] }: { dbEditors?: BentoEditorItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredEditors = dbEditors.filter((editor) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      editor.name?.toLowerCase().includes(query) ||
      editor.specialty?.toLowerCase().includes(query)

    const catKey = selectedCategory === 'long form' ? 'long' : selectedCategory
    const matchesCategory =
      selectedCategory === 'all' ||
      editor.category === selectedCategory ||
      editor.category === catKey ||
      (catKey === 'long' && editor.category?.includes('long'))

    return matchesSearch && matchesCategory
  })

  return (
    <section id="marketplace-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-800/80 shadow-2xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search editors, skills (e.g. Gaming, Premiere Pro)..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-all"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {['ALL', 'SHORTS', 'LONG FORM', 'VFX'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat.toLowerCase())}
              className={`px-4 py-2 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${
                selectedCategory === cat.toLowerCase()
                  ? 'bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Cards Grid */}
      {filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <Link
              key={editor.id}
              href={`/editors/${editor.id}`}
              className="group relative bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 rounded-3xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(163,230,53,0.15)] space-y-4 block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-lime-400 flex items-center justify-center font-black text-white text-xs">
                    {editor.name ? editor.name.substring(0, 2).toUpperCase() : 'AR'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm group-hover:text-lime-400 transition-colors">
                      {editor.name}
                    </h3>
                    <span className="inline-block text-[10px] bg-pink-950/60 text-pink-400 font-bold px-2 py-0.5 rounded-full border border-pink-800/40">
                      {editor.specialty || 'Video Editor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="flex items-center justify-between text-xs font-extrabold pt-3 border-t border-zinc-800/60 text-zinc-300">
                <span className="text-lime-400">From ₹{Number(editor.rate || 1500).toLocaleString()}</span>
                <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">View Profile ↗</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-lime-950/80 border border-lime-800/50 rounded-2xl flex items-center justify-center mx-auto text-lime-400 text-xl">
            🎬
          </div>
          <h2 className="text-xl font-black text-white">No Editors Found</h2>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Be the first editor to list your portfolio, YouTube showreels, and rates on UperAI!
          </p>
          <div className="pt-2">
            <Link className="inline-block px-8 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] text-xs uppercase tracking-wider" href="/profile">
              + List Your Work & Be The First ↗
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
