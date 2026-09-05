import { Instagram, ArrowUpRight, Sparkles, Users, Video } from 'lucide-react'

export default function JoinCommunitySection() {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-lime-400/10 blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-zinc-800/80 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl">
        {/* Decorative corner glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-600/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-lime-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left content: Header, text & perks */}
          <div className="max-w-2xl text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-zinc-300 shadow-inner">
              <Users className="w-3.5 h-3.5 text-lime-400" />
              <span>Join the Community</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Connect with India’s top{' '}
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-lime-400 bg-clip-text text-transparent">
                creators &amp; editors
              </span>
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Be part of our growing creative network. Discover daily showreel highlights, video editing breakdowns, pricing insights, and collaborate directly with fellow creators and editors.
            </p>

            {/* Micro perks */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2 text-xs font-medium text-zinc-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                <Video className="w-3.5 h-3.5 text-lime-400" /> Showreel Spotlights
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Editing Tips &amp; Insights
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                <Users className="w-3.5 h-3.5 text-sky-400" /> Creator Networking
              </span>
            </div>
          </div>

          {/* Right action: Instagram Community Card / CTA Button */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col items-center sm:items-stretch gap-3">
            <a
              href="https://www.instagram.com/uperai26/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join UperAI community on Instagram"
              className="group relative inline-flex items-center justify-center gap-3.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white font-bold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-pink-100 font-semibold">Join Community</div>
                <div className="font-extrabold flex items-center gap-1.5">
                  <span>@uperai26 on Instagram</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </a>

            <p className="text-[11px] text-zinc-500 text-center">
              Follow along for updates, spotlights &amp; announcements
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
