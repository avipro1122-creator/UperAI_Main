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

    const matchesCategory =
      selectedCategory === 'all' ||
      editor.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      editor.specialty?.toLowerCase().includes(selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  return (
    <section id="marketplace-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Section Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Recently Active Editors</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Browse verified video editors, view portfolio showreels, and send project briefs directly.
          </p>
        </div>

        {/* Search Input & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search editors, skills..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-all"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SHORTS', 'LONG FORM', 'VFX'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat.toLowerCase()
                    ? 'bg-lime-400 text-black shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Cards Grid */}
      {filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <Link
              key={editor.id}
              href={`/editors/${editor.id}`}
              className="group bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] shadow-xl space-y-4 block"
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

              <div className="flex items-center justify-between text-xs font-extrabold pt-3 border-t border-zinc-800 text-zinc-300">
                <span className="text-lime-400">From ₹{Number(editor.rate || 1500).toLocaleString()}</span>
                <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">View Profile ↗</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-10 text-center space-y-4 max-w-md mx-auto my-8">
          <p className="text-zinc-400 text-xs">No editors match your search criteria.</p>
        </div>
      )}
    </section>
  )
}
