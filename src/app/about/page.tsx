import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Linkedin } from 'lucide-react'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'About UperAI — The Video Editor Marketplace for Creators',
  description:
    'Learn how UperAI eliminates friction between YouTube creators and verified Indian video editors with upfront rates in INR and direct WhatsApp hiring.',
  alternates: {
    canonical: 'https://www.uperai.in/about',
  },
  openGraph: {
    title: 'About UperAI — The Video Editor Marketplace for Creators',
    description:
      'Connecting India’s finest video editors, motion designers, and VFX artists directly with content creators.',
    url: 'https://www.uperai.in/about',
  },
}

export default function AboutPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.uperai.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About UperAI',
        item: 'https://www.uperai.in/about',
      },
    ],
  }

  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About UperAI',
    description:
      'The open marketplace connecting India’s finest video editors, motion designers, and VFX artists directly with content creators who are actively hiring.',
    url: 'https://www.uperai.in/about',
    mainEntity: {
      '@type': 'Organization',
      name: 'UperAI',
      url: 'https://www.uperai.in',
      founder: [
        {
          '@type': 'Person',
          name: 'Avanish Rai',
          jobTitle: 'Founder, Developer & Content Lead',
          sameAs: 'https://www.linkedin.com/in/avanish-rai-proshot/',
        },
        {
          '@type': 'Person',
          name: 'Kumar Karan',
          jobTitle: 'Co-Founder & Operations Lead',
          sameAs: 'https://www.linkedin.com/in/karan-kr-v-83746b272/',
        },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-lime-400 selection:text-black">
      <JsonLd data={breadcrumbSchema} id="about-breadcrumb-schema" />
      <JsonLd data={aboutPageSchema} id="about-page-schema" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Header Badge */}
        <div className="space-y-4 text-center sm:text-left">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-lime-400 transition-colors" href="/">
            ← Back to Marketplace
          </Link>
          <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-lime-400 uppercase tracking-widest">
            About UperAI
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Stop hiring in Instagram DMs. <br />
            <span className="text-lime-400">Welcome to UperAI.</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            The open marketplace connecting India's finest video editors, motion designers, and VFX artists directly with content creators who are actively hiring.
          </p>
        </div>

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <span className="text-2xl">🎬</span>
            <h2 className="text-lg font-black text-white">For Content Creators</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Skip the inbox clutter. Browse verified YouTube showreels, filter by niche or price, and connect directly with editors on WhatsApp—no hidden platform markups or slow agency delays.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <span className="text-2xl">⚡</span>
            <h2 className="text-lg font-black text-white">For Editors & Visual Artists</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Show your work, set your own rates in INR, and get discovered by serious creators. Build your public portfolio page in minutes and get direct project leads on WhatsApp.
            </p>
          </div>
        </div>

        {/* MEET THE FOUNDERS SECTION */}
        <div className="space-y-6 pt-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-lime-400">Meet the Founders</h2>
            <p className="text-xs text-zinc-400">Built by creators and developers for the Indian creator economy.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Avanish Rai */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-lime-400/50 rounded-3xl p-6 space-y-3 transition-all shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-lime-400 text-black font-black flex items-center justify-center text-sm shadow-md">
                      AR
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Avanish Rai</h3>
                      <p className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Founder, Developer & Content Lead</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A Game Artist, Full-Stack Developer, and Content Creator with over 380,000 subscribers, Avanish built UperAI from the ground up. Having experienced the friction of managing video production pipelines, game development, and short-form/long-form content creation firsthand, he engineered UperAI to give creators a frictionless way to find verified editing talent.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.linkedin.com/in/avanish-rai-proshot/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>Connect on LinkedIn ↗</span>
                </a>
              </div>
            </div>

            {/* Kumar Karan */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-lime-400/50 rounded-3xl p-6 space-y-3 transition-all shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-white font-black flex items-center justify-center text-sm shadow-md">
                      KK
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Kumar Karan</h3>
                      <p className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Co-Founder & Operations Lead</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Leads creator relations, editor onboarding, and marketplace operations. Kumar Karan focuses on verifying editor talent and ensuring seamless, direct WhatsApp communication across the platform.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.linkedin.com/in/karan-kr-v-83746b272/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>Connect on LinkedIn ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Footer */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-xl font-black text-white">Ready to hire or showcase your work?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link className="w-full sm:w-auto px-6 py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg" href="/#marketplace-section">
              Browse Marketplace ↗
            </Link>
            <Link className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs rounded-xl transition-all" href="/profile">
              List Your Work as an Editor
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
