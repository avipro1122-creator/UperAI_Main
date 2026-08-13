import Link from 'next/link'
import { Video, Mail, MessageSquareHeart } from 'lucide-react'
import ListYourWorkButton from '@/components/ListYourWorkButton'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 text-center md:text-left">
          {/* Logo & Tagline */}
          <div className="space-y-3 max-w-sm flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-zinc-950" />
              </div>
              <span className="font-display font-bold text-sm text-white">UperAI</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real portfolios you can play, rates upfront. Built by creators who have been on both sides of this.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-zinc-400">
            <Link href="/about" className="hover:text-lime-400 transition-colors">About</Link>
            <Link href="/editors" className="hover:text-lime-400 transition-colors">Browse Editors</Link>
            <Link href="/terms" className="hover:text-lime-400 transition-colors">Terms &amp; Conditions</Link>
            <ListYourWorkButton className="hover:text-lime-400 transition-colors">List Your Work</ListYourWorkButton>
          </div>

          {/* Suggestions & Contact Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center md:text-right space-y-1.5 w-full sm:w-auto shadow-md">
            <div className="flex items-center justify-center md:justify-end gap-1.5 text-xs font-bold text-lime-400">
              <MessageSquareHeart className="w-3.5 h-3.5 text-lime-400" />
              <span>We Are Open to Suggestions</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Have feedback or feature requests? Email us directly:
            </p>
            <a
              href="mailto:support@uperai.in"
              className="inline-flex items-center justify-center md:justify-end gap-1.5 text-xs font-black text-white hover:text-lime-400 transition-colors pt-1"
            >
              <Mail className="w-3.5 h-3.5 text-lime-400" />
              <span>support@uperai.in</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} UperAI. All rights reserved.</p>
            <span className="text-zinc-700">•</span>
            <Link href="/terms" className="hover:text-lime-400 transition-colors underline underline-offset-4 decoration-zinc-800 hover:decoration-lime-400">
              Terms &amp; Conditions
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span>Got feedback?</span>
            <a href="mailto:support@uperai.in" className="font-semibold text-zinc-300 hover:text-lime-400 transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-lime-400">
              support@uperai.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
