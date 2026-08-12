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
}

export default function RecentlyActiveEditors({ editors }: RecentlyActiveEditorsProps) {
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

  if (editors.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header with Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Recently Active Editors
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Browse verified video editors, view portfolio clips, and send project briefs directly.
          </p>
        </div>

        {/* Search & View All controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search editors, skills (e.g. Gaming, Premiere Pro, VFX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/editors"
            className="text-xs font-semibold text-zinc-300 hover:text-white underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            View all ({filteredEditors.length})
          </Link>
        </div>
      </div>

      {/* Editor Grid or Empty Search Result */}
      {filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <EditorCard key={editor.handle} editor={editor} />
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-zinc-300">
            No editors match "{searchQuery}"
          </p>
          <p className="text-xs text-zinc-500">
            Try searching for another skill, software tag (e.g. Premiere Pro, After Effects), or category.
          </p>
        </div>
      )}
    </section>
  )
}
