'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-lime-400 selection:text-black">
      <Navbar/>

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
            <h3 className="text-lg font-black text-white">For Content Creators</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Skip the inbox clutter. Browse verified YouTube showreels, filter by niche or price, and connect directly with editors on WhatsApp—no hidden platform markups or slow agency delays.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <span className="text-2xl">⚡</span>
            <h3 className="text-lg font-black text-white">For Editors & Visual Artists</h3>
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
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-lime-400/50 rounded-3xl p-6 space-y-3 transition-all shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-lime-400 text-black font-black flex items-center justify-center text-sm shadow-md">
                  AR
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Avanish Rai</h3>
                  <p className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Co-Founder, Developer & Content Lead</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A Game Artist, Full-Stack Developer, and Content Creator with over 380,000 subscribers, Avanish built UperAI from the ground up. Having experienced the friction of managing video production pipelines, game development, and short-form/long-form content creation firsthand, he engineered UperAI to give creators a frictionless way to find verified editing talent.
              </p>
            </div>

            {/* Kumar Karan */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-lime-400/50 rounded-3xl p-6 space-y-3 transition-all shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-white font-black flex items-center justify-center text-sm shadow-md">
                  KK
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Kumar Karan</h3>
                  <p className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Co-Founder & Operations Lead</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Leads creator relations, editor onboarding, and marketplace operations. Kumar Karan focuses on verifying editor talent and ensuring seamless, direct WhatsApp communication across the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Footer */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-xl font-black text-white">Ready to hire or showcase your work?</h3>
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
  );
}
