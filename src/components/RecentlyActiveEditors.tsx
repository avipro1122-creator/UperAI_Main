'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import EditorCard, { EditorCardData } from '@/components/EditorCard'

export interface ExtendedEditorCardData extends EditorCardData {
  specialty?: string
  softwareTags?: string[]
}

interface RecentlyActiveEditorsProps {
  editors: ExtendedEditorCardData[]
  isServerError?: boolean
}

export default function RecentlyActiveEditors({ editors, isServerError = false }: RecentlyActiveEditorsProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEditors = useMemo(() => {
    if (!searchQuery.trim()) return editors
    const q = searchQuery.toLowerCase().trim()
    return editors.filter((editor) => {
      const matchName = editor.name.toLowerCase().includes(q)
      const matchHeadline = editor.headline ? editor.headline.toLowerCase().includes(q) : false
      const matchHandle = editor.handle.toLowerCase().includes(q)
      const matchFormat = editor.format_tag ? editor.format_tag.toLowerCase().includes(q) : false
      const matchSpecialty = editor.specialty ? editor.specialty.toLowerCase().includes(q) : false
      const matchSoftware = (editor.softwareTags || []).some((tag) => tag.toLowerCase().includes(q))
      const matchInstagram = editor.instagram_handle ? editor.instagram_handle.toLowerCase().includes(q) : false

      return (
        matchName ||
        matchHeadline ||
        matchHandle ||
        matchFormat ||
        matchSpecialty ||
        matchSoftware ||
        matchInstagram
      )
    })
  }, [editors, searchQuery])

  if (editors.length === 0 && !isServerError) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header with Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-100">
            Recently Active Editors
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Browse verified video editors, view portfolio clips, and send project briefs directly.
          </p>
        </div>

        {/* Search & View All controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search editors, skills (e.g. Gaming, Premiere Pro, VFX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[#14161F]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-medium text-gray-100 placeholder-gray-500 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-100 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/editors"
            className="text-xs font-semibold text-gray-400 hover:text-gray-100 underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            View all ({filteredEditors.length})
          </Link>
        </div>
      </div>

      {/* Editor Grid, Server Maintenance Notice, or Empty Search Result */}
      {isServerError ? (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-amber-300">
            ⚡ We are currently undergoing brief backend maintenance.
          </p>
          <p className="text-xs text-gray-400">
            Please refresh in a few minutes.
          </p>
        </div>
      ) : filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <EditorCard key={editor.handle} editor={editor} />
          ))}
        </div>
      ) : (
        <div className="bg-[#14161F]/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-gray-200">
            No editors match "{searchQuery}"
          </p>
          <p className="text-xs text-gray-500">
            Try searching for another skill, software tag (e.g. Premiere Pro, After Effects), or category.
          </p>
        </div>
      )}
    </section>
  )
}
