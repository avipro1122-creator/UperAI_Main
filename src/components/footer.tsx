import Link from 'next/link'
import { Video } from 'lucide-react'
import ListYourWorkButton from '@/components/ListYourWorkButton'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <span className="font-display font-bold text-sm text-white">UperAI</span>
          </div>
          <p className="text-xs text-zinc-500 text-center sm:text-left max-w-md">
            Real portfolios you can play, rates upfront. Built by a creator who's been on both sides of this.
          </p>
          <div className="flex space-x-6 text-xs text-zinc-500">
            <Link href="/editors" className="hover:text-white transition-colors">Browse editors</Link>
            <ListYourWorkButton className="hover:text-white transition-colors">List your work</ListYourWorkButton>
          </div>
        </div>
        <div className="border-t border-zinc-800/60 mt-8 pt-6 text-center sm:text-left">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} UperAI</p>
        </div>
      </div>
    </footer>
  )
}
