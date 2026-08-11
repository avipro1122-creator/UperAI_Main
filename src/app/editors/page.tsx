'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import EditorCard, { EditorCardData } from '@/components/EditorCard'
import { databases } from '@/lib/appwrite/client'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import SetupNotice from '@/components/SetupNotice'
import { Query } from 'appwrite'

export default function DirectoryPage() {
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  if (!isAppwriteConfigured()) {
    return <SetupNotice />
  }

  // Fetch Editor Profiles from Appwrite
  useEffect(() => {
    async function fetchEditors() {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.orderDesc('$createdAt')]
        )

        const mapped = response.documents.map((doc: any) => {
          const rawUrl = doc.youtube_url || ''
          const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
          const videoId = match ? match[1] : 'L_LUpnjgPso'
          const editorId = doc.user_id || doc.$id
          const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'

          const category = (doc.specialty_tag || '').toLowerCase().includes('short')
            ? 'shorts'
            : (doc.specialty_tag || '').toLowerCase().includes('vfx')
            ? 'vfx'
            : 'long'

          const formatTag = category === 'shorts' ? 'Shorts' : category === 'vfx' ? 'Both' : 'Long-form'

          const cardData: EditorCardData = {
            id: editorId,
            handle: doc.handle || editorName.toLowerCase().replace(/[^a-z0-9]/g, '') || editorId,
            name: editorName,
            avatar_url: doc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`,
            headline: doc.specialty_tag || doc.headline || 'Video Editor',
            min_rate: Number(doc.base_rate || doc.min_rate || 1500),
            currency: doc.currency || 'INR',
            thumbnail_url: doc.preview_img || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            format_tag: formatTag,
            instagram_handle: doc.instagram_handle || doc.instagram || null,
          }

          return {
            id: editorId,
            name: editorName,
            specialty: doc.specialty_tag || 'Video Editor',
            category,
            cardData,
          }
        })

        setEditors(mapped)
      } catch (err) {
        console.error('Failed to load directory:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEditors()
  }, [])

  // Filter Editors by Search Term & Category
  const filteredEditors = editors.filter((editor) => {
    const query = searchQuery.toLowerCase().trim()
    const matchesQuery =
      !query ||
      editor.name.toLowerCase().includes(query) ||
      editor.specialty.toLowerCase().includes(query)

    const matchesCategory =
      selectedCategory === 'all' || editor.category === selectedCategory

    return matchesQuery && matchesCategory
  })

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 min-h-screen bg-[#09090b] text-white">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-bold text-lime-400 uppercase tracking-widest bg-lime-950/60 px-3 py-1 rounded-full border border-lime-800/40">
            DIRECTORY
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mt-3 font-display">All Verified Editors</h1>
          <p className="text-zinc-400 text-sm mt-1">Browse portfolios, upfront rates, and turnaround times.</p>
        </div>

        <Link className="px-5 py-3 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-xl transition-all shadow-md self-start md:self-auto" href="/onboarding">
          + List Your Work & Be The First
        </Link>
      </div>

      {/* Real-Time Search Bar & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
        {/* Search Box */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search editors, skills (e.g. Gaming, Premiere Pro, VFX)..."
            className="w-full pl-10 pr-8 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-all"
          />
          <svg
            className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto w-full sm:w-auto">
          {['all', 'shorts', 'long', 'vfx'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-lime-400 text-black font-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Editors' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid OR Empty State */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500 text-sm">Loading editors directory...</div>
      ) : filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <EditorCard editor={editor.cardData} key={editor.id} />
          ))}
        </div>
      ) : (
        /* "No Listed Editors Yet" Empty State Block */
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 bg-lime-950/80 border border-lime-800/50 rounded-2xl flex items-center justify-center mx-auto text-lime-400 text-2xl">
            🎬
          </div>
          <h2 className="text-2xl font-black text-white font-display">No Listed Editors Yet</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
            Be the first editor to list your portfolio, YouTube videos, and rates on UperAI!
          </p>
          <div className="pt-2">
            <Link className="inline-block px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-2xl transition-all shadow-lg text-sm" href="/onboarding">
              List Your Work & Be The First ↗
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
