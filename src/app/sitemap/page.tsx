import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { getPublicEditors } from '@/lib/firebase/firestore'
import { MapPin, Compass, Users, Sparkles, Shield, ArrowUpRight } from 'lucide-react'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Sitemap — UperAI Directory & Pages Index',
  description:
    'Overview of all pages, verified video editor profiles, showreels, and directory categories on UperAI.',
  openGraph: {
    title: 'Sitemap — UperAI Directory & Pages Index',
    description: 'Explore the full structure and directory of verified Indian video editors on UperAI.',
    url: 'https://www.uperai.in/sitemap',
  },
}

export default async function SitemapPage() {
  const editors = await getPublicEditors(100)

  const corePages = [
    { title: 'Home / Marketplace', path: '/', description: 'Featured showreels, budget filter, and recent editors' },
    { title: 'Browse All Editors', path: '/editors', description: 'Complete searchable directory with niche tags and pricing' },
    { title: 'About UperAI', path: '/about', description: 'Our mission and why we built an upfront pricing marketplace' },
    { title: 'Terms & Conditions', path: '/terms', description: 'Platform guidelines and user agreements' },
    { title: 'Privacy Policy', path: '/privacy', description: 'How we collect, use, share and protect your data' },
    { title: 'Sign In / Account', path: '/login', description: 'Google authentication for creators and editors' },
    { title: 'Editor Onboarding', path: '/onboarding', description: 'Create and list your editing portfolio' },
  ]

  const categories = [
    { name: 'Shorts & Reels Specialists', filter: 'shorts', description: 'High-retention vertical 9:16 video editing for TikTok, YouTube Shorts, and Instagram Reels' },
    { name: '16:9 Long-Form Specialists', filter: 'long', description: 'Engaging YouTube documentary, storytelling, and vlog editing' },
    { name: 'VFX & Motion Designers', filter: 'vfx', description: 'Custom 2D/3D motion graphics, 3D tracking, and visual effects' },
  ]

  return (
    <div className="min-h-screen bg-[#0E1017] text-gray-100 selection:bg-lime-400 selection:text-black">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-4 border-b border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" /> HTML SITEMAP & DIRECTORY
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Platform Sitemap
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            A comprehensive index of all public pages, verified video editor profiles, category directories, and platform resources on UperAI.
          </p>
        </div>

        {/* SECTION 1: Core Navigation & Platform Pages */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-lime-400 font-bold text-lg font-display">
            <Compass className="w-5 h-5" />
            <h2>Core Platform Pages</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {corePages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="p-5 rounded-2xl bg-[#14161F]/80 hover:bg-white/5 border border-white/10 hover:border-lime-400/40 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-lime-300 transition-colors">
                    {page.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-lime-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{page.description}</p>
                <span className="text-[11px] font-mono text-zinc-500 block pt-1">{page.path}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 2: Editing Niches & Categories */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-lg font-display">
            <Sparkles className="w-5 h-5" />
            <h2>Video Editing Specializations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.filter}
                href={`/editors`}
                className="p-5 rounded-2xl bg-[#14161F]/80 hover:bg-white/5 border border-white/10 hover:border-sky-400/40 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                    {cat.name}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-sky-400 transition-transform" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 3: Live Verified Editor Profiles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-lg font-display">
              <Users className="w-5 h-5" />
              <h2>Verified Editor Portfolios ({editors.length})</h2>
            </div>
            <Link href="/editors" className="text-xs font-bold text-lime-400 hover:underline">
              View All Directory →
            </Link>
          </div>

          {editors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {editors.map((editor) => {
                const handle = editor.handle || editor.user_id || editor.id
                const name = editor.full_name || editor.display_name || editor.name || 'Editor'
                const specialty = editor.specialty_tag || editor.headline || 'Video Editor'
                const rate = editor.base_rate || editor.min_rate

                return (
                  <Link
                    key={editor.id}
                    href={`/editors/${handle}`}
                    className="p-4 rounded-2xl bg-[#14161F]/60 hover:bg-[#14161F] border border-white/10 hover:border-pink-400/40 transition-all space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs text-white group-hover:text-pink-300 transition-colors truncate">
                        {name}
                      </p>
                      {rate && (
                        <span className="text-[10px] font-extrabold text-lime-400 shrink-0">
                          ₹{rate}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{specialty}</p>
                    <span className="text-[10px] font-mono text-zinc-500 block truncate">
                      /editors/{handle}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-500">
              No public editor profiles listed yet.
            </div>
          )}
        </section>

        {/* SECTION 4: Machine Readable Feeds */}
        <section className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-zinc-300">
              <Shield className="w-4 h-4 text-lime-400" />
              <span>XML Sitemap &amp; Robots Feed</span>
            </div>
            <p className="text-xs text-zinc-500">
              Automated dynamic XML feeds formatted for Google Search Console and web crawlers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-lime-300 transition-colors inline-flex items-center gap-1"
            >
              sitemap.xml <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              robots.txt <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
